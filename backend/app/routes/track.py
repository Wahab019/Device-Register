import logging
from fastapi import APIRouter, HTTPException

from app.db import supabase
from app.models import DeviceTrackOut, StatusTimelineItem

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{ticket_code}", response_model=DeviceTrackOut)
def track_device(ticket_code: str):
    try:
        if supabase is None:
            raise ValueError("Supabase client is not configured")

        clean_code = ticket_code.strip()

        # Query only the publicly permissible fields from device_records
        device_res = (
            supabase.table("device_records")
            .select("id, status, device_type, device_brand, device_model, date_received, date_completed")
            .eq("ticket_code", clean_code)
            .execute()
        )

        if not device_res.data:
            # Case-insensitive fallback if entered in lowercase
            device_res = (
                supabase.table("device_records")
                .select("id, status, device_type, device_brand, device_model, date_received, date_completed")
                .ilike("ticket_code", clean_code)
                .execute()
            )

        if not device_res.data:
            # Return 404 with no detail about why
            raise HTTPException(status_code=404, detail="Not found")

        device = device_res.data[0]
        device_id = device["id"]

        # Fetch status timeline (only new_status and changed_at)
        timeline: list[StatusTimelineItem] = []
        try:
            history_res = (
                supabase.table("status_history")
                .select("new_status, changed_at")
                .eq("device_id", device_id)
                .order("changed_at", desc=False)
                .execute()
            )
            if history_res.data:
                timeline = [
                    StatusTimelineItem(
                        new_status=item["new_status"],
                        changed_at=item["changed_at"],
                    )
                    for item in history_res.data
                ]
        except Exception as e:
            logger.warning("Could not fetch status history timeline: %s", e)

        return DeviceTrackOut(
            status=device["status"],
            device_type=device["device_type"],
            device_brand=device.get("device_brand"),
            device_model=device.get("device_model"),
            date_received=device["date_received"],
            date_completed=device.get("date_completed"),
            status_history=timeline,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in track_device: %s", e)
        # Return generic 404 for unknown codes / lookup failures without leaking internal details
        raise HTTPException(status_code=404, detail="Not found")
