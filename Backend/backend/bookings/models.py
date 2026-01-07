from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import Specialization
import os

User = get_user_model()

# Image upload constraints
MAX_BEFORE_IMAGES = 3
MAX_AFTER_IMAGES = 3
MAX_DURING_IMAGES = 5
MAX_IMAGE_SIZE_MB = 5


def booking_image_path(instance, filename):
    """Generate file path for booking images"""
    ext = filename.split('.')[-1]
    booking_id = instance.booking.id
    image_type = instance.image_type
    timestamp = instance.uploaded_at.strftime('%Y%m%d_%H%M%S') if instance.uploaded_at else 'new'
    filename = f'{image_type}_{timestamp}.{ext}'
    return os.path.join('bookings', f'booking_{booking_id}', filename)


class Service(models.Model):
    """
    Service Model - Represents services offered by service providers
    
    Example: A plumber might offer services like:
    - "Emergency Plumbing Repair" - $150
    - "Kitchen Sink Installation" - $200
    
    This allows providers to list multiple services with different prices.
    """
    
    # Which provider is offering this service
    provider = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='services',
        limit_choices_to={'user_type': 'offer'},  # Only service providers can offer services
        help_text="The service provider offering this service"
    )
    
    # What type of service (links to their specialization - e.g., "Residential Plumbing")
    specialization = models.ForeignKey(
        Specialization,
        on_delete=models.PROTECT,  # Can't delete specialization if services exist
        related_name='services',
        help_text="The specialization category this service falls under"
    )
    
    # Service details
    title = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Service name (e.g., 'Emergency Plumbing Repair')"
    )
    
    description = models.TextField(
        blank=True,
        default="",
        help_text="Detailed description of what's included in this service"
    )
    
    # Pricing
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Base price in NRS (e.g., 1500.00)"
    )
    
    price_type = models.CharField(
        max_length=20,
        choices=[
            ('fixed', 'Fixed Price'),
            ('hourly', 'Per Hour'),
            ('negotiable', 'Negotiable'),
        ],
        default='fixed',
        help_text="How the service is priced"
    )
    
    # Minimum charge / Call-out fee
    minimum_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Minimum charge for this service (e.g., travel fee, call-out fee). "
                  "Customer pays at least this amount even if service costs less."
    )
    
    # Service details
    estimated_duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Estimated duration in minutes (e.g., 60 for 1 hour)"
    )
    
    service_radius = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Service area radius in kilometers from provider's location. "
                  "Leave blank for unlimited or use provider's service_area."
    )
    
    requires_site_visit = models.BooleanField(
        default=False,
        help_text="Whether the provider needs to visit the site before giving a final quote"
    )
    
    emergency_service = models.BooleanField(
        default=False,
        help_text="Whether this is an emergency/24-7 service (may have higher rates)"
    )
    
    # Additional charges
    additional_charges_note = models.TextField(
        blank=True,
        null=True,
        help_text="Notes about additional charges (e.g., 'Materials not included', "
                  "'Extra charge for weekends', 'Parking fees may apply')"
    )
    
    # Availability
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this service is currently being offered"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
        # One provider can't offer multiple services in the same specialization
        unique_together = ['provider', 'specialization']
    
    def __str__(self):
        return f"{self.title} by {self.provider.get_full_name() or self.provider.email}"


class Booking(models.Model):
    """
    Booking Model - Represents a service booking/request from customer to provider
    
    Flow:
    1. Customer finds a service and creates a booking
    2. Provider receives request (status: Pending)
    3. Provider accepts/declines
    4. Service is performed (status: In Progress)
    5. Job completed (status: Completed)
    6. Customer can review
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),               # Waiting for provider response
        ('confirmed', 'Confirmed'),           # Provider accepted
        ('scheduled', 'Scheduled'),           # Date/time set
        ('in_progress', 'In Progress'),       # Work started
        ('provider_completed', 'Provider Completed'),  # Provider uploaded after-photos
        ('awaiting_customer', 'Awaiting Customer'),    # Waiting for customer approval/dispute
        ('completed', 'Completed'),           # Work finished, approved by customer
        ('disputed', 'Disputed'),             # Customer disputed completion
        ('cancelled', 'Cancelled'),           # Cancelled by either party
        ('declined', 'Declined'),             # Provider declined
    ]
    
    # Core relationships
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='customer_bookings',
        limit_choices_to={'user_type': 'find'},
        help_text="Customer who made the booking"
    )
    
    provider = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='provider_bookings',
        limit_choices_to={'user_type': 'offer'},
        help_text="Service provider assigned to this booking"
    )
    
    service = models.ForeignKey(
        Service,
        on_delete=models.PROTECT,  # Can't delete service if active bookings exist
        related_name='bookings',
        help_text="The service being booked"
    )
    
    # Booking details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current status of the booking"
    )
    
    # Schedule
    preferred_date = models.DateField(
        help_text="Customer's preferred service date"
    )
    
    preferred_time = models.TimeField(
        help_text="Customer's preferred service time"
    )
    
    scheduled_date = models.DateField(
        null=True,
        blank=True,
        help_text="Confirmed scheduled date (set by provider)"
    )
    
    scheduled_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Confirmed scheduled time (set by provider)"
    )
    
    # Location
    service_address = models.CharField(
        max_length=255,
        help_text="Full address where service will be performed"
    )
    
    service_city = models.CharField(
        max_length=100,
        help_text="City"
    )
    
    service_district = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="District"
    )
    
    latitude = models.FloatField(
        null=True,
        blank=True,
        help_text="Location latitude for map"
    )
    
    longitude = models.FloatField(
        null=True,
        blank=True,
        help_text="Location longitude for map"
    )
    
    # Customer request details
    description = models.TextField(
        help_text="Customer's description of the problem/requirement"
    )
    
    special_instructions = models.TextField(
        blank=True,
        null=True,
        help_text="Any special instructions (e.g., 'Call before arriving', 'Park on street')"
    )
    
    # Pricing
    quoted_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Provider's quoted price in NRS (may differ from base price)"
    )
    
    final_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final agreed price in NRS after any adjustments"
    )
    
    # Contact info (snapshot for this booking)
    customer_phone = models.CharField(
        max_length=15,
        help_text="Customer contact number for this booking"
    )
    
    customer_name = models.CharField(
        max_length=200,
        help_text="Customer name (snapshot for this booking)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the booking was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last update time"
    )
    
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When provider accepted the booking"
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the service was completed"
    )

    provider_completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When provider marked job as completed (uploaded after-photos)"
    )

    customer_review_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When customer's review window expires for auto-approval"
    )

    completion_note = models.TextField(
        blank=True,
        null=True,
        help_text="Provider's completion note when marking job done"
    )

    dispute_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Customer's dispute reason if disputing completion"
    )

    dispute_note = models.TextField(
        blank=True,
        null=True,
        help_text="Customer's additional details about dispute"
    )

    approval_note = models.TextField(
        blank=True,
        null=True,
        help_text="Customer's approval note"
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the booking was cancelled"
    )
    
    # Cancellation info
    cancelled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_bookings',
        help_text="Who cancelled the booking (customer or provider)"
    )
    
    cancellation_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for cancellation"
    )
    
    # Provider notes (internal)
    provider_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes by provider (not visible to customer)"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['customer', '-created_at']),
            models.Index(fields=['provider', '-created_at']),
        ]
    
    def __str__(self):
        return f"Booking #{self.id} - {self.service.title} for {self.customer_name}"
    
    def is_cancellable(self):
        """Check if booking can be cancelled"""
        return self.status in ['pending', 'confirmed', 'scheduled']
    
    def is_editable(self):
        """Check if booking can be edited"""
        return self.status in ['pending', 'confirmed']


class BookingImage(models.Model):
    """
    BookingImage Model - Stores before/after photos for bookings
    
    Use cases:
    1. Customer uploads 'before' photos when creating booking (damaged items)
    2. Provider uploads 'after' photos when completing work (repaired items)
    3. Both can upload during service for documentation
    
    Example:
    - Before: Photo of broken pipe leaking water
    - After: Photo of new pipe properly installed
    """
    
    IMAGE_TYPE_CHOICES = [
        ('before', 'Before Service'),      # Photos of damaged/broken items
        ('during', 'During Service'),      # Photos taken while working
        ('after', 'After Service'),        # Photos of completed/repaired items (provider)
        ('approval_photos', 'Approval Photos'),  # Customer photos during approval/dispute
    ]
    
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='images',
        help_text="The booking this image belongs to"
    )
    
    image = models.ImageField(
        upload_to=booking_image_path,
        help_text="Photo of the service area/items"
    )
    
    image_type = models.CharField(
        max_length=50,
        choices=IMAGE_TYPE_CHOICES,
        help_text="When this photo was taken (before/during/after/approval)"
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_booking_images',
        help_text="Who uploaded this image (customer or provider)"
    )
    
    description = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Optional description of what's shown in the image"
    )
    
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the image was uploaded"
    )
    
    class Meta:
        ordering = ['image_type', 'uploaded_at']
        verbose_name = 'Booking Image'
        verbose_name_plural = 'Booking Images'
    
    def __str__(self):
        return f"{self.image_type.title()} photo for Booking #{self.booking.id}"
    
    def get_uploader_name(self):
        """Return name of person who uploaded"""
        if self.uploaded_by:
            return self.uploaded_by.get_full_name() or self.uploaded_by.email
        return "Unknown"
    
    def clean(self):
        """Validate image upload constraints"""
        # Check file size (max 5MB)
        if self.image:
            file_size_mb = self.image.size / (1024 * 1024)  # Convert to MB
            if file_size_mb > MAX_IMAGE_SIZE_MB:
                raise ValidationError(
                    f'Image size must be less than {MAX_IMAGE_SIZE_MB}MB. '
                    f'Current size: {file_size_mb:.2f}MB'
                )
        
        # Check image count limits per type
        if self.booking_id:
            existing_count = BookingImage.objects.filter(
                booking=self.booking,
                image_type=self.image_type
            ).exclude(pk=self.pk).count()
            
            limits = {
                'before': MAX_BEFORE_IMAGES,
                'after': MAX_AFTER_IMAGES,
                'during': MAX_DURING_IMAGES,
                'approval_photos': 5,  # Allow up to 5 customer approval photos
            }
            
            max_allowed = limits.get(self.image_type, 5)
            
            if existing_count >= max_allowed:
                raise ValidationError(
                    f'Maximum {max_allowed} {self.image_type} images allowed per booking. '
                    f'Please delete an existing image before uploading a new one.'
                )
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.clean()
        super().save(*args, **kwargs)


class Payment(models.Model):
    """
    Payment Model - Tracks all payment transactions for bookings
    
    Flow:
    1. Booking completed → Payment created (status: Pending)
    2. Customer pays → Payment updated (status: Completed)
    3. Platform verifies → Provider receives payment
    
    Supports multiple payment methods popular in Nepal:
    - eSewa, Khalti (digital wallets)
    - Bank transfer
    - Cash on completion
    """
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),           # Awaiting payment
        ('processing', 'Processing'),     # Payment being processed
        ('completed', 'Completed'),       # Payment successful
        ('failed', 'Failed'),             # Payment failed
        ('refunded', 'Refunded'),         # Payment refunded
        ('cancelled', 'Cancelled'),       # Payment cancelled
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),                         # Cash on completion
        ('esewa', 'eSewa'),                      # eSewa digital wallet
        ('khalti', 'Khalti'),                    # Khalti digital wallet
            
        ]
    
    # Core relationships
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='payment',
        help_text="The booking this payment is for"
    )
    
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments_made',
        help_text="Customer who is making the payment"
    )
    
    provider = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments_received',
        help_text="Provider who will receive the payment"
    )
    
    # Payment details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total payment amount in NRS"
    )
    
    platform_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10.00,
        help_text="Platform commission percentage (e.g., 10.00 for 10%)"
    )
    
    platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Platform commission/fee in NRS (calculated from percentage)"
    )
    
    provider_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount provider receives after platform fee in NRS"
    )
    
    # Payment method and status
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        help_text="How the customer is paying"
    )
    
    status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
        help_text="Current payment status"
    )
    
    # Transaction details
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        help_text="Transaction ID from payment gateway (eSewa, Khalti, etc.)"
    )
    
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Reference number for bank transfers or receipts"
    )
    
    # Payment gateway response (store raw response for debugging)
    gateway_response = models.JSONField(
        blank=True,
        null=True,
        help_text="Raw response from payment gateway (for debugging)"
    )
    
    # Notes
    payment_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about this payment"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When payment record was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last update time"
    )
    
    paid_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When payment was completed"
    )
    
    refunded_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When payment was refunded (if applicable)"
    )
    
    # Refund details
    refund_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for refund"
    )
    
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Amount refunded in NRS (may be partial)"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['customer', '-created_at']),
            models.Index(fields=['provider', '-created_at']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        return f"Payment #{self.id} - NRS {self.amount} ({self.status})"
    
    def calculate_provider_amount(self):
        """Calculate amount provider receives after platform fee using stored percentage"""
        fee = (self.amount * self.platform_fee_percentage) / 100
        self.platform_fee = fee
        self.provider_amount = self.amount - fee
        return self.provider_amount
    
    def is_refundable(self):
        """Check if payment can be refunded"""
        return self.status == 'completed' and not self.refunded_at
    
    def get_receipt_data(self):
        """Return data for generating payment receipt"""
        return {
            'payment_id': self.id,
            'booking_id': self.booking.id,
            'customer_name': self.customer.get_full_name() or self.customer.email,
            'provider_name': self.provider.get_full_name() or self.provider.email,
            'service': self.booking.service.title,
            'amount': float(self.amount),
            'platform_fee': float(self.platform_fee),
            'provider_amount': float(self.provider_amount),
            'payment_method': self.get_payment_method_display(),
            'status': self.get_status_display(),
            'paid_at': self.paid_at.strftime('%Y-%m-%d %H:%M') if self.paid_at else None,
            'transaction_id': self.transaction_id,
        }


class Review(models.Model):
    """
    Review Model - Customer reviews and ratings for completed bookings

    Rules:
    - Only the booking's customer can create a review
    - Booking must be completed
    - One review per booking per customer
    - Provider can optionally respond
    """

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='review',
        help_text="The completed booking this review refers to"
    )

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_written',
        limit_choices_to={'user_type': 'find'},
        help_text="Customer who wrote the review"
    )

    provider = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        limit_choices_to={'user_type': 'offer'},
        help_text="Provider who received the review"
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Star rating from 1 (worst) to 5 (best)"
    )

    title = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional short title (e.g., 'Great service!')"
    )

    comment = models.TextField(
        blank=True,
        help_text="Detailed feedback about the service"
    )

    would_recommend = models.BooleanField(
        default=True,
        help_text="Whether the customer would recommend this provider"
    )

    # Optional provider response
    provider_response = models.TextField(
        blank=True,
        help_text="Provider's public response to the review"
    )

    responded_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the provider responded"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        indexes = [
            models.Index(fields=['provider', '-created_at']),
            models.Index(fields=['customer', '-created_at']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return f"Review for Booking #{self.booking.id} - {self.rating}★"

    def clean(self):
        """Enforce business rules for creating a review"""
        # Booking must be completed
        if self.booking and self.booking.status != 'completed':
            raise ValidationError('Reviews can only be created for completed bookings.')

        # Customer must match booking's customer
        if self.booking and self.customer_id != self.booking.customer_id:
            raise ValidationError('Only the booking customer can write a review.')

        # Provider must match booking's provider
        if self.booking and self.provider_id != self.booking.provider_id:
            raise ValidationError('Provider must match the booking provider.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class ProviderAvailability(models.Model):
    """
    Store provider's availability schedule and booking preferences.
    One-to-one relationship with service providers.
    """
    provider = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='availability',
        limit_choices_to={'user_type': 'offer'},
        help_text="The service provider's availability record"
    )
    
    # Weekly schedule: array of day availability
    # Example: [
    #   { "day": "Monday", "enabled": true, "start_time": "8:00 AM", "end_time": "5:00 PM", 
    #     "break_start": "12:00 PM", "break_end": "1:00 PM" },
    #   ...
    # ]
    weekly_schedule = models.JSONField(
        default=list,
        blank=True,
        help_text="Weekly schedule with day, enabled status, and working hours"
    )
    
    # Booking settings: emergency availability, advance booking window, buffer time, session duration
    # Example: {
    #   "emergency_availability": true,
    #   "advance_booking": "30 days",
    #   "buffer_time": "15 minutes",
    #   "session_duration": "30 minutes"
    # }
    settings = models.JSONField(
        default=dict,
        blank=True,
        help_text="Availability settings for booking rules"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Provider Availability'
        verbose_name_plural = 'Provider Availabilities'
    
    def __str__(self):
        return f"Availability for {self.provider.full_name}"
