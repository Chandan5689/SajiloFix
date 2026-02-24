from django.db import models


class PlatformSettings(models.Model):
    """Singleton model for platform-wide settings"""
    platform_name = models.CharField(max_length=100, default='SajiloFix')
    max_booking_per_day = models.IntegerField(default=10)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    notification_email = models.EmailField(default='admin@sajilofix.com')
    maintenance_mode = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Platform Settings'
        verbose_name_plural = 'Platform Settings'

    def __str__(self):
        return f"Platform Settings (updated: {self.updated_at})"

    def save(self, *args, **kwargs):
        """Ensure only one instance exists (singleton)"""
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Load the singleton instance, creating it if it doesn't exist"""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
