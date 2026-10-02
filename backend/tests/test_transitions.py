import unittest
from fastapi import HTTPException
from app.models import (
    ALLOWED_STATUSES,
    STATUS_LABELS,
    STATUS_MESSAGES,
    STATUS_TRANSITIONS,
    EMAIL_NOTIFIABLE_STATUSES,
    validate_status_transition,
)


class TestStatusWorkflowTransitions(unittest.TestCase):
    def test_allowed_statuses_list(self):
        expected = {
            "pending",
            "in_progress",
            "awaiting_approval",
            "ready_for_pickup",
            "completed",
            "cancelled",
        }
        self.assertEqual(set(ALLOWED_STATUSES), expected)
        self.assertEqual(set(STATUS_LABELS.keys()), expected)
        self.assertEqual(set(STATUS_MESSAGES.keys()), expected)
        self.assertEqual(set(STATUS_TRANSITIONS.keys()), expected)

    def test_email_notifiable_statuses(self):
        # Customer emails sent for pending, awaiting_approval, ready_for_pickup, completed, cancelled
        # Do NOT email for in_progress
        self.assertIn("pending", EMAIL_NOTIFIABLE_STATUSES)
        self.assertIn("awaiting_approval", EMAIL_NOTIFIABLE_STATUSES)
        self.assertIn("ready_for_pickup", EMAIL_NOTIFIABLE_STATUSES)
        self.assertIn("completed", EMAIL_NOTIFIABLE_STATUSES)
        self.assertIn("cancelled", EMAIL_NOTIFIABLE_STATUSES)
        self.assertNotIn("in_progress", EMAIL_NOTIFIABLE_STATUSES)

    def test_valid_transitions_pass(self):
        valid_pairs = [
            ("pending", "in_progress"),
            ("pending", "cancelled"),
            ("in_progress", "awaiting_approval"),
            ("in_progress", "ready_for_pickup"),
            ("in_progress", "cancelled"),
            ("awaiting_approval", "in_progress"),
            ("awaiting_approval", "cancelled"),
            ("ready_for_pickup", "completed"),
            ("ready_for_pickup", "in_progress"),
            ("ready_for_pickup", "cancelled"),
        ]
        for current_s, new_s in valid_pairs:
            with self.subTest(current=current_s, new=new_s):
                # Should not raise exception
                try:
                    validate_status_transition(current_s, new_s)
                except HTTPException as e:
                    self.fail(f"validate_status_transition({current_s}, {new_s}) unexpectedly raised {e}")

    def test_same_status_is_noop_and_allowed(self):
        # Setting the same status is permitted without raising 422
        for s in ALLOWED_STATUSES:
            with self.subTest(status=s):
                try:
                    validate_status_transition(s, s)
                except HTTPException as e:
                    self.fail(f"Same-status transition for {s} should not raise: {e}")

    def test_invalid_transitions_return_422_with_clear_message(self):
        invalid_pairs = [
            ("pending", "completed"),
            ("pending", "ready_for_pickup"),
            ("pending", "awaiting_approval"),
            ("in_progress", "completed"),
            ("in_progress", "pending"),
            ("awaiting_approval", "ready_for_pickup"),
            ("awaiting_approval", "completed"),
            ("ready_for_pickup", "pending"),
            ("ready_for_pickup", "awaiting_approval"),
            ("completed", "pending"),
            ("completed", "in_progress"),
            ("completed", "cancelled"),
            ("cancelled", "pending"),
            ("cancelled", "in_progress"),
            ("cancelled", "completed"),
        ]
        for current_s, new_s in invalid_pairs:
            with self.subTest(current=current_s, new=new_s):
                with self.assertRaises(HTTPException) as cm:
                    validate_status_transition(current_s, new_s)
                self.assertEqual(cm.exception.status_code, 422)
                self.assertEqual(
                    cm.exception.detail,
                    f"Cannot move from {current_s} to {new_s}",
                )

    def test_device_update_model_notify_customer_default(self):
        from app.models import DeviceUpdate
        update_default = DeviceUpdate()
        self.assertTrue(update_default.notify_customer)

        update_false = DeviceUpdate(notify_customer=False)
        self.assertFalse(update_false.notify_customer)

        dumped = update_default.model_dump(exclude_none=True)
        self.assertIn("notify_customer", dumped)
        dumped.pop("notify_customer", True)
        self.assertNotIn("notify_customer", dumped)


if __name__ == "__main__":
    unittest.main()
