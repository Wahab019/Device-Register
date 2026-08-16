from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.db import supabase
from app.models import DeviceCreate, DeviceOut, DeviceUpdate

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


@router.get("", response_model=list[DeviceOut])
def list_devices():
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        result = supabase.table("device_records").select("*").order("created_at", desc=True).execute()
        return [DeviceOut(**row) for row in result.data]
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
