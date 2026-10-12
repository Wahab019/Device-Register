import unittest
from unittest.mock import patch, MagicMock
from app.services.email import build_status_email, EMAIL_TEMPLATES, send_status_change_email_background
from app.models import EMAIL_NOTIFIABLE_STATUSES


class TestEmailTemplates(unittest.TestCase):
    def test_templates_cover_all_notifiable_statuses(self):
        for status in EMAIL_NOTIFIABLE_STATUSES:
            self.assertIn(status, EMAIL_TEMPLATES, f"Missing template for {status}")

    def test_pending_template(self):
        subject, html, text = build_status_email("DR-123456", "iPhone 13", "pending")
        self.assertIn("DR-123456", subject)
        self.assertIn("We've received your device and will start soon.", html)
        self.assertIn("We've received your device and will start soon.", text)
        self.assertIn("DR-123456", text)

    def test_awaiting_approval_template_with_shop_contact(self):
        with patch.dict("os.environ", {"SHOP_CONTACT_DETAILS": "+1 555-9876"}):
            subject, html, text = build_status_email("DR-ABCDEF", "MacBook Pro", "awaiting_approval")
            self.assertIn("DR-ABCDEF", subject)
            self.assertIn("need your approval before continuing", html)
            self.assertIn("+1 555-9876", html)
            self.assertIn("+1 555-9876", text)

    def test_ready_for_pickup_without_charges(self):
        subject, html, text = build_status_email("DR-PICKUP1", "Dell XPS", "ready_for_pickup", total_charges=0.0)
        self.assertIn("Your device is ready for pickup", subject)
        self.assertNotIn("Total Due", html)
        self.assertNotIn("Total Due", text)

    def test_ready_for_pickup_with_charges(self):
        subject, html, text = build_status_email("DR-PICKUP2", "Dell XPS", "ready_for_pickup", total_charges=25000.0)
        self.assertIn("Your device is ready for pickup", subject)
        self.assertIn("Total Due", html)
        self.assertIn("25,000.00", html)
        self.assertIn("Total Due: ₦25,000.00", text)

    def test_completed_template(self):
        subject, html, text = build_status_email("DR-DONE", "iPad Air", "completed")
        self.assertIn("Thanks. Your device has been handed back.", html)
        self.assertIn("Thanks. Your device has been handed back.", text)

    def test_cancelled_template(self):
        subject, html, text = build_status_email("DR-CANCEL", "Samsung Galaxy", "cancelled")
        self.assertIn("Your repair has been closed. Please contact us for details.", html)
        self.assertIn("Your repair has been closed. Please contact us for details.", text)

    @patch("app.services.email.send_smtp_email")
    def test_in_progress_skips_email(self, mock_send):
        send_status_change_email_background(
            history_id="hist-1",
            to_email="customer@example.com",
            ticket_code="DR-TEST",
            device_name="Laptop",
            new_status="in_progress",
        )
        mock_send.assert_not_called()

    def test_send_smtp_missing_credentials(self):
        from app.services.email import send_smtp_email
        with patch.dict("os.environ", {"SMTP_USER": "", "SMTP_PASSWORD": ""}):
            success, msg = send_smtp_email("test@example.com", "Subject", "<p>Test</p>", "Test")
            self.assertFalse(success)
            self.assertIn("not configured", msg)

    @patch("smtplib.SMTP")
    def test_send_smtp_success(self, mock_smtp):
        from app.services.email import send_smtp_email
        instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = instance

        with patch.dict("os.environ", {
            "SMTP_HOST": "smtp.gmail.com",
            "SMTP_PORT": "587",
            "SMTP_USER": "testuser@gmail.com",
            "SMTP_PASSWORD": "secretpassword",
            "EMAIL_FROM": "Device Register <testuser@gmail.com>",
        }):
            success, msg = send_smtp_email("recipient@example.com", "Subject", "<p>Test</p>", "Test")
            self.assertTrue(success)
            instance.starttls.assert_called_once()
            instance.login.assert_called_once_with("testuser@gmail.com", "secretpassword")
            instance.sendmail.assert_called_once()

    @patch("smtplib.SMTP_SSL")
    def test_send_smtp_ssl_success(self, mock_smtp_ssl):
        from app.services.email import send_smtp_email
        instance = MagicMock()
        mock_smtp_ssl.return_value.__enter__.return_value = instance

        with patch.dict("os.environ", {
            "SMTP_HOST": "smtp.gmail.com",
            "SMTP_PORT": "465",
            "SMTP_USER": "testuser@gmail.com",
            "SMTP_PASSWORD": "secretpassword",
            "EMAIL_FROM": "Device Register <testuser@gmail.com>",
        }):
            success, msg = send_smtp_email("recipient@example.com", "Subject", "<p>Test</p>", "Test")
            self.assertTrue(success)
            instance.login.assert_called_once_with("testuser@gmail.com", "secretpassword")
            instance.sendmail.assert_called_once()


if __name__ == "__main__":
    unittest.main()


