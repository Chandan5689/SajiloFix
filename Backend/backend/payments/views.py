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
from .models import Transaction, KhaltiConfig, EsewaConfig
from bookings.models import Booking
from bookings.views import IsServiceProvider
from .serializers import (
    TransactionSerializer,
    InitiatePaymentSerializer,
    VerifyKhaltiPaymentSerializer,
    VerifyEsewaPaymentSerializer,
    PaymentHistorySerializer
)
from .services import KhaltiService, EsewaService, PaymentService

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
    
    Initiate payment for a booking
    
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
        "payment_url": "https://pay.khalti.com/?pidx=xxx",  # Redirect user here
        "pidx": "xxx"
    }
    
    Response for eSewa:
    {
        "success": true,
        "transaction": {...},
        "payment_data": {...},  # Form data for POST
        "payment_url": "https://uat.esewa.com.np/epay/main"
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
            if payment_method == 'esewa':
                # eSewa returns a dict with transaction object and payment data
                transaction_obj = result['transaction']
                response_data = {
                    'success': True,
                    'message': 'Payment initiated successfully',
                    'transaction': TransactionSerializer(transaction_obj).data,
                    'payment_data': result['payment_data'],
                    'payment_url': result['payment_url'],
                    'transaction_uid': result['transaction_uid']
                }
            
            elif payment_method == 'khalti':
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
                # Cash or other methods return Transaction object
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


class InitiateEsewaPaymentView(APIView):
    """
    POST /api/payments/esewa/initiate/
    
    Initiate eSewa payment for a booking
    
    Request body:
    {
        "booking_id": 123,
        "success_url": "http://localhost:5173/payment/esewa/success",
        "failure_url": "http://localhost:5173/payment/esewa/failure"
    }
    
    Response:
    {
        "success": true,
        "transaction": {...},
        "payment_data": {
            "amt": "1500",
            "psc": "0",
            "pdc": "0",
            "txAmt": "0",
            "tAmt": "1500",
            "pid": "uuid-here",
            "scd": "EPAYTEST",
            "su": "success_url",
            "fu": "failure_url"
        },
        "payment_url": "https://uat.esewa.com.np/epay/main",
        "transaction_uid": "uuid-here"
    }
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        try:
            booking_id = request.data.get('booking_id')
            success_url = request.data.get('success_url', '')
            failure_url = request.data.get('failure_url', '')
            
            if not booking_id:
                return Response({
                    'success': False,
                    'message': 'Booking ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Initiate eSewa payment
            esewa_service = EsewaService()
            result = esewa_service.initiate_payment(
                booking_id=booking_id,
                customer=request.user,
                amount=None,  # Will be fetched from booking
                success_url=success_url,
                failure_url=failure_url
            )
            
            return Response({
                'success': True,
                'message': 'eSewa payment initiated successfully',
                'transaction': TransactionSerializer(result['transaction']).data,
                'payment_data': result['payment_data'],
                'payment_url': result['payment_url'],
                'transaction_uid': result['transaction_uid']
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error initiating eSewa payment: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class VerifyEsewaPaymentView(APIView):
    """
    GET /api/payments/esewa/verify/
    
    Verify eSewa payment after redirect from eSewa
    
    Query params from eSewa:
    - oid: Transaction UID (our pid)
    - amt: Amount in NPR
    - refId: eSewa reference ID
    
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
        try:
            # Get query parameters from eSewa redirect
            query_params = {
                'oid': request.GET.get('oid'),
                'amt': request.GET.get('amt'),
                'refId': request.GET.get('refId')
            }
            
            # Validate using serializer
            serializer = VerifyEsewaPaymentSerializer(data=query_params)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify payment
            esewa_service = EsewaService()
            result = esewa_service.verify_payment(query_params)
            
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
            logger.error(f"Error verifying eSewa payment: {str(e)}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


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


class EsewaPaymentInfoView(APIView):
    """
    GET /api/payments/esewa/info/
    
    Get eSewa payment configuration info (no authentication required)
    
    Response:
    {
        "success": true,
        "payment_url": "https://uat.esewa.com.np/epay/main",
        "is_test_mode": true,
        "merchant_code": "EPAYTEST"
    }
    """
    permission_classes = []  # Public endpoint
    
    def get(self, request):
        try:
            esewa_service = EsewaService()
            
            return Response({
                'success': True,
                'payment_url': esewa_service.get_payment_url(),
                'is_test_mode': esewa_service.is_test_mode,
                'merchant_code': esewa_service.merchant_code
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting eSewa info: {str(e)}")
            return Response({
                'success': False,
                'message': 'eSewa is not configured. Please contact support.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

