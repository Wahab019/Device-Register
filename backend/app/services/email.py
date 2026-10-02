import logging
import os
from typing import Optional

from dotenv import load_dotenv
import httpx

from app.db import supabase
from app.models import EMAIL_NOTIFIABLE_STATUSES, STATUS_LABELS

logger = logging.getLogger(__name__)

# Single place for all email template subjects, headings, and messages
EMAIL_TEMPLATES: dict[str, dict[str, str]] = {
    "pending": {
        "subject": "We've received your device ({ticket_code})",
        "headline": "Device Received for Service",
        "message": "We've received your device and will start soon.",
    },
    "awaiting_approval": {
        "subject": "Action Required: Approval Needed for Your Repair ({ticket_code})",
        "headline": "Approval Required",
        "message": "We've looked at your device and need your approval before continuing. Please contact us.",
    },
    "ready_for_pickup": {
        "subject": "Your device is ready for pickup ({ticket_code})",
        "headline": "Your Device is Ready for Pickup",
        "message": "Your device is ready. Bring your ticket ID to collect it.",
    },
    "completed": {
        "subject": "Repair Completed: {ticket_code}",
        "headline": "Device Handed Back",
        "message": "Thanks. Your device has been handed back.",
    },
    "cancelled": {
        "subject": "Repair Closed: {ticket_code}",
        "headline": "Repair Closed",
        "message": "Your repair has been closed. Please contact us for details.",
    },
}


def get_tracking_url(ticket_code: str) -> str:
    load_dotenv(override=True)
    base_url = os.getenv("TRACKING_BASE_URL", "http://localhost:3000/track").rstrip("/")
    return f"{base_url}/{ticket_code}"


def build_status_email(
    ticket_code: str,
    device_name: str,
    new_status: str,
    total_charges: Optional[float] = None,
) -> tuple[str, str, str]:
    """Generates (subject, html, text) for a given status using centralized templates."""
    load_dotenv(override=True)
    tpl = EMAIL_TEMPLATES.get(new_status, {
        "subject": f"Device Status Update: {ticket_code}",
        "headline": "Status Update",
        "message": "The status of your device has been updated.",
    })

    subject = tpl["subject"].format(ticket_code=ticket_code)
    headline = tpl["headline"]
    main_message = tpl["message"]
    status_label = STATUS_LABELS.get(new_status, new_status.replace("_", " ").title())
    tracking_url = get_tracking_url(ticket_code)

    # Status-specific custom sections
    extra_html = ""
    extra_text = ""

    # 1. awaiting_approval: include shop contact details from env var
    if new_status == "awaiting_approval":
        shop_contact = os.getenv("SHOP_CONTACT_DETAILS", os.getenv("SHOP_CONTACT_INFO", "")).strip()
        contact_display = shop_contact if shop_contact else "Please reply directly to this email or visit our service desk."
        extra_html = f"""
        <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 6px; padding: 14px 16px; margin: 18px 0; color: #854d0e;">
            <p style="margin: 0; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Shop Contact Details</p>
            <p style="margin: 4px 0 0 0; font-size: 0.95rem; color: #713f12;">{contact_display}</p>
        </div>
        """
        extra_text = f"\n\nShop Contact Details:\n{contact_display}\n"

    # 2. ready_for_pickup: include total charges if they exist (> 0); omit if no charges
    elif new_status == "ready_for_pickup" and total_charges is not None and total_charges > 0:
        extra_html = f"""
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px 16px; margin: 18px 0;">
            <p style="margin: 0; color: #166534; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Total Due</p>
            <p style="margin: 4px 0 0 0; font-size: 1.35rem; font-weight: bold; color: #15803d;">₦{total_charges:,.2f}</p>
        </div>
        """
        extra_text = f"\nTotal Due: ₦{total_charges:,.2f}\n"

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 1.3rem;">{headline}</h2>
        <p style="font-size: 1rem; color: #334155; line-height: 1.5;">{main_message}</p>
        <p style="color: #475569; font-size: 0.95rem;">Device: <strong>{device_name}</strong></p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; margin: 18px 0;">
            <p style="margin: 0; color: #64748b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Ticket Code</p>
            <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 1.35rem; font-weight: bold; color: #2563eb;">{ticket_code}</p>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Status</p>
            <p style="margin: 2px 0 0 0; font-size: 1.05rem; font-weight: 600; color: #0f172a;">{status_label}</p>
        </div>

        {extra_html}

        <p style="color: #475569; font-size: 0.9rem;">You can track real-time progress, notes, and the status history anytime:</p>
        <p style="margin: 20px 0;">
            <a href="{tracking_url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.95rem;">Track Device Status</a>
        </p>
        <p style="color: #64748b; font-size: 0.8rem; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            Ticket: {ticket_code} &bull; <a href="{tracking_url}" style="color: #2563eb;">{tracking_url}</a>
        </p>
    </div>
    """

    text = f"""{headline}

{main_message}

Device: {device_name}
Ticket Code: {ticket_code}
Current Status: {status_label}
{extra_text}
Track the status of your repair here:
{tracking_url}
"""

    return subject, html, text


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


def send_status_change_email_background(
    history_id: Optional[str],
    to_email: str,
    ticket_code: str,
    device_name: str,
    new_status: str,
    device_id: Optional[str] = None,
) -> None:
    # Customer emails are sent ONLY for: pending, awaiting_approval, ready_for_pickup, completed, cancelled
    # Do NOT email for in_progress
    if new_status not in EMAIL_NOTIFIABLE_STATUSES:
        logger.info("Status '%s' does not trigger customer email; skipping.", new_status)
        return

    # For ready_for_pickup, fetch total charges if charges exist
    total_charges: Optional[float] = None
    if new_status == "ready_for_pickup" and device_id and supabase is not None:
        try:
            charges_res = (
                supabase.table("charges")
                .select("amount")
                .eq("device_id", device_id)
                .execute()
            )
            if charges_res.data:
                charges_sum = sum(float(c.get("amount", 0)) for c in charges_res.data)
                if charges_sum > 0:
                    total_charges = round(charges_sum, 2)
        except Exception as e:
            logger.warning("Could not fetch charges for ready_for_pickup email (%s): %s", device_id, e)

    subject, html, text = build_status_email(
        ticket_code=ticket_code,
        device_name=device_name,
        new_status=new_status,
        total_charges=total_charges,
    )

    success, err_msg = send_resend_email(to_email, subject, html, text)
    if success:
        if history_id and supabase is not None:
            try:
                supabase.table("status_history").update({"email_sent": True}).eq("id", history_id).execute()
            except Exception as e:
                logger.error("Failed to update status_history email_sent for %s: %s", history_id, e)
    else:
        logger.error("Status change email failed for %s (%s): %s", to_email, ticket_code, err_msg)


def send_creation_email_background(
    history_id: Optional[str],
    to_email: str,
    ticket_code: str,
    device_name: str,
) -> None:
    """Sends the initial pending registration confirmation email."""
    send_status_change_email_background(
        history_id=history_id,
        to_email=to_email,
        ticket_code=ticket_code,
        device_name=device_name,
        new_status="pending",
    )


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
    current_status = record.get("status", "pending")

    # If ready_for_pickup, calculate total charges
    total_charges: Optional[float] = None
    if current_status == "ready_for_pickup":
        try:
            charges_res = supabase.table("charges").select("amount").eq("device_id", device_id).execute()
            if charges_res.data:
                charges_sum = sum(float(c.get("amount", 0)) for c in charges_res.data)
                if charges_sum > 0:
                    total_charges = round(charges_sum, 2)
        except Exception as e:
            logger.warning("Could not fetch charges for manual tracking email: %s", e)

    subject, html, text = build_status_email(
        ticket_code=ticket_code,
        device_name=device_name,
        new_status=current_status,
        total_charges=total_charges,
    )

    return send_resend_email(customer_email, subject, html, text)
