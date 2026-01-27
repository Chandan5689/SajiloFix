from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
import os

def user_profile_picture_path(instance, filename):
    """Generate file path for user profile pictures"""
    ext = filename.split('.')[-1]
    filename = f'profile_{instance.id}.{ext}'
    return os.path.join('profile_pictures', filename)

def user_certificate_path(instance, filename):
    """Generate file path for certificates"""
    return os.path.join('certificates', f'user_{instance.user.id}', filename)

def user_citizenship_path(instance, filename):
    """Generate file path for citizenship documents"""
    ext = filename.split('.')[-1]
    filename = f'citizenship_{instance.id}.{ext}'
    return os.path.join('citizenship', filename)

class User(AbstractUser):
    def save(self, *args, **kwargs):
        # Ensure superusers always have user_type 'admin'
        if self.is_superuser:
            self.user_type = 'admin'
        super().save(*args, **kwargs)

    @classmethod
    def create_superuser(cls, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')
        return cls.objects.create_user(email, password, **extra_fields)

    USER_TYPE_CHOICES = (
        ('find', 'Find Services'),
        ('offer', 'Offer Services'),
        ('admin', 'Admin'),
    )

    # Phone number validator for exactly 10 digits
    phone_regex = RegexValidator(
        regex=r'^(97|98)\d{8}$',
        message=(
            "Enter a valid Nepal mobile number. "
            "Examples: 9812345678, 9712345678, +9779812345678"
        )
    )
    # Citizenship number validator for exactly 11 digits
    citizenship_regex = RegexValidator(
        regex=r'^\d{11}$',
        message="Citizenship number must be exactly 11 digits"
    )
    # Basic Info
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=10,
        unique=True,
        validators=[phone_regex],
        help_text="Enter 10 digit phone number (e.g., 9812345678)",
        blank=True,
        null=True
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='find')

    # Middle name (optional)
    middle_name = models.CharField(max_length=150, blank=True, null=True)

    # Authentication IDs
    supabase_uid = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        help_text="Supabase user UUID (from JWT sub claim)"
    )
    clerk_user_id = models.CharField(max_length=255, blank=True, null=True, unique=True, help_text="Deprecated: Clerk integration ID")
    phone_verified = models.BooleanField(default=False)
    firebase_phone_uid = models.CharField(max_length=255, blank=True, null=True)
    registration_completed = models.BooleanField(default=False, help_text="Set to True only after phone verification is complete")

    # Profile Picture
    profile_picture = models.URLField(
        max_length=500,
        blank=True, 
        null=True,
        help_text="Profile picture URL from Supabase Storage"
    )
    # Location field for all users
    location = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Current location/address"
    )
    # Address Information
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    # Professional Bio
    bio = models.TextField(blank=True, null=True)

    # Business Information (for service providers)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    years_of_experience = models.IntegerField(default=0, blank=True, null=True)
    service_area = models.CharField(max_length=255, blank=True, null=True)

    # Citizenship/National ID (for service providers)
    citizenship_front = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Front side of citizenship or national ID card - Supabase URL"
    )
    citizenship_back = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Back side of citizenship or national ID card - Supabase URL"
    )
    citizenship_number = models.CharField(
        max_length=11,
        blank=True,
        null=True,
        validators=[citizenship_regex],
        help_text="Citizenship or national ID number (11 digits)"
    )
    citizenship_verified = models.BooleanField(default=False)

    # Status
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class Speciality(models.Model):
    """Main service categories like Plumbing, Electrical, etc."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = 'Specialities'
        ordering = ['name']


class Specialization(models.Model):
    """Specific expertise within a speciality"""
    speciality = models.ForeignKey(
        Speciality, 
        on_delete=models.CASCADE, 
        related_name='specializations'
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.speciality.name} - {self.name}"
    
    class Meta:
        unique_together = ['speciality', 'name']
        ordering = ['speciality', 'name']


class UserSpeciality(models.Model):
    """Many-to-many relationship between users and specialities"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_specialities')
    speciality = models.ForeignKey(Speciality, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'speciality']
        verbose_name_plural = 'User Specialities'


class UserSpecialization(models.Model):
    """Many-to-many relationship between users and specializations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_specializations')
    specialization = models.ForeignKey(Specialization, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'specialization']
        verbose_name_plural = 'User Specializations'


class Certificate(models.Model):
    """User certificates and documents"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    name = models.CharField(max_length=255)
    file = models.URLField(max_length=500, help_text="Certificate URL from Supabase Storage")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.name}"
    
    class Meta:
        ordering = ['-uploaded_at']