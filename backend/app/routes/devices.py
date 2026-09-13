from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.db import supabase
from app.models import DeviceCreate, DeviceListOut, DeviceOut, DeviceStatus, DeviceUpdate

router = APIRouter()


@router.post("", response_model=DeviceOut)
def create_device(device: DeviceCreate):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        result = supabase.table("device_records").insert(device.model_dump()).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create device record")

        return DeviceOut(**result.data[0])
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
def update_device(device_id: str, device: DeviceUpdate):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        update_data = device.model_dump(exclude_none=True)

        if device.status in {"completed", "picked_up"} and "date_completed" not in device.model_fields_set:
            update_data["date_completed"] = datetime.now(timezone.utc).isoformat()

        if device.status in {"pending", "in_progress"}:
            update_data["date_completed"] = None

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = supabase.table("device_records").update(update_data).eq("id", device_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Device record not found")

        return DeviceOut(**result.data[0])
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
