import logging
import os
from typing import Optional

from dotenv import load_dotenv
import httpx

from app.db import supabase

logger = logging.getLogger(__name__)

STATUS_LABELS = {
    "pending": "Pending",
    "in_progress": "In Progress",
    "ready_for_pickup": "Ready for Pickup",
    "completed": "Completed",
}


def get_tracking_url(ticket_code: str) -> str:
    load_dotenv(override=True)
    base_url = os.getenv("TRACKING_BASE_URL", "http://localhost:3000/track").rstrip("/")
    return f"{base_url}/{ticket_code}"


def send_resend_email(to_email: str, subject: str, html: str, text: str) -> tuple[bool, str]:
    load_dotenv(override=True)
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("EMAIL_FROM", "Device Register <onboarding@resend.dev>")

    if not api_key:
        msg = (
            "RESEND_API_KEY is not configured in backend/.env. "
            "Emails cannot be delivered until a valid Resend API key is added."
        )
        logger.warning(msg)
        return False, msg

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_email,
                "to": [to_email],
                "subject": subject,
                "html": html,
                "text": text,
            },
            timeout=10.0,
        )

        if response.status_code in (200, 201):
            logger.info("Email successfully sent to %s via Resend.", to_email)
            return True, f"Email sent successfully to {to_email}"
        else:
            err_msg = f"Resend API returned status {response.status_code}: {response.text}"
            logger.error(err_msg)
            return False, err_msg
    except Exception as e:
        err_msg = f"Failed to send email to {to_email}: {str(e)}"
        logger.exception(err_msg)
        return False, err_msg


def send_creation_email_background(
    history_id: Optional[str],
    to_email: str,
    ticket_code: str,
    device_name: str,
) -> None:
    tracking_url = get_tracking_url(ticket_code)
    subject = f"Your Device Repair Ticket: {ticket_code}"

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; margin-top: 0;">Device Received for Service</h2>
        <p>Hello,</p>
        <p>We have logged your device (<strong>{device_name}</strong>) into our system.</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Ticket Code</p>
            <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 1.4rem; font-weight: bold; color: #2563eb;">{ticket_code}</p>
        </div>
        <p>You can track the real-time progress and timeline of your repair at any time:</p>
        <p style="margin: 24px 0;">
            <a href="{tracking_url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Track Device Status</a>
        </p>
        <p style="color: #64748b; font-size: 0.85rem; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Direct link: <a href="{tracking_url}" style="color: #2563eb;">{tracking_url}</a>
        </p>
    </div>
    """

    text = f"""Device Received for Service

Hello,

We have received your device ({device_name}) for servicing.

Ticket Code: {ticket_code}

Track the status of your repair here:
{tracking_url}
"""

    success, _ = send_resend_email(to_email, subject, html, text)
    if success and history_id and supabase is not None:
        try:
            supabase.table("status_history").update({"email_sent": True}).eq("id", history_id).execute()
        except Exception as e:
            logger.error("Failed to update status_history email_sent for %s: %s", history_id, e)


def send_status_change_email_background(
    history_id: Optional[str],
    to_email: str,
    ticket_code: str,
    device_name: str,
    new_status: str,
) -> None:
    status_label = STATUS_LABELS.get(new_status, new_status.replace("_", " ").title())
    tracking_url = get_tracking_url(ticket_code)
    subject = f"Device Status Update: {status_label} ({ticket_code})"

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; margin-top: 0;">Device Status Update</h2>
        <p>Hello,</p>
        <p>The status of your device (<strong>{device_name}</strong>) has been updated.</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Current Status</p>
            <p style="margin: 4px 0 0 0; font-size: 1.3rem; font-weight: bold; color: #2563eb;">{status_label}</p>
        </div>
        <p>You can check the full repair history and updates using your tracking link:</p>
        <p style="margin: 24px 0;">
            <a href="{tracking_url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Tracking Details</a>
        </p>
        <p style="color: #64748b; font-size: 0.85rem; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Ticket Code: {ticket_code}<br/>
            Direct link: <a href="{tracking_url}" style="color: #2563eb;">{tracking_url}</a>
        </p>
    </div>
    """

    text = f"""Device Status Update

Hello,

The status of your device ({device_name}) has been updated to: {status_label}

Ticket Code: {ticket_code}

View your tracking details here:
{tracking_url}
"""

    success, _ = send_resend_email(to_email, subject, html, text)
    if success and history_id and supabase is not None:
        try:
            supabase.table("status_history").update({"email_sent": True}).eq("id", history_id).execute()
        except Exception as e:
            logger.error("Failed to update status_history email_sent for %s: %s", history_id, e)


def send_device_tracking_email(device_id: str) -> tuple[bool, str]:
    """Manually dispatch a tracking email for an existing device record."""
    load_dotenv(override=True)
    if supabase is None:
        return False, "Database client is not configured"

    res = supabase.table("device_records").select("*").eq("id", device_id).single().execute()
    if not res.data:
        return False, "Device record not found"

    record = res.data
    customer_email = record.get("customer_email")
    if not customer_email:
        return False, "No customer email address on this device record"

    ticket_code = record.get("ticket_code")
    if not ticket_code:
        return False, "This device does not have a tracking ticket code"

    device_name = " ".join(filter(None, [record.get("device_type"), record.get("device_brand"), record.get("device_model")])) or "Device"
    tracking_url = get_tracking_url(ticket_code)
    subject = f"Your Device Repair Ticket: {ticket_code}"

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; margin-top: 0;">Device Received for Service</h2>
        <p>Hello,</p>
        <p>Here is your tracking information for device (<strong>{device_name}</strong>).</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Ticket Code</p>
            <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 1.4rem; font-weight: bold; color: #2563eb;">{ticket_code}</p>
        </div>
        <p>You can track the real-time progress and timeline of your repair at any time:</p>
        <p style="margin: 24px 0;">
            <a href="{tracking_url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Track Device Status</a>
        </p>
        <p style="color: #64748b; font-size: 0.85rem; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Direct link: <a href="{tracking_url}" style="color: #2563eb;">{tracking_url}</a>
        </p>
    </div>
    """

    text = f"""Device Received for Service

Hello,

Here is the tracking details for your device ({device_name}).

Ticket Code: {ticket_code}

Track the status of your repair here:
{tracking_url}
"""

    return send_resend_email(customer_email, subject, html, text)

