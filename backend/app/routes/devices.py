from datetime import datetime, timezone
import logging
from typing import Any, Literal
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from app.db import supabase
from app.models import (
    ALLOWED_STATUSES,
    EMAIL_NOTIFIABLE_STATUSES,
    STATUS_LABELS,
    STATUS_MESSAGES,
    STATUS_TRANSITIONS,
    ChargeCreate,
    ChargeOut,
    ChargesSummaryOut,
    DeviceCreate,
    DeviceListOut,
    DeviceOut,
    DeviceStatus,
    DeviceUpdate,
    StatusConfigOut,
    validate_status_transition,
)
from app.services.email import (
    send_creation_email_background,
    send_device_tracking_email,
    send_status_change_email_background,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def format_device_name(record: Any) -> str:
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

        return DeviceOut.model_validate(record_data)
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
            items=[DeviceOut.model_validate(row) for row in (result.data or [])],
            total=result.count or 0,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/status-config", response_model=StatusConfigOut)
def get_status_config():
    """Returns the single source of truth for statuses, labels, plain messages, transitions, and email policy."""
    return StatusConfigOut(
        statuses=list(ALLOWED_STATUSES),
        labels=STATUS_LABELS,
        messages=STATUS_MESSAGES,
        transitions=STATUS_TRANSITIONS,
        email_statuses=list(EMAIL_NOTIFIABLE_STATUSES),
    )


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: str):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        result = supabase.table("device_records").select("*").eq("id", device_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Device record not found")

        return DeviceOut.model_validate(result.data)
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
        # Validate status transition if a status was supplied
        if new_status is not None:
            validate_status_transition(old_status, new_status)

        status_changed = new_status is not None and new_status != old_status

        update_data = device.model_dump(exclude_none=True)
        # notify_customer is an API workflow parameter, not a column in device_records
        notify_customer = update_data.pop("notify_customer", True)

        # 2. Update status and dates (set date_completed on completed or cancelled)
        if status_changed:
            if new_status in ("completed", "cancelled") and "date_completed" not in device.model_fields_set:
                update_data["date_completed"] = datetime.now(timezone.utc).isoformat()
            elif new_status not in ("completed", "cancelled") and "date_completed" not in device.model_fields_set:
                update_data["date_completed"] = None

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = supabase.table("device_records").update(update_data).eq("id", device_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Device record not found")

        updated_record = result.data[0]

        # 3. If status changed, insert into status_history & optionally send email
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

            # 4. Email notification rules:
            # - Customer emails sent ONLY for: pending, awaiting_approval, ready_for_pickup, completed, cancelled
            # - Do NOT email for in_progress
            # - Respect notify_customer flag
            customer_email = updated_record.get("customer_email")
            ticket_code = updated_record.get("ticket_code")
            should_send_email = (
                notify_customer
                and new_status in EMAIL_NOTIFIABLE_STATUSES
                and bool(customer_email)
                and bool(ticket_code)
            )

            if should_send_email:
                device_name = format_device_name(updated_record)
                background_tasks.add_task(
                    send_status_change_email_background,
                    history_id,
                    customer_email,
                    ticket_code,
                    device_name,
                    new_status,
                    device_id,
                )

        return DeviceOut.model_validate(updated_record)
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


@router.get("/{device_id}/charges", response_model=ChargesSummaryOut)
def list_charges(device_id: str):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        # Verify device exists
        dev = supabase.table("device_records").select("id").eq("id", device_id).execute()
        if not dev.data:
            raise HTTPException(status_code=404, detail="Device record not found")

        result = (
            supabase.table("charges")
            .select("*")
            .eq("device_id", device_id)
            .order("created_at", desc=False)
            .execute()
        )
        items = [ChargeOut.model_validate(row) for row in (result.data or [])]
        total = round(sum(item.amount for item in items), 2)
        return ChargesSummaryOut(items=items, total=total)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error listing charges: %s", e)
        # If charges table not yet migrated, return empty list gracefully
        return ChargesSummaryOut(items=[], total=0.0)


@router.post("/{device_id}/charges", response_model=ChargeOut)
def add_charge(device_id: str, charge: ChargeCreate):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        if charge.amount < 0:
            raise HTTPException(status_code=422, detail="Charge amount cannot be negative")

        # Verify device exists
        dev = supabase.table("device_records").select("id").eq("id", device_id).execute()
        if not dev.data:
            raise HTTPException(status_code=404, detail="Device record not found")

        payload = {
            "device_id": device_id,
            "description": charge.description.strip(),
            "amount": round(charge.amount, 2),
        }
        result = supabase.table("charges").insert(payload).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to add charge")

        return ChargeOut.model_validate(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{device_id}/charges/{charge_id}")
def delete_charge(device_id: str, charge_id: str):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        result = (
            supabase.table("charges")
            .delete()
            .eq("id", charge_id)
            .eq("device_id", device_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Charge not found")

        return {"message": "Charge deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{device_id}/resend-email")
def resend_tracking_email(device_id: str):
    try:
        success, message = send_device_tracking_email(device_id)
        if not success:
            raise HTTPException(status_code=400, detail=message)
        return {"success": True, "message": message}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


