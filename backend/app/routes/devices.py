from datetime import datetime, timezone
import logging
from typing import Literal
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from app.db import supabase
from app.models import (
    ALLOWED_STATUSES,
    DeviceCreate,
    DeviceListOut,
    DeviceOut,
    DeviceStatus,
    DeviceUpdate,
)
from app.services.email import (
    send_creation_email_background,
    send_status_change_email_background,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def format_device_name(record: dict) -> str:
    parts = [record.get("device_type"), record.get("device_brand"), record.get("device_model")]
    return " ".join([p for p in parts if p]) or "Device"


@router.post("", response_model=DeviceOut)
def create_device(device: DeviceCreate, background_tasks: BackgroundTasks):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        payload = device.model_dump()
        result = supabase.table("device_records").insert(payload).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create device record")

        record_data = result.data[0]
        device_id = record_data["id"]
        ticket_code = record_data.get("ticket_code")

        # If DB default didn't assign a ticket_code, generate one
        if not ticket_code:
            gen_code = "DR-" + uuid.uuid4().hex[:8].upper()
            try:
                up_res = supabase.table("device_records").update({"ticket_code": gen_code}).eq("id", device_id).execute()
                if up_res.data:
                    record_data = up_res.data[0]
                    ticket_code = record_data.get("ticket_code") or gen_code
            except Exception as e:
                logger.warning("Could not persist generated ticket_code: %s", e)
                ticket_code = gen_code
                record_data["ticket_code"] = gen_code

        # Insert initial status_history row
        history_id = None
        try:
            history_res = (
                supabase.table("status_history")
                .insert(
                    {
                        "device_id": device_id,
                        "old_status": None,
                        "new_status": record_data.get("status", "pending"),
                        "email_sent": False,
                    }
                )
                .execute()
            )
            if history_res.data:
                history_id = history_res.data[0]["id"]
        except Exception as e:
            logger.warning("Could not insert initial status_history: %s", e)

        # Send creation email if customer_email is present
        customer_email = record_data.get("customer_email")
        if customer_email and ticket_code:
            device_name = format_device_name(record_data)
            background_tasks.add_task(
                send_creation_email_background,
                history_id,
                customer_email,
                ticket_code,
                device_name,
            )

        return DeviceOut(**record_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("", response_model=DeviceListOut)
def list_devices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: DeviceStatus | Literal["all"] = "all",
    sort_by: Literal["customer_name", "date_received", "status"] = "date_received",
    sort_direction: Literal["asc", "desc"] = "desc",
):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        start = (page - 1) * page_size
        end = start + page_size - 1
        query = supabase.table("device_records").select("*", count="exact")

        if search:
            search_term = search.strip()
            if search_term:
                query = query.or_(
                    ",".join(
                        [
                            f"customer_name.ilike.%{search_term}%",
                            f"customer_phone.ilike.%{search_term}%",
                            f"serial_number.ilike.%{search_term}%",
                        ]
                    )
                )

        if status != "all":
            query = query.eq("status", status)

        result = (
            query.order(sort_by, desc=sort_direction == "desc")
            .range(start, end)
            .execute()
        )

        return DeviceListOut(
            items=[DeviceOut(**row) for row in result.data],
            total=result.count or 0,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: str):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        result = supabase.table("device_records").select("*").eq("id", device_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Device record not found")

        return DeviceOut(**result.data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{device_id}", response_model=DeviceOut)
def update_device(device_id: str, device: DeviceUpdate, background_tasks: BackgroundTasks):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        if device.status is not None and device.status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid status '{device.status}'. Allowed statuses are: {', '.join(ALLOWED_STATUSES)}",
            )

        # 1. Load current record
        current_res = supabase.table("device_records").select("*").eq("id", device_id).single().execute()
        if not current_res.data:
            raise HTTPException(status_code=404, detail="Device record not found")
        current_record = current_res.data
        old_status = current_record.get("status")

        new_status = device.status
        status_changed = new_status is not None and new_status != old_status

        update_data = device.model_dump(exclude_none=True)

        # 2. Update status and dates
        if status_changed:
            if new_status == "completed" and "date_completed" not in device.model_fields_set:
                update_data["date_completed"] = datetime.now(timezone.utc).isoformat()
            elif new_status != "completed" and "date_completed" not in device.model_fields_set:
                update_data["date_completed"] = None

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = supabase.table("device_records").update(update_data).eq("id", device_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Device record not found")

        updated_record = result.data[0]

        # 3. If status changed, insert into status_history & send email
        if status_changed:
            history_id = None
            try:
                history_res = (
                    supabase.table("status_history")
                    .insert(
                        {
                            "device_id": device_id,
                            "old_status": old_status,
                            "new_status": new_status,
                            "email_sent": False,
                        }
                    )
                    .execute()
                )
                if history_res.data:
                    history_id = history_res.data[0]["id"]
            except Exception as e:
                logger.warning("Could not insert status_history: %s", e)

            # 4 & 5. If customer_email exists, send status-change email.
            # Completed is the final status, so emails stop after that one.
            customer_email = updated_record.get("customer_email")
            ticket_code = updated_record.get("ticket_code")
            if old_status != "completed" and customer_email and ticket_code:
                device_name = format_device_name(updated_record)
                background_tasks.add_task(
                    send_status_change_email_background,
                    history_id,
                    customer_email,
                    ticket_code,
                    device_name,
                    new_status,
                )

        return DeviceOut(**updated_record)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{device_id}")
def delete_device(device_id: str):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        result = supabase.table("device_records").delete().eq("id", device_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Device record not found")

        return {"message": "Device record deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
