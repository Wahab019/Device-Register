from typing import Literal, Optional

from fastapi import HTTPException
from pydantic import BaseModel, Field

ALLOWED_STATUSES = (
    "pending",
    "in_progress",
    "awaiting_approval",
    "ready_for_pickup",
    "completed",
    "cancelled",
)

DeviceStatus = Literal[
    "pending",
    "in_progress",
    "awaiting_approval",
    "ready_for_pickup",
    "completed",
    "cancelled",
]

# Display labels for both backend emails and frontend UI
STATUS_LABELS: dict[str, str] = {
    "pending": "Pending",
    "in_progress": "In Progress",
    "awaiting_approval": "Awaiting Approval",
    "ready_for_pickup": "Ready for Pickup",
    "completed": "Completed",
    "cancelled": "Cancelled",
}

# Plain-language messages shown under the status badge on the tracking page & in emails
STATUS_MESSAGES: dict[str, str] = {
    "pending": "We've received your device and will start soon.",
    "in_progress": "We're working on your device.",
    "awaiting_approval": "We need your approval before continuing. Please contact us.",
    "ready_for_pickup": "Your device is ready. Bring your ticket ID to collect it.",
    "completed": "Your device has been handed back. Thank you.",
    "cancelled": "This repair has been closed. Please contact us for details.",
}

# Customer notification policy: statuses that trigger customer emails
EMAIL_NOTIFIABLE_STATUSES: set[str] = {
    "pending",
    "awaiting_approval",
    "ready_for_pickup",
    "completed",
    "cancelled",
}

# Valid transition mapping (Backend enforcement)
STATUS_TRANSITIONS: dict[str, list[str]] = {
    "pending": ["in_progress", "cancelled"],
    "in_progress": ["awaiting_approval", "ready_for_pickup", "cancelled"],
    "awaiting_approval": ["in_progress", "cancelled"],
    "ready_for_pickup": ["completed", "in_progress", "cancelled"],
    "completed": [],
    "cancelled": [],
}


def validate_status_transition(current_status: str, new_status: str) -> None:
    """Validates that a transition from current_status to new_status is allowed.
    Raises HTTPException(422) if invalid. Same-status transitions are permitted (caller handles as no-op).
    """
    if current_status == new_status:
        return

    allowed = STATUS_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot move from {current_status} to {new_status}",
        )


class StatusConfigOut(BaseModel):
    statuses: list[str]
    labels: dict[str, str]
    messages: dict[str, str]
    transitions: dict[str, list[str]]
    email_statuses: list[str]


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
    notify_customer: bool = True


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
    invite_code: str


class UserOut(BaseModel):
    id: str
    email: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
