
from django.db import models
from django.conf import settings


class ServiceCategory(models.Model):
    """Categories like Plumbing, Electrical, Carpentry, AC Repair, etc."""
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=100, blank=True, null=True)  # Optional icon name/class

    class Meta:
        verbose_name = "Service Category"
        verbose_name_plural = "Service Categories"

    def __str__(self):
        return self.name


class ExampleService(models.Model):
    """A service offered by a provider (example: Pipe Fixing, Switch Repair)."""

    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="services"
    )
    
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name="services"
    )

    title = models.CharField(max_length=150)
    description = models.TextField()

    # Optional pricing fields
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Images — stored in media/services/
    image = models.ImageField(upload_to="services/", null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self):
        return f"{self.title} — {self.provider.username}"
