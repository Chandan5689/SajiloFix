"""
Management command to expire stale bookings whose confirmation deadline has passed.

This is the safety-net cron job that catches any pending bookings that were not
lazy-expired by being accessed through the API views.

Run this every 15-30 minutes via Windows Task Scheduler or cron:
    python manage.py expire_stale_bookings

Setup (Windows Task Scheduler):
    1. Open Task Scheduler → Create Basic Task
    2. Trigger: Daily, repeat every 15 minutes
    3. Action: Start a program
       Program: python (or path to your venv python)
       Arguments: manage.py expire_stale_bookings
       Start in: E:\\SajiloFix\\Backend\\backend
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking
from bookings.emails import send_booking_expiry_notification


class Command(BaseCommand):
    help = "Expire pending bookings whose confirmation deadline has passed and notify both parties."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be expired without actually changing anything.',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        now = timezone.now()

        overdue_bookings = (
            Booking.objects
            .filter(
                status='pending',
                confirmation_deadline__isnull=False,
                confirmation_deadline__lte=now,
            )
            .select_related('customer', 'provider', 'service', 'service__specialization')
        )

        count = overdue_bookings.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("No overdue pending bookings found."))
            return

        self.stdout.write(f"Found {count} overdue pending booking(s).")

        expired_count = 0
        email_success = 0
        email_fail = 0

        for booking in overdue_bookings:
            if dry_run:
                self.stdout.write(
                    f"  [DRY RUN] Would expire Booking #{booking.id} "
                    f"(deadline: {booking.confirmation_deadline}, "
                    f"customer: {booking.customer.email}, "
                    f"provider: {booking.provider.email})"
                )
                continue

            if booking.expire_if_overdue():
                expired_count += 1
                self.stdout.write(f"  ✅ Expired Booking #{booking.id}")

                try:
                    send_booking_expiry_notification(booking)
                    email_success += 1
                except Exception as e:
                    email_fail += 1
                    self.stderr.write(f"  ❌ Email failed for Booking #{booking.id}: {e}")

        if dry_run:
            self.stdout.write(self.style.WARNING(f"Dry run complete. {count} booking(s) would be expired."))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Done. Expired: {expired_count}, Emails sent: {email_success}, Email failures: {email_fail}"
            ))
