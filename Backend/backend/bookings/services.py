from django.utils import timezone
from django.db import transaction

from .models import Payment


class PaymentService:
    """
    Orchestrates payment release/hold tied to booking lifecycle.

    Assumptions:
    - A Payment record may or may not exist yet. If none exists, we skip
      processing and return a structured result to avoid inventing defaults.
    - Actual gateway capture/payout is not integrated here; this service
      only updates our Payment record state for now.
    """

    @staticmethod
    @transaction.atomic
    def release_payment(booking):
        """
        Release funds to the provider when a booking is approved/completed.

        Returns a dict result describing the action taken.
        """
        try:
            payment = booking.payment
        except Payment.DoesNotExist:
            return {"action": "release", "status": "skipped", "reason": "no_payment_attached"}

        if payment.status in ("completed", "refunded", "cancelled"):
            return {"action": "release", "status": "noop", "payment_status": payment.status}

        # Determine amount sanity; Payment.amount should be set by upstream flow.
        if payment.amount is None or payment.amount <= 0:
            return {"action": "release", "status": "skipped", "reason": "invalid_amount"}

        # Calculate platform/provider amounts if not yet set
        if payment.provider_amount is None or payment.platform_fee is None:
            payment.calculate_provider_amount()

        payment.status = "completed"
        payment.paid_at = timezone.now()
        note_line = f"[auto] Released on booking approval at {payment.paid_at.isoformat()}"
        payment.payment_notes = (payment.payment_notes + "\n" + note_line) if payment.payment_notes else note_line
        payment.save(update_fields=[
            "status", "paid_at", "platform_fee", "provider_amount", "payment_notes", "updated_at"
        ])

        return {"action": "release", "status": "released", "payment_id": payment.id}

    @staticmethod
    @transaction.atomic
    def hold_payment(booking, reason: str = ""):
        """
        Hold funds while a booking is disputed. We keep Payment.status as-is
        unless it's unsafe to do so. For MVP, a missing Payment is a skip.
        """
        try:
            payment = booking.payment
        except Payment.DoesNotExist:
            return {"action": "hold", "status": "skipped", "reason": "no_payment_attached"}

        if payment.status == "completed":
            # Already paid out – cannot hold retroactively in MVP
            return {"action": "hold", "status": "noop", "payment_status": payment.status}

        ts = timezone.now().isoformat()
        note_line = f"[auto] Held due to dispute at {ts}. {reason}".strip()
        payment.payment_notes = (payment.payment_notes + "\n" + note_line) if payment.payment_notes else note_line
        # Keep status pending to represent held funds (explicit 'held' state can be added later)
        payment.save(update_fields=["payment_notes", "updated_at"])

        return {"action": "hold", "status": "held", "payment_id": payment.id}
