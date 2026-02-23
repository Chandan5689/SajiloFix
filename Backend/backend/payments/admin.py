from django.contrib import admin
from .models import Transaction, KhaltiConfig, EsewaConfig


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin interface for Transaction model"""
    
    list_display = [
        'transaction_uid', 'booking', 'customer', 'payment_method',
        'amount', 'status', 'created_at', 'completed_at'
    ]
    
    list_filter = [
        'status', 'payment_method', 'created_at', 'completed_at'
    ]
    
    search_fields = [
        'transaction_uid', 'gateway_transaction_id', 'gateway_payment_id',
        'customer__email', 'customer__first_name', 'customer__last_name',
        'customer_name', 'customer_email'
    ]
    
    readonly_fields = [
        'transaction_uid', 'created_at', 'updated_at', 'completed_at',
        'refunded_at', 'gateway_response', 'verification_response'
    ]
    
    fieldsets = (
        ('Transaction Info', {
            'fields': (
                'transaction_uid', 'booking', 'customer', 'payment_method',
                'amount', 'status'
            )
        }),
        ('Gateway Details', {
            'fields': (
                'gateway_transaction_id', 'gateway_payment_id',
                'gateway_response', 'verification_response'
            )
        }),
        ('Customer Info', {
            'fields': (
                'customer_name', 'customer_email', 'customer_phone'
            )
        }),
        ('URLs', {
            'fields': (
                'return_url', 'failure_url'
            ),
            'classes': ('collapse',)
        }),
        ('Refund Info', {
            'fields': (
                'refund_amount', 'refund_reason', 'refund_reference', 'refunded_at'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': (
                'notes', 'created_at', 'updated_at', 'completed_at'
            )
        }),
    )
    
    date_hierarchy = 'created_at'
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of completed transactions"""
        if obj and obj.status == 'completed':
            return False
        return super().has_delete_permission(request, obj)


@admin.register(KhaltiConfig)
class KhaltiConfigAdmin(admin.ModelAdmin):
    """Admin interface for Khalti Configuration"""
    
    list_display = [
        'name', 'is_active', 'is_test_mode', 'created_at'
    ]
    
    list_filter = ['is_active', 'is_test_mode']
    
    fieldsets = (
        ('Configuration', {
            'fields': (
                'name', 'is_active', 'is_test_mode'
            )
        }),
        ('API Keys', {
            'fields': (
                'public_key', 'secret_key'
            ),
            'description': 'Get these from Khalti Merchant Dashboard'
        }),
        ('Metadata', {
            'fields': (
                'created_at', 'updated_at'
            )
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        """Ensure only one active config"""
        if obj.is_active:
            KhaltiConfig.objects.filter(is_active=True).update(is_active=False)
        super().save_model(request, obj, form, change)


@admin.register(EsewaConfig)
class EsewaConfigAdmin(admin.ModelAdmin):
    """Admin interface for eSewa Configuration"""
    
    list_display = [
        'name', 'merchant_code', 'is_active', 'is_test_mode', 'created_at'
    ]
    
    list_filter = ['is_active', 'is_test_mode']
    
    fieldsets = (
        ('Configuration', {
            'fields': (
                'name', 'is_active', 'is_test_mode'
            )
        }),
        ('Epay v2 Credentials', {
            'fields': (
                'merchant_code', 'secret_key'
            ),
            'description': 'Get these from eSewa Merchant Dashboard'
        }),
        ('SDK Credentials (Optional)', {
            'fields': (
                'client_id', 'client_secret'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': (
                'created_at', 'updated_at'
            )
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        """Ensure only one active config"""
        if obj.is_active:
            EsewaConfig.objects.filter(is_active=True).update(is_active=False)
        super().save_model(request, obj, form, change)
