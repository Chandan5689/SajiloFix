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

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('find', 'Find Services'),
        ('offer', 'Offer Services'),
    )
    
     # Phone number validator for exactly 10 digits
    phone_regex = RegexValidator(
        regex=r'^(?:\+977|977)?(97|98)\d{8}$',
    message=(
        "Enter a valid Nepal mobile number. "
        "Examples: 9812345678, 9712345678, +9779812345678"
    )
    )
    # Basic Info
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=14,
        unique=True,
        validators=[phone_regex],
        help_text="Enter 10 digit phone number (e.g., 9812345678)"
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='find')
    
    # Profile Picture
    profile_picture = models.ImageField(
        upload_to=user_profile_picture_path, 
        blank=False, 
        null=False,
        default='profile_pictures/default.jpg'
    )
    
    # Address Information
    address = models.CharField(max_length=255, blank=False, null=False,default='')
    city = models.CharField(max_length=100, blank=False, null=False,default='')
    
    # Professional Bio
    bio = models.TextField(blank=True, null=True)
    
    # Business Information (for service providers)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    years_of_experience = models.IntegerField(default=0, blank=True, null=True)
    service_area = models.CharField(max_length=255, blank=False, null=False,default='')
    
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
    file = models.FileField(upload_to=user_certificate_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.name}"
    
    class Meta:
        ordering = ['-uploaded_at']