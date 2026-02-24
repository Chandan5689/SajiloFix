from django.db import models
from django.contrib.auth import get_user_model
from bookings.models import Booking
import uuid

User = get_user_model()


class Transaction(models.Model):
    """
    Transaction Model - Tracks all payment transactions through various payment gateways
    
    This model works alongside the Payment model in bookings app:
    - Payment model: Records overall booking payment info
    - Transaction model: Records individual payment gateway transactions
    
    Flow:
    1. Customer initiates payment → Transaction created (status: pending)
    2. Redirect to Khalti → Transaction updated (status: processing)
    3. Khalti callback → Transaction verified (status: completed/failed)
    4. Update Payment model in bookings
    """
    
    PAYMENT_METHOD_CHOICES = [
        ('khalti', 'Khalti'),
        ('cash', 'Cash'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),           # Transaction initiated
        ('processing', 'Processing'),     # Awaiting gateway response
        ('completed', 'Completed'),       # Payment successful
        ('failed', 'Failed'),             # Payment failed
        ('refunded', 'Refunded'),         # Payment refunded
        ('cancelled', 'Cancelled'),       # Transaction cancelled
    ]
    
    # Unique transaction identifier
    transaction_uid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        help_text="Unique transaction identifier for our system"
    )
    
    # Related booking
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='transactions',
        help_text="The booking this transaction is for"
    )
    
    # User info
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payment_transactions',
        help_text="Customer making the payment"
    )
    
    # Payment details
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        help_text="Payment gateway used"
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Transaction amount in NRS"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current transaction status"
    )
    
    # Gateway-specific fields
    gateway_transaction_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Transaction ID from payment gateway (Khalti token, etc.)"
    )
    
    gateway_payment_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Payment ID from gateway (used for verification)"
    )
    
    gateway_response = models.JSONField(
        blank=True,
        null=True,
        help_text="Raw response from payment gateway"
    )
    
    verification_response = models.JSONField(
        blank=True,
        null=True,
        help_text="Response from payment verification API"
    )
    
    # Additional info
    customer_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Customer name for gateway"
    )
    
    customer_email = models.EmailField(
        blank=True,
        help_text="Customer email for gateway"
    )
    
    customer_phone = models.CharField(
        max_length=15,
        blank=True,
        help_text="Customer phone for gateway"
    )
    
    # Return URLs (stored for reference)
    return_url = models.URLField(
        blank=True,
        help_text="URL to return after successful payment"
    )
    
    failure_url = models.URLField(
        blank=True,
        help_text="URL to return after failed payment"
    )
    
    # Refund info
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount refunded (if applicable)"
    )
    
    refund_reason = models.TextField(
        blank=True,
        help_text="Reason for refund"
    )
    
    refund_reference = models.CharField(
        max_length=200,
        blank=True,
        help_text="Refund reference from gateway"
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this transaction"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When transaction was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last update time"
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When payment was completed"
    )
    
    refunded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When refund was processed"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        indexes = [
            models.Index(fields=['transaction_uid']),
            models.Index(fields=['gateway_transaction_id']),
            models.Index(fields=['booking', '-created_at']),
            models.Index(fields=['customer', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"Transaction {self.transaction_uid} - {self.payment_method} - NRS {self.amount}"
    
    def is_successful(self):
        """Check if transaction was successful"""
        return self.status == 'completed'
    
    def is_refundable(self):
        """Check if transaction can be refunded"""
        return self.status == 'completed' and not self.refunded_at
    
    def get_receipt_data(self):
        """Return data for generating receipt"""
        return {
            'transaction_id': str(self.transaction_uid),
            'gateway_transaction_id': self.gateway_transaction_id,
            'booking_id': self.booking.id,
            'customer_name': self.customer_name,
            'amount': float(self.amount),
            'payment_method': self.get_payment_method_display(),
            'status': self.get_status_display(),
            'completed_at': self.completed_at.strftime('%Y-%m-%d %H:%M') if self.completed_at else None,
        }


class KhaltiConfig(models.Model):
    """
    Khalti Configuration - Store Khalti API credentials
    
    Store in database for flexibility (can switch between test/production)
    Alternative: Use environment variables for better security
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Config name (e.g., 'production', 'test')"
    )
    
    public_key = models.CharField(
        max_length=200,
        help_text="Khalti public key"
    )
    
    secret_key = models.CharField(
        max_length=200,
        help_text="Khalti secret key"
    )
    
    is_active = models.BooleanField(
        default=False,
        help_text="Currently active configuration"
    )
    
    is_test_mode = models.BooleanField(
        default=True,
        help_text="Test mode or production"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Khalti Configuration'
        verbose_name_plural = 'Khalti Configurations'
    
    def __str__(self):
        mode = "Test" if self.is_test_mode else "Production"
        active = "✓" if self.is_active else ""
        return f"{self.name} ({mode}) {active}"
    
    def save(self, *args, **kwargs):
        """Ensure only one active config"""
        if self.is_active:
            # Deactivate all other configs
            KhaltiConfig.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_active_config(cls):
        """Get currently active Khalti configuration"""
        return cls.objects.filter(is_active=True).first()


class EsewaConfig(models.Model):
    """
    eSewa Configuration - Store eSewa API credentials
    
    eSewa uses Epay v2 integration (form-based redirect)
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Config name (e.g., 'production', 'test')"
    )
    
    merchant_code = models.CharField(
        max_length=200,
        help_text="eSewa merchant code (scd parameter)"
    )
    
    secret_key = models.CharField(
        max_length=200,
        help_text="eSewa secret key for verification"
    )
    
    is_active = models.BooleanField(
        default=False,
        help_text="Currently active configuration"
    )
    
    is_test_mode = models.BooleanField(
        default=True,
        help_text="Test mode or production"
    )
    
    # Optional SDK credentials
    client_id = models.CharField(
        max_length=200,
        blank=True,
        help_text="eSewa SDK client ID (optional)"
    )
    
    client_secret = models.CharField(
        max_length=200,
        blank=True,
        help_text="eSewa SDK client secret (optional)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'eSewa Configuration'
        verbose_name_plural = 'eSewa Configurations'
    
    def __str__(self):
        mode = "Test" if self.is_test_mode else "Production"
        active = "✓" if self.is_active else ""
        return f"{self.name} ({mode}) {active}"
    
    def save(self, *args, **kwargs):
        """Ensure only one active config"""
        if self.is_active:
            # Deactivate all other configs
            EsewaConfig.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_active_config(cls):
        """Get currently active eSewa configuration"""
        return cls.objects.filter(is_active=True).first()
