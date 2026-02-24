from rest_framework import serializers
from django.contrib.auth import get_user_model
from bookings.models import Booking, Review
from django.db.models import Avg, Sum
from .models import PlatformSettings

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for user management in admin dashboard"""
    user_type_display = serializers.CharField(source='get_user_type_display', read_only=True)
    total_bookings = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'user_type', 'user_type_display',
            'phone_number', 'phone_verified', 'registration_completed', 'is_active',
            'is_verified', 'is_staff', 'is_superuser', 'created_at', 'total_bookings',
            'avg_rating', 'business_name', 'profile_picture', 'bio',
            'address', 'city', 'district', 'location',
            'years_of_experience', 'service_area', 'citizenship_verified'
        ]
        read_only_fields = ['id', 'email', 'created_at', 'user_type', 'user_type_display',
                            'total_bookings', 'avg_rating']
    
    def get_total_bookings(self, obj):
        """Count total bookings for user"""
        if obj.user_type == 'offer':
            return Booking.objects.filter(provider=obj).count()
        else:
            return Booking.objects.filter(customer=obj).count()
    
    def get_avg_rating(self, obj):
        """Get average rating for provider"""
        if obj.user_type == 'offer':
            avg = Review.objects.filter(provider=obj).aggregate(avg=Avg('rating'))['avg']
            return round(avg, 2) if avg else 0
        return None


class AdminBookingSerializer(serializers.ModelSerializer):
    """Serializer for booking management in admin dashboard"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    provider_email = serializers.CharField(source='provider.email', read_only=True)
    total_price = serializers.SerializerMethodField()
    service_title = serializers.SerializerMethodField()
    booking_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'customer_email', 'customer_name', 'provider_email', 'provider_name',
            'service_title', 'status', 'status_display', 'scheduled_date',
            'preferred_date', 'preferred_time', 'booking_date',
            'total_price', 'description', 'service_address', 'service_city',
            'customer_phone', 'created_at'
        ]
    
    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip()
    
    def get_provider_name(self, obj):
        return f"{obj.provider.first_name} {obj.provider.last_name}".strip()

    def get_total_price(self, obj):
        return obj.final_price or obj.quoted_price or 0

    def get_service_title(self, obj):
        try:
            return obj.service.title or obj.service.specialization.name
        except Exception:
            return 'N/A'

    def get_booking_date(self, obj):
        """Return the most relevant date for display"""
        return obj.scheduled_date or obj.preferred_date


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_users = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    active_providers = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    completed_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_rating = serializers.FloatField()
    pending_verification = serializers.IntegerField()
    
    # Growth percentages
    users_growth = serializers.FloatField()
    bookings_growth = serializers.FloatField()
    revenue_growth = serializers.FloatField()
    providers_growth = serializers.FloatField()


class RecentBookingSerializer(serializers.ModelSerializer):
    """Simplified booking serializer for recent bookings"""
    customer_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'customer_name', 'provider_name',
            'total_price', 'status', 'status_display', 'created_at'
        ]
    
    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip()
    
    def get_provider_name(self, obj):
        return f"{obj.provider.first_name} {obj.provider.last_name}".strip()

    def get_total_price(self, obj):
        return obj.final_price or obj.quoted_price or 0


class PlatformSettingsSerializer(serializers.ModelSerializer):
    """Serializer for platform settings"""
    class Meta:
        model = PlatformSettings
        fields = [
            'platform_name', 'max_booking_per_day', 'commission_rate',
            'notification_email', 'maintenance_mode', 'updated_at'
        ]
        read_only_fields = ['updated_at']
