from typing import Literal, Optional

from pydantic import BaseModel

DeviceStatus = Literal["pending", "in_progress", "completed", "picked_up"]


class DeviceCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    device_type: str
    device_brand: Optional[str] = None
    device_model: Optional[str] = None
    serial_number: Optional[str] = None
    issue_description: str
    notes: Optional[str] = None


class DeviceUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    device_type: Optional[str] = None
    device_brand: Optional[str] = None
    device_model: Optional[str] = None
    serial_number: Optional[str] = None
    issue_description: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[DeviceStatus] = None
    date_completed: Optional[str] = None


class DeviceOut(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    device_type: str
    device_brand: Optional[str]
    device_model: Optional[str]
    serial_number: Optional[str]
    issue_description: str
    status: DeviceStatus
    date_received: str
    date_completed: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str
