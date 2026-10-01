from typing import Literal, Optional

from pydantic import BaseModel, Field

ALLOWED_STATUSES = ("pending", "in_progress", "ready_for_pickup", "completed")
DeviceStatus = Literal["pending", "in_progress", "ready_for_pickup", "completed"]


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
    ticket_code: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    device_type: str
    device_brand: Optional[str] = None
    device_model: Optional[str] = None
    serial_number: Optional[str] = None
    issue_description: str
    status: DeviceStatus
    date_received: str
    date_completed: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class DeviceListOut(BaseModel):
    items: list[DeviceOut]
    total: int
    page: int
    page_size: int


class StatusHistoryOut(BaseModel):
    id: str
    device_id: str
    old_status: Optional[str] = None
    new_status: str
    email_sent: bool = False
    changed_at: str


class StatusTimelineItem(BaseModel):
    new_status: str
    changed_at: str


class TrackChargeItem(BaseModel):
    description: str
    amount: float
    created_at: str


class DeviceTrackOut(BaseModel):
    status: str
    device_type: str
    device_brand: Optional[str] = None
    device_model: Optional[str] = None
    date_received: str
    date_completed: Optional[str] = None
    status_history: list[StatusTimelineItem] = []
    charges: list[TrackChargeItem] = []
    total_charges: float = 0.0


class ChargeCreate(BaseModel):
    description: str
    amount: float = Field(..., ge=0)


class ChargeOut(BaseModel):
    id: str
    device_id: str
    description: str
    amount: float
    created_at: str


class ChargesSummaryOut(BaseModel):
    items: list[ChargeOut]
    total: float


class LoginRequest(BaseModel):
    email: str
    password: str


class SignUpRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
