from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from bookings.models import Booking
from bookings.services import PaymentService


class Command(BaseCommand):
    help = "Auto-approve bookings whose customer review window expired (36h), releasing payments."

    def handle(self, *args, **options):
        now = timezone.now()
        qs = Booking.objects.select_related("service", "customer", "provider").filter(
            status="awaiting_customer",
            customer_review_expires_at__isnull=False,
            customer_review_expires_at__lte=now,
        )

        count = 0
        for booking in qs.iterator():
            with transaction.atomic():
                # Double-check status in transaction for idempotency
                b = Booking.objects.select_for_update().get(id=booking.id)
                if b.status != "awaiting_customer":
                    continue
                b.status = "completed"
                b.completed_at = now
                note = f"Auto-approved after 36 hours on {now.strftime('%Y-%m-%d %H:%M')}"
                b.approval_note = (b.approval_note + "\n" + note) if b.approval_note else note
                b.save()
                PaymentService.release_payment(b)
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Auto-approved {count} booking(s)."))
