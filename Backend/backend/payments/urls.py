from django.urls import path
from .views import (
    InitiatePaymentView,
    VerifyKhaltiPaymentView,
    PaymentHistoryView,
    PendingPaymentsView,
    TransactionDetailView,
    KhaltiPublicKeyView,
    ConfirmCashPaymentView,
    ProviderEarningsHistoryView,
    ProviderEarningsStatsView,
)

urlpatterns = [
    # Payment initiation
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    
    # Khalti-specific endpoints
    path('khalti/verify/', VerifyKhaltiPaymentView.as_view(), name='khalti-verify'),
    path('khalti/public-key/', KhaltiPublicKeyView.as_view(), name='khalti-public-key'),
    
    # Cash payment endpoints
    path('cash/confirm/', ConfirmCashPaymentView.as_view(), name='cash-confirm'),
    
    # Payment history and status (customer)
    path('history/', PaymentHistoryView.as_view(), name='payment-history'),
    path('pending/', PendingPaymentsView.as_view(), name='payment-pending'),
    path('transactions/<uuid:transaction_uid>/', TransactionDetailView.as_view(), name='transaction-detail'),
    
    # Provider earnings
    path('provider/earnings/history/', ProviderEarningsHistoryView.as_view(), name='provider-earnings-history'),
    path('provider/earnings/stats/', ProviderEarningsStatsView.as_view(), name='provider-earnings-stats'),
]

