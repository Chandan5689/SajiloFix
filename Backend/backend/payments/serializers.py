from rest_framework import serializers
from .models import Transaction, KhaltiConfig, EsewaConfig
from bookings.models import Booking, Payment


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""
    
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    booking_service_title = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_uid', 'booking', 'booking_service_title',
            'customer', 'payment_method', 'payment_method_display',
            'amount', 'status', 'status_display',
            'gateway_transaction_id', 'gateway_payment_id',
            'customer_name', 'customer_email', 'customer_phone',
            'created_at', 'updated_at', 'completed_at',
            'refund_amount', 'refund_reason', 'refunded_at',
        ]
        read_only_fields = [
            'id', 'transaction_uid', 'customer', 'gateway_transaction_id',
            'gateway_payment_id', 'created_at', 'updated_at', 'completed_at',
            'refunded_at', 'payment_method_display', 'status_display',
            'booking_service_title'
        ]
    
    def get_booking_service_title(self, obj):
        """Get service title from booking"""
        if obj.booking and obj.booking.service:
            return obj.booking.service.title or obj.booking.service.specialization.name
        return None


class InitiatePaymentSerializer(serializers.Serializer):
    """Serializer for initiating payment"""
    
    booking_id = serializers.IntegerField(required=True)
    payment_method = serializers.ChoiceField(
        choices=['khalti', 'esewa', 'cash'],
        required=True
    )
    return_url = serializers.URLField(required=False)
    failure_url = serializers.URLField(required=False)
    
    def validate_booking_id(self, value):
        """Validate booking exists and belongs to user"""
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Request context is required")
        
        try:
            booking = Booking.objects.get(id=value, customer=request.user)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found or doesn't belong to you")
        
        # Check booking status - only completed or provider_completed bookings can be paid
        if booking.status not in ['completed', 'provider_completed', 'awaiting_customer']:
            raise serializers.ValidationError(
                f"Cannot pay for booking with status '{booking.status}'. "
                "Booking must be completed first."
            )
        
        # Check if already paid
        if hasattr(booking, 'payment') and booking.payment.status == 'completed':
            raise serializers.ValidationError("This booking has already been paid")
        
        return value


class VerifyKhaltiPaymentSerializer(serializers.Serializer):
    """Serializer for verifying Khalti payment (ePayment API)"""
    
    pidx = serializers.CharField(required=True, help_text="Khalti payment ID from redirect")
    transaction_uid = serializers.UUIDField(required=False, help_text="Our transaction UID (optional)")


class PaymentHistorySerializer(serializers.ModelSerializer):
    """Lightweight serializer for payment history"""
    
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    service_title = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_uid', 'booking_id', 'service_title',
            'provider_name', 'amount', 'payment_method', 'payment_method_display',
            'status', 'status_display', 'created_at', 'completed_at'
        ]
        read_only_fields = fields
    
    def get_service_title(self, obj):
        """Get service title from booking"""
        if obj.booking and obj.booking.service:
            return obj.booking.service.title or obj.booking.service.specialization.name
        return "Unknown Service"
    
    def get_provider_name(self, obj):
        """Get provider name from booking"""
        if obj.booking and obj.booking.provider:
            return obj.booking.provider.get_full_name() or obj.booking.provider.email
        return "Unknown Provider"


class KhaltiConfigSerializer(serializers.ModelSerializer):
    """Serializer for Khalti configuration (admin only)"""
    
    class Meta:
        model = KhaltiConfig
        fields = ['id', 'name', 'public_key', 'is_active', 'is_test_mode', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'secret_key': {'write_only': True}  # Never expose secret key
        }


class VerifyEsewaPaymentSerializer(serializers.Serializer):
    """Serializer for verifying eSewa payment"""
    
    oid = serializers.UUIDField(required=True, help_text="Transaction UID (pid from eSewa)")
    amt = serializers.DecimalField(max_digits=10, decimal_places=2, required=True, help_text="Amount in NPR")
    refId = serializers.CharField(required=True, help_text="eSewa reference ID")
    
    def validate(self, data):
        """Ensure all required eSewa parameters are present"""
        if not all([data.get('oid'), data.get('amt'), data.get('refId')]):
            raise serializers.ValidationError("Missing required eSewa verification parameters")
        return data


class EsewaConfigSerializer(serializers.ModelSerializer):
    """Serializer for eSewa configuration (admin only)"""
    
    class Meta:
        model = EsewaConfig
        fields = [
            'id', 'name', 'merchant_code', 'is_active', 
            'is_test_mode', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'secret_key': {'write_only': True},  # Never expose secret key
            'client_id': {'write_only': True},
            'client_secret': {'write_only': True}
        }

