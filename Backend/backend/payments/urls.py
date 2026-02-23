from django.urls import path
from .views import (
    InitiatePaymentView,
    VerifyKhaltiPaymentView,
    PaymentHistoryView,
    PendingPaymentsView,
    TransactionDetailView,
    KhaltiPublicKeyView,
    InitiateEsewaPaymentView,
    VerifyEsewaPaymentView,
    EsewaPaymentInfoView,
    ConfirmCashPaymentView,
)

urlpatterns = [
    # Payment initiation
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    
    # Khalti-specific endpoints
    path('khalti/verify/', VerifyKhaltiPaymentView.as_view(), name='khalti-verify'),
    path('khalti/public-key/', KhaltiPublicKeyView.as_view(), name='khalti-public-key'),
    
    # Cash payment endpoints
    path('cash/confirm/', ConfirmCashPaymentView.as_view(), name='cash-confirm'),
    
    # eSewa-specific endpoints
    path('esewa/initiate/', InitiateEsewaPaymentView.as_view(), name='esewa-initiate'),
    path('esewa/verify/', VerifyEsewaPaymentView.as_view(), name='esewa-verify'),
    path('esewa/info/', EsewaPaymentInfoView.as_view(), name='esewa-info'),
    
    # Payment history and status
    path('history/', PaymentHistoryView.as_view(), name='payment-history'),
    path('pending/', PendingPaymentsView.as_view(), name='payment-pending'),
    path('transactions/<uuid:transaction_uid>/', TransactionDetailView.as_view(), name='transaction-detail'),
]

