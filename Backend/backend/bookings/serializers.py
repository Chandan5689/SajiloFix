from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from typing import Optional
from .models import Service, Booking, BookingImage, Payment, Review, ProviderAvailability

User = get_user_model()


class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    provider_city = serializers.CharField(source='provider.city', read_only=True)
    provider_district = serializers.CharField(source='provider.district', read_only=True)
    specialization_name = serializers.CharField(source='specialization.name', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'provider', 'provider_name', 'provider_city', 'provider_district', 'specialization', 'specialization_name',
            'title', 'description', 'base_price', 'price_type', 'minimum_charge',
            'estimated_duration', 'service_radius', 'requires_site_visit',
            'emergency_service', 'additional_charges_note', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'provider', 'provider_name', 'provider_city', 'provider_district', 'specialization_name', 'created_at', 'updated_at']

    def get_provider_name(self, obj):
        return obj.provider.get_full_name() or obj.provider.email


class BookingImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    uploader_name = serializers.SerializerMethodField()

    class Meta:
        model = BookingImage
        fields = ['id', 'image', 'image_url', 'image_type', 'uploaded_by', 'uploader_name', 'description', 'uploaded_at']
        read_only_fields = ['image_url', 'uploader_name', 'uploaded_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None

    def get_uploader_name(self, obj):
        return obj.get_uploader_name()


class BookingSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source='service.title', read_only=True)
    provider_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    images = BookingImageSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'customer', 'provider', 'service', 'service_title', 'status',
            'preferred_date', 'preferred_time', 'scheduled_date', 'scheduled_time',
            'service_address', 'service_city', 'service_district', 'latitude', 'longitude',
            'description', 'special_instructions', 'quoted_price', 'final_price',
            'customer_phone', 'customer_name', 'created_at', 'updated_at',
            'accepted_at', 'completed_at', 'cancelled_at', 'cancelled_by',
            'cancellation_reason', 'provider_notes', 'images', 'customer_email', 'provider_name'
        ]
        read_only_fields = [
            'id', 'customer', 'provider', 'service_title', 'created_at', 'updated_at',
            'accepted_at', 'completed_at', 'cancelled_at', 'cancelled_by',
            'images', 'customer_email', 'provider_name'
        ]

    def get_provider_name(self, obj):
        return obj.provider.get_full_name() or obj.provider.email


class PaymentSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    customer_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'booking_id', 'customer', 'provider', 'amount',
            'platform_fee_percentage', 'platform_fee', 'provider_amount',
            'payment_method', 'status', 'transaction_id', 'reference_number',
            'gateway_response', 'payment_notes', 'created_at', 'updated_at', 'paid_at',
            'refunded_at', 'refund_reason', 'refund_amount', 'customer_name', 'provider_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'paid_at', 'refunded_at', 'customer_name', 'provider_name']

    def get_customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.email

    def get_provider_name(self, obj):
        return obj.provider.get_full_name() or obj.provider.email


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    provider_name = serializers.CharField(source="provider.full_name", read_only=True)

    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ["id", "customer", "provider", "booking", "created_at", "updated_at"]


class ProviderAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderAvailability
        fields = ['id', 'weekly_schedule', 'settings', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_weekly_schedule(self, value):
        """Validate weekly schedule structure and times"""
        if not isinstance(value, list):
            raise serializers.ValidationError("weekly_schedule must be a list")
        
        expected_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        provided_days = [item.get('day') for item in value]
        
        if provided_days != expected_days:
            raise serializers.ValidationError(f"Days must be in order: {expected_days}")
        
        for day_item in value:
            if not day_item.get('enabled'):
                continue  # Skip validation for disabled days
            
            # Only require basic fields; breaks are optional
            required = ['day', 'enabled', 'start_time', 'end_time']
            missing = [field for field in required if field not in day_item or not day_item.get(field)]
            if missing:
                raise serializers.ValidationError(f"Missing or empty required fields in {day_item.get('day', 'Unknown')}: {', '.join(missing)}")
        
        return value
    
    def validate_settings(self, value):
        """Validate settings structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("settings must be a dict")
        return value

class ProviderListSerializer(serializers.ModelSerializer):
    """Serializer for listing providers with stats"""
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    specializations = serializers.SerializerMethodField()
    service_count = serializers.SerializerMethodField()
    starting_price = serializers.SerializerMethodField()
    starting_price_type = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone_number',
            'profile_picture', 'bio', 'city', 'district', 
            'years_of_experience', 'average_rating', 'review_count',
            'specializations', 'service_count', 'starting_price', 'starting_price_type'
        ]
    
    def get_average_rating(self, obj):
        """Calculate average rating from reviews"""
        avg_rating = Review.objects.filter(
            provider=obj
        ).aggregate(avg=Avg('rating'))['avg']
        return round(avg_rating, 1) if avg_rating else 0.0
    
    def get_review_count(self, obj):
        """Count total reviews for this provider"""
        return Review.objects.filter(provider=obj).count()
    
    def get_specializations(self, obj):
        """Get list of specializations for this provider"""
        return [
            spec.specialization.name 
            for spec in obj.user_specializations.all()
        ]
    
    def get_service_count(self, obj):
        """Count active services offered"""
        return obj.services.filter(is_active=True).count()

    def get_starting_price(self, obj) -> Optional[float]:
        """Return lowest effective starting price among active services.
        Effective start = minimum_charge (>0) else base_price.
        """
        services = obj.services.filter(is_active=True).only('minimum_charge', 'base_price')
        lowest = None
        for s in services:
            val = s.minimum_charge if (s.minimum_charge is not None and s.minimum_charge > 0) else s.base_price
            if val is None:
                continue
            lowest = val if lowest is None else (val if val < lowest else lowest)
        return lowest

    def get_starting_price_type(self, obj) -> Optional[str]:
        """Return price_type of the service that determines starting price."""
        services = obj.services.filter(is_active=True).only('minimum_charge', 'base_price', 'price_type')
        lowest_val = None
        lowest_type = None
        for s in services:
            val = s.minimum_charge if (s.minimum_charge is not None and s.minimum_charge > 0) else s.base_price
            if val is None:
                continue
            if lowest_val is None or val < lowest_val:
                lowest_val = val
                lowest_type = s.price_type
        return lowest_type


class ProviderDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed provider information"""
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    specializations = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone_number',
            'profile_picture', 'bio', 'city', 'district', 'address',
            'latitude', 'longitude',
            'years_of_experience', 'average_rating', 'review_count',
            'specializations', 'services'
        ]
    
    def get_average_rating(self, obj):
        """Calculate average rating from reviews"""
        avg_rating = Review.objects.filter(
            provider=obj
        ).aggregate(avg=Avg('rating'))['avg']
        return round(avg_rating, 1) if avg_rating else 0.0
    
    def get_review_count(self, obj):
        """Count total reviews for this provider"""
        return Review.objects.filter(provider=obj).count()
    
    def get_specializations(self, obj):
        """Get list of specializations for this provider"""
        return [
            spec.specialization.name 
            for spec in obj.user_specializations.all()
        ]
    
    def get_services(self, obj):
        """Get active services offered by this provider"""
        services = obj.services.filter(is_active=True)
        return ServiceSerializer(services, many=True).data