from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction as db_transaction

from users.authentication import SupabaseAuthentication
from .models import Transaction, KhaltiConfig
from bookings.models import Booking
from bookings.views import IsServiceProvider
from .serializers import (
    TransactionSerializer,
    InitiatePaymentSerializer,
    VerifyKhaltiPaymentSerializer,
    PaymentHistorySerializer,
    ProviderEarningsSerializer
)
from .services import KhaltiService, PaymentService

import logging

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination for payment lists"""
    page_size = 20
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 100


class InitiatePaymentView(APIView):
    """
    POST /api/payments/initiate/
    
    Initiate payment for a booking (Khalti or Cash)
    
    Request body:
    {
        "booking_id": 123,
        "payment_method": "khalti",
        "return_url": "http://localhost:5173/payment/khalti/callback",
        "failure_url": "http://localhost:5173/payment/failure"
    }
    
    Response for Khalti (ePayment API - redirect flow):
    {
        "success": true,
        "transaction": {...},
        "payment_url": "https://pay.khalti.com/?pidx=xxx",
        "pidx": "xxx"
    }
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        try:
            serializer = InitiatePaymentSerializer(data=request.data, context={'request': request})
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            booking_id = serializer.validated_data['booking_id']
            payment_method = serializer.validated_data['payment_method']
            return_url = serializer.validated_data.get('return_url', '')
            failure_url = serializer.validated_data.get('failure_url', '')
            
            # Initiate payment
            result = PaymentService.initiate_payment(
                booking_id=booking_id,
                customer=request.user,
                payment_method=payment_method,
                return_url=return_url,
                failure_url=failure_url
            )
            
            # Handle different return types based on payment method
            if payment_method == 'khalti':
                # Khalti ePayment API returns dict with payment_url for redirect
                transaction_obj = result['transaction']
                response_data = {
                    'success': True,
                    'message': 'Payment initiated successfully',
                    'transaction': TransactionSerializer(transaction_obj).data,
                    'payment_url': result['payment_url'],  # Redirect user to this URL
                    'pidx': result['pidx'],
                    'purchase_order_id': result.get('purchase_order_id'),
                }
            
            else:
                # Cash payment returns Transaction object
                transaction_obj = result
                response_data = {
                    'success': True,
                    'message': 'Payment initiated successfully',
                    'transaction': TransactionSerializer(transaction_obj).data,
                }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error initiating payment: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class VerifyKhaltiPaymentView(APIView):
    """
    GET/POST /api/payments/khalti/verify/
    
    Verify Khalti payment after user is redirected back from Khalti
    
    Khalti redirects with query params: ?pidx=xxx&transaction_id=xxx&...
    OR can be called with POST body: { "pidx": "xxx" }
    
    Response:
    {
        "success": true,
        "message": "Payment verified successfully",
        "transaction": {...},
        "verification_data": {...}
    }
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    @db_transaction.atomic
    def get(self, request):
        """Handle GET request (redirect from Khalti)"""
        try:
            pidx = request.GET.get('pidx')
            transaction_id = request.GET.get('transaction_id')
            
            if not pidx:
                return Response({
                    'success': False,
                    'message': 'Missing pidx parameter'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify payment
            khalti_service = KhaltiService()
            result = khalti_service.verify_payment(pidx=pidx)
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': result['message'],
                    'transaction': TransactionSerializer(result['transaction']).data,
                    'verification_data': result.get('verification_data')
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': result['message']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error verifying Khalti payment: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @db_transaction.atomic
    def post(self, request):
        """Handle POST request (manual verification)"""
        try:
            pidx = request.data.get('pidx')
            transaction_uid = request.data.get('transaction_uid')
            
            if not pidx:
                return Response({
                    'success': False,
                    'message': 'Missing pidx parameter'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify payment
            khalti_service = KhaltiService()
            result = khalti_service.verify_payment(pidx=pidx, transaction_uid=transaction_uid)
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': result['message'],
                    'transaction': TransactionSerializer(result['transaction']).data,
                    'verification_data': result.get('verification_data')
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': result['message']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error verifying Khalti payment: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PaymentHistoryView(generics.ListAPIView):
    """
    GET /api/payments/history/
    
    Get payment history for logged-in customer
    
    Query params:
    - page: Page number
    - page_size: Items per page
    - status: Filter by status (pending, completed, failed, etc.)
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentHistorySerializer
    pagination_class = StandardResultsSetPagination
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        queryset = Transaction.objects.filter(customer=self.request.user)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('booking', 'booking__service', 'booking__provider').order_by('-created_at')


class PendingPaymentsView(APIView):
    """
    GET /api/payments/pending/
    
    Get bookings with pending payments for logged-in customer
    
    Returns bookings that are completed but not yet paid
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        try:
            pending_bookings = PaymentService.get_pending_payments(request.user)
            
            # Serialize booking data
            from bookings.serializers import BookingListSerializer
            serializer = BookingListSerializer(pending_bookings, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'count': len(pending_bookings),
                'pending_payments': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching pending payments: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class TransactionDetailView(generics.RetrieveAPIView):
    """
    GET /api/payments/transactions/<transaction_uid>/
    
    Get transaction details
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer
    lookup_field = 'transaction_uid'
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        # Only allow users to see their own transactions
        return Transaction.objects.filter(customer=self.request.user)


class KhaltiPublicKeyView(APIView):
    """
    GET /api/payments/khalti/public-key/
    
    Get Khalti public key for frontend (no authentication required)
    
    Response:
    {
        "public_key": "test_public_key_xxx",
        "is_test_mode": true
    }
    """
    permission_classes = []  # Public endpoint
    
    def get(self, request):
        try:
            khalti_service = KhaltiService()
            public_key = khalti_service.get_public_key()
            
            # Debug logging
            logger.info(f"Khalti public key being returned: {public_key}")
            logger.info(f"Is test mode: {khalti_service.is_test_mode}")
            
            return Response({
                'success': True,
                'public_key': public_key,
                'is_test_mode': khalti_service.is_test_mode
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting Khalti public key: {str(e)}")
            return Response({
                'success': False,
                'message': 'Khalti is not configured. Please contact support.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ConfirmCashPaymentView(APIView):
    """
    POST /api/payments/cash/confirm/
    
    Provider confirms that cash payment was received for a booking.
    
    Request body:
    {
        "booking_id": 123
    }
    
    Response:
    {
        "success": true,
        "message": "Cash payment confirmed successfully",
        "transaction": {...}
    }
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsServiceProvider]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        try:
            booking_id = request.data.get('booking_id')
            if not booking_id:
                return Response({
                    'success': False,
                    'message': 'Booking ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = PaymentService.confirm_cash_payment(
                booking_id=booking_id,
                provider=request.user
            )
            
            return Response({
                'success': True,
                'message': 'Cash payment confirmed successfully',
                'transaction': TransactionSerializer(result['transaction']).data,
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Booking not found or does not belong to you'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error confirming cash payment: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ProviderEarningsHistoryView(generics.ListAPIView):
    """
    GET /api/payments/provider/earnings/history/
    
    Get earnings history for logged-in provider (based on Payment model).
    
    Query params:
    - page, page_size: Pagination
    - status: Filter by payment status (pending, completed, etc.)
    - period: Filter by period (this_week, this_month, last_month, this_year)
    - payment_method: Filter by method (khalti, cash)
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsServiceProvider]
    serializer_class = ProviderEarningsSerializer
    pagination_class = StandardResultsSetPagination
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        from bookings.models import Payment
        from django.utils import timezone
        from datetime import timedelta
        import calendar
        
        queryset = Payment.objects.filter(provider=self.request.user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by payment method
        method_filter = self.request.query_params.get('payment_method')
        if method_filter:
            queryset = queryset.filter(payment_method=method_filter)
        
        # Filter by period
        period = self.request.query_params.get('period')
        if period:
            now = timezone.now()
            if period == 'this_week':
                start = now - timedelta(days=now.weekday())
                start = start.replace(hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(created_at__gte=start)
            elif period == 'this_month':
                start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(created_at__gte=start)
            elif period == 'last_month':
                first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if now.month == 1:
                    start = first_of_this_month.replace(year=now.year - 1, month=12)
                else:
                    start = first_of_this_month.replace(month=now.month - 1)
                queryset = queryset.filter(created_at__gte=start, created_at__lt=first_of_this_month)
            elif period == 'this_year':
                start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(created_at__gte=start)
        
        return queryset.select_related(
            'booking', 'booking__service', 'booking__service__specialization',
            'booking__customer'
        ).order_by('-created_at')


class ProviderEarningsStatsView(APIView):
    """
    GET /api/payments/provider/earnings/stats/
    
    Get earnings statistics for logged-in provider.
    Supports ?period= query param (this_week, this_month, last_month, this_year).
    
    Response:
    {
        "total_earnings": 12500.00,
        "provider_earnings": 11250.00,
        "platform_fees": 1250.00,
        "completed_jobs": 8,
        "pending_amount": 500.00,
        "pending_count": 1,
        "avg_job_value": 1406.25,
        "payment_methods_breakdown": {
            "khalti": {"count": 5, "amount": 8000.00},
            "cash": {"count": 3, "amount": 4500.00}
        }
    }
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsServiceProvider]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        from bookings.models import Payment
        from django.utils import timezone
        from django.db.models import Sum, Count, Avg, Q
        from datetime import timedelta
        
        try:
            queryset = Payment.objects.filter(provider=request.user)
            
            # Apply period filter
            period = request.query_params.get('period')
            if period:
                now = timezone.now()
                if period == 'this_week':
                    start = now - timedelta(days=now.weekday())
                    start = start.replace(hour=0, minute=0, second=0, microsecond=0)
                    queryset = queryset.filter(created_at__gte=start)
                elif period == 'this_month':
                    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    queryset = queryset.filter(created_at__gte=start)
                elif period == 'last_month':
                    first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    if now.month == 1:
                        start = first_of_this_month.replace(year=now.year - 1, month=12)
                    else:
                        start = first_of_this_month.replace(month=now.month - 1)
                    queryset = queryset.filter(created_at__gte=start, created_at__lt=first_of_this_month)
                elif period == 'this_year':
                    start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                    queryset = queryset.filter(created_at__gte=start)
            
            # Completed payments stats
            completed_qs = queryset.filter(status='completed')
            completed_agg = completed_qs.aggregate(
                total_earnings=Sum('amount'),
                provider_earnings=Sum('provider_amount'),
                platform_fees=Sum('platform_fee'),
                completed_jobs=Count('id'),
                avg_job_value=Avg('provider_amount'),
            )
            
            # Pending payments stats
            pending_qs = queryset.filter(status='pending')
            pending_agg = pending_qs.aggregate(
                pending_amount=Sum('provider_amount'),
                pending_count=Count('id'),
            )
            
            # Payment methods breakdown (completed only)
            method_breakdown = {}
            for method_choice in Payment.PAYMENT_METHOD_CHOICES:
                method_key = method_choice[0]
                method_agg = completed_qs.filter(payment_method=method_key).aggregate(
                    count=Count('id'),
                    amount=Sum('provider_amount'),
                )
                if method_agg['count'] > 0:
                    method_breakdown[method_key] = {
                        'count': method_agg['count'],
                        'amount': float(method_agg['amount'] or 0),
                    }
            
            return Response({
                'total_earnings': float(completed_agg['total_earnings'] or 0),
                'provider_earnings': float(completed_agg['provider_earnings'] or 0),
                'platform_fees': float(completed_agg['platform_fees'] or 0),
                'completed_jobs': completed_agg['completed_jobs'] or 0,
                'avg_job_value': round(float(completed_agg['avg_job_value'] or 0), 2),
                'pending_amount': float(pending_agg['pending_amount'] or 0),
                'pending_count': pending_agg['pending_count'] or 0,
                'payment_methods_breakdown': method_breakdown,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching provider earnings stats: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

