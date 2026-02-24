from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Deprecated: The awaiting_customer status has been removed. "
        "Bookings now go directly to 'completed' when the provider marks them done. "
        "This command is kept as a no-op for backwards compatibility."
    )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING(
            "No action taken — awaiting_customer flow has been removed. "
            "Bookings are completed directly by the provider."
        ))
