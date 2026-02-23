"""
Payment Services - Business logic for payment processing

This module handles:
1. Khalti payment initiation and verification
2. eSewa payment initiation and verification
3. Transaction management
4. Payment model updates
"""

import requests
import logging
import hashlib
import base64
import hmac
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.db import transaction as db_transaction
from .models import Transaction, KhaltiConfig, EsewaConfig
from bookings.models import Booking, Payment

logger = logging.getLogger(__name__)


class KhaltiService:
    """Service class for Khalti payment gateway integration"""
    
    # Khalti API endpoints
    KHALTI_VERIFICATION_URL = "https://khalti.com/api/v2/payment/verify/"
    KHALTI_TEST_VERIFICATION_URL = "https://khalti.com/api/v2/payment/verify/"  # Same for test
    
    def __init__(self):
        """Initialize with active Khalti configuration"""
        self.config = KhaltiConfig.get_active_config()
        if not self.config:
            # Fallback to environment variables
            self.public_key = settings.KHALTI_PUBLIC_KEY if hasattr(settings, 'KHALTI_PUBLIC_KEY') else None
            self.secret_key = settings.KHALTI_SECRET_KEY if hasattr(settings, 'KHALTI_SECRET_KEY') else None
            self.is_test_mode = getattr(settings, 'KHALTI_TEST_MODE', True)
        else:
            self.public_key = self.config.public_key
            self.secret_key = self.config.secret_key
            self.is_test_mode = self.config.is_test_mode
    
    def get_public_key(self):
        """Get public key for frontend"""
        if not self.public_key:
            raise ValueError("Khalti public key not configured")
        return self.public_key
    
    def initiate_payment(self, booking_id, customer, amount, return_url=None, failure_url=None):
        """
        Initiate payment - Create transaction record
        
        Note: Khalti doesn't have a separate initiation API.
        The actual payment is initiated on frontend using Khalti SDK.
        We just create a transaction record and return necessary data.
        
        Args:
            booking_id: Booking ID
            customer: User object
            amount: Payment amount in NRS
            return_url: URL to return after success
            failure_url: URL to return after failure
        
        Returns:
            Transaction object
        """
        try:
            # Get booking
            booking = Booking.objects.get(id=booking_id, customer=customer)
            
            # Validate amount
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= 0:
                raise ValueError("Amount must be greater than 0")
            
            # Create transaction
            transaction = Transaction.objects.create(
                booking=booking,
                customer=customer,
                payment_method='khalti',
                amount=amount_decimal,
                status='pending',
                customer_name=customer.get_full_name() or customer.email,
                customer_email=customer.email,
                customer_phone=getattr(customer, 'phone', ''),
                return_url=return_url or '',
                failure_url=failure_url or '',
                notes=f"Payment for booking #{booking.id}"
            )
            
            logger.info(f"Payment initiated: Transaction {transaction.transaction_uid}")
            return transaction
            
        except Booking.DoesNotExist:
            logger.error(f"Booking {booking_id} not found for customer {customer.id}")
            raise ValueError("Booking not found")
        except Exception as e:
            logger.error(f"Error initiating payment: {str(e)}")
            raise
    
    def verify_payment(self, token, amount, transaction_uid):
        """
        Verify Khalti payment using verification API
        
        Args:
            token: Khalti payment token from frontend
            amount: Amount in paisa (Khalti uses paisa, 1 NPR = 100 paisa)
            transaction_uid: Our transaction UID
        
        Returns:
            dict: Verification response
        """
        try:
            # Get transaction
            transaction_obj = Transaction.objects.get(transaction_uid=transaction_uid)
            
            if not self.secret_key:
                raise ValueError("Khalti secret key not configured")
            
            # Convert amount to paisa (Khalti expects amount in paisa)
            # If amount is already in paisa (from frontend), use as is
            # If amount is in NPR, convert to paisa
            amount_paisa = int(amount) if int(amount) >= 100 else int(float(amount) * 100)
            
            # Prepare verification request
            headers = {
                'Authorization': f'Key {self.secret_key}'
            }
            
            payload = {
                'token': token,
                'amount': amount_paisa  # Amount in paisa
            }
            
            # Make verification request
            logger.info(f"Verifying Khalti payment: token={token}, amount={amount_paisa} paisa")
            response = requests.post(
                self.KHALTI_VERIFICATION_URL,
                headers=headers,
                data=payload,
                timeout=30
            )
            
            response_data = response.json()
            logger.info(f"Khalti verification response: {response_data}")
            
            # Update transaction with verification response
            transaction_obj.verification_response = response_data
            transaction_obj.gateway_transaction_id = token
            
            # Check if verification was successful
            if response.status_code == 200 and response_data.get('idx'):
                # Payment verified successfully
                transaction_obj.gateway_payment_id = response_data.get('idx')
                transaction_obj.status = 'completed'
                transaction_obj.completed_at = timezone.now()
                transaction_obj.save()
                
                # Update Payment model in bookings app
                self._update_booking_payment(transaction_obj)
                
                logger.info(f"Payment verified successfully: Transaction {transaction_uid}")
                return {
                    'success': True,
                    'message': 'Payment verified successfully',
                    'transaction': transaction_obj,
                    'verification_data': response_data
                }
            else:
                # Verification failed
                transaction_obj.status = 'failed'
                transaction_obj.save()
                
                error_message = response_data.get('detail') or response_data.get('error_message') or 'Payment verification failed'
                logger.error(f"Payment verification failed: {error_message}")
                
                return {
                    'success': False,
                    'message': error_message,
                    'transaction': transaction_obj
                }
                
        except Transaction.DoesNotExist:
            logger.error(f"Transaction {transaction_uid} not found")
            raise ValueError("Transaction not found")
        except requests.RequestException as e:
            logger.error(f"Khalti API request failed: {str(e)}")
            raise ValueError(f"Payment verification failed: {str(e)}")
        except Exception as e:
            logger.error(f"Error verifying payment: {str(e)}")
            raise
    
    @db_transaction.atomic
    def _update_booking_payment(self, transaction_obj):
        """
        Update or create Payment record in bookings app
        
        Args:
            transaction_obj: Transaction object
        """
        try:
            booking = transaction_obj.booking
            
            # Get or create Payment record
            payment, created = Payment.objects.get_or_create(
                booking=booking,
                defaults={
                    'customer': transaction_obj.customer,
                    'provider': booking.provider,
                    'amount': transaction_obj.amount,
                    'payment_method': 'khalti',
                    'status': 'completed',
                    'transaction_id': str(transaction_obj.transaction_uid),
                    'reference_number': transaction_obj.gateway_payment_id,
                    'gateway_response': transaction_obj.verification_response,
                    'paid_at': timezone.now()
                }
            )
            
            if not created:
                # Update existing payment
                payment.amount = transaction_obj.amount
                payment.payment_method = 'khalti'
                payment.status = 'completed'
                payment.transaction_id = str(transaction_obj.transaction_uid)
                payment.reference_number = transaction_obj.gateway_payment_id
                payment.gateway_response = transaction_obj.verification_response
                payment.paid_at = timezone.now()
                payment.save()
            
            # Calculate platform fee and provider amount
            payment.calculate_provider_amount()
            payment.save()
            
            logger.info(f"Payment record updated for booking {booking.id}")
            
        except Exception as e:
            logger.error(f"Error updating booking payment: {str(e)}")
            raise


class PaymentService:
    """General payment service for handling multiple payment methods"""
    
    @staticmethod
    def get_pending_payments(customer):
        """Get bookings with pending payments for a customer"""
        from bookings.models import Booking
        
        # Get completed bookings without payment or with pending payment
        bookings = Booking.objects.filter(
            customer=customer,
            status__in=['completed', 'provider_completed', 'awaiting_customer']
        ).select_related('service', 'provider')
        
        pending = []
        for booking in bookings:
            if not hasattr(booking, 'payment') or booking.payment.status != 'completed':
                pending.append(booking)
        
        return pending
    
    @staticmethod
    def get_payment_history(customer):
        """Get payment history for a customer"""
        return Transaction.objects.filter(
            customer=customer,
            status='completed'
        ).select_related('booking', 'booking__service', 'booking__provider').order_by('-completed_at')
    
    @staticmethod
    def initiate_payment(booking_id, customer, payment_method, **kwargs):
        """
        Initiate payment based on payment method
        
        Args:
            booking_id: Booking ID
            customer: User object
            payment_method: Payment method ('khalti', 'esewa', 'cash')
            **kwargs: Additional parameters (return_url, failure_url, etc.)
        
        Returns:
            Transaction object or payment data
        """
        # Get booking
        booking = Booking.objects.get(id=booking_id, customer=customer)
        amount = booking.final_price or booking.quoted_price
        
        if not amount:
            raise ValueError("Booking amount not set")
        
        if payment_method == 'khalti':
            khalti_service = KhaltiService()
            return khalti_service.initiate_payment(
                booking_id=booking_id,
                customer=customer,
                amount=amount,
                return_url=kwargs.get('return_url'),
                failure_url=kwargs.get('failure_url')
            )
        elif payment_method == 'cash':
            # For cash payment, just create a pending transaction
            transaction = Transaction.objects.create(
                booking=booking,
                customer=customer,
                payment_method='cash',
                amount=amount,
                status='pending',
                customer_name=customer.get_full_name() or customer.email,
                customer_email=customer.email,
                customer_phone=getattr(customer, 'phone', ''),
                notes="Cash payment - pending confirmation"
            )
            return transaction
        elif payment_method == 'esewa':
            esewa_service = EsewaService()
            return esewa_service.initiate_payment(
                booking_id=booking_id,
                customer=customer,
                amount=amount,
                success_url=kwargs.get('return_url') or kwargs.get('success_url'),
                failure_url=kwargs.get('failure_url')
            )
        else:
            raise ValueError(f"Unsupported payment method: {payment_method}")


class EsewaService:
    """Service class for eSewa payment gateway integration"""
    
    # eSewa Epay endpoints
    # Note: eSewa has deprecated the old /epay/main endpoint
    # Use the newer /epay/main endpoint for both test and production
    ESEWA_PAYMENT_URL = "https://uat.esewa.com.np/epay/main"  # Test/UAT
    ESEWA_PRODUCTION_URL = "https://esewa.com.np/epay/main"   # Production
    
    # Alternative: Try the direct payment page
    # ESEWA_PAYMENT_URL = "https://uat.esewa.com.np/epay/transrec"  # Alternative test URL
    
    def __init__(self):
        """Initialize with active eSewa configuration"""
        self.config = EsewaConfig.get_active_config()
        if not self.config:
            # Fallback to environment variables
            self.merchant_code = getattr(settings, 'ESEWA_MERCHANT_CODE', 'EPAYTEST')
            self.secret_key = getattr(settings, 'ESEWA_SECRET_KEY', '')
            self.is_test_mode = getattr(settings, 'ESEWA_TEST_MODE', True)
        else:
            self.merchant_code = self.config.merchant_code
            self.secret_key = self.config.secret_key
            self.is_test_mode = self.config.is_test_mode
    
    def get_payment_url(self):
        """Get payment URL based on mode"""
        return self.ESEWA_PAYMENT_URL if self.is_test_mode else self.ESEWA_PRODUCTION_URL
    
    def initiate_payment(self, booking_id, customer, amount, success_url=None, failure_url=None):
        """
        Initiate eSewa payment - Create transaction and return form data
        
        eSewa uses form POST redirect method. This method returns the form data
        that frontend will use to POST to eSewa gateway.
        
        Args:
            booking_id: Booking ID
            customer: User object
            amount: Payment amount in NPR (not paisa)
            success_url: URL to return after success
            failure_url: URL to return after failure
        
        Returns:
            dict: Payment form data including transaction object
        """
        try:
            # Get booking
            booking = Booking.objects.get(id=booking_id, customer=customer)
            
            # Validate amount
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= 0:
                raise ValueError("Amount must be greater than 0")
            
            # Create transaction
            transaction = Transaction.objects.create(
                booking=booking,
                customer=customer,
                payment_method='esewa',
                amount=amount_decimal,
                status='pending',
                customer_name=customer.get_full_name() or customer.email,
                customer_email=customer.email,
                customer_phone=getattr(customer, 'phone', ''),
                return_url=success_url or '',
                failure_url=failure_url or '',
                notes=f"Payment for booking #{booking.id}"
            )
            
            # Generate eSewa form data
            # eSewa expects amount in NPR (not paisa like Khalti)
            payment_data = {
                'amt': str(amount_decimal),  # Total amount
                'psc': '0',  # Service charge
                'pdc': '0',  # Delivery charge
                'txAmt': '0',  # Tax amount
                'tAmt': str(amount_decimal),  # Total amount (must equal amt + psc + pdc + txAmt)
                'pid': str(transaction.transaction_uid),  # Product ID (our transaction UID)
                'scd': self.merchant_code,  # Merchant code
                'su': success_url or '',  # Success URL
                'fu': failure_url or '',  # Failure URL
            }
            
            logger.info(f"eSewa payment initiated: Transaction {transaction.transaction_uid}")
            
            return {
                'transaction': transaction,
                'payment_data': payment_data,
                'payment_url': self.get_payment_url(),
                'transaction_uid': str(transaction.transaction_uid)
            }
            
        except Booking.DoesNotExist:
            logger.error(f"Booking {booking_id} not found for customer {customer.id}")
            raise ValueError("Booking not found")
        except Exception as e:
            logger.error(f"Error initiating eSewa payment: {str(e)}")
            raise
    
    def verify_payment(self, query_params):
        """
        Verify eSewa payment using query parameters from success callback
        
        eSewa redirects to success URL with query parameters:
        - oid: Transaction UID (our pid)
        - amt: Amount
        - refId: eSewa reference ID
        
        Args:
            query_params: Dict of query parameters from eSewa callback
        
        Returns:
            dict: Verification response
        """
        try:
            # Extract parameters
            transaction_uid = query_params.get('oid')  # Our transaction UID
            amount = query_params.get('amt')
            ref_id = query_params.get('refId')  # eSewa reference ID
            
            if not all([transaction_uid, amount, ref_id]):
                raise ValueError("Missing required parameters in eSewa callback")
            
            # Get transaction
            transaction_obj = Transaction.objects.get(transaction_uid=transaction_uid)
            
            # Verify amount matches
            callback_amount = Decimal(str(amount))
            if callback_amount != transaction_obj.amount:
                logger.error(f"Amount mismatch: Expected {transaction_obj.amount}, got {callback_amount}")
                transaction_obj.status = 'failed'
                transaction_obj.verification_response = {
                    'error': 'Amount mismatch',
                    'expected': str(transaction_obj.amount),
                    'received': str(callback_amount)
                }
                transaction_obj.save()
                
                return {
                    'success': False,
                    'message': 'Amount verification failed',
                    'transaction': transaction_obj
                }
            
            # Verify signature if secret key is available
            if self.secret_key:
                is_valid = self._verify_signature(query_params)
                if not is_valid:
                    logger.error(f"Signature verification failed for transaction {transaction_uid}")
                    transaction_obj.status = 'failed'
                    transaction_obj.verification_response = {
                        'error': 'Signature verification failed'
                    }
                    transaction_obj.save()
                    
                    return {
                        'success': False,
                        'message': 'Signature verification failed',
                        'transaction': transaction_obj
                    }
            
            # Payment verified successfully
            transaction_obj.gateway_transaction_id = ref_id
            transaction_obj.gateway_payment_id = ref_id
            transaction_obj.status = 'completed'
            transaction_obj.completed_at = timezone.now()
            transaction_obj.verification_response = {
                'refId': ref_id,
                'amount': amount,
                'oid': transaction_uid,
                'verified_at': str(timezone.now())
            }
            transaction_obj.save()
            
            # Update Payment model in bookings app
            self._update_booking_payment(transaction_obj)
            
            logger.info(f"eSewa payment verified successfully: Transaction {transaction_uid}")
            
            return {
                'success': True,
                'message': 'Payment verified successfully',
                'transaction': transaction_obj,
                'verification_data': {
                    'refId': ref_id,
                    'amount': amount
                }
            }
            
        except Transaction.DoesNotExist:
            logger.error(f"Transaction {transaction_uid} not found")
            raise ValueError("Transaction not found")
        except Exception as e:
            logger.error(f"Error verifying eSewa payment: {str(e)}")
            raise
    
    def _verify_signature(self, query_params):
        """
        Verify eSewa signature (if applicable)
        
        Note: eSewa Epay v2 doesn't always include signature in test mode.
        This is a placeholder for production signature verification.
        
        Args:
            query_params: Query parameters from eSewa
        
        Returns:
            bool: True if valid or no signature required
        """
        # In test mode, signature verification may not be available
        if self.is_test_mode:
            logger.info("eSewa test mode: Skipping signature verification")
            return True
        
        # For production, implement signature verification using secret key
        # eSewa signature format varies by integration type
        # This is a placeholder - adjust based on actual eSewa documentation
        
        return True  # Default to True for now
    
    @db_transaction.atomic
    def _update_booking_payment(self, transaction_obj):
        """
        Update or create Payment record in bookings app
        
        Args:
            transaction_obj: Transaction object
        """
        try:
            booking = transaction_obj.booking
            
            # Get or create Payment object
            payment, created = Payment.objects.get_or_create(
                booking=booking,
                defaults={
                    'customer': transaction_obj.customer,
                    'provider': booking.provider,
                    'amount': transaction_obj.amount,
                    'payment_method': 'esewa',
                    'status': 'completed',
                    'transaction_id': str(transaction_obj.transaction_uid),
                    'reference_number': transaction_obj.gateway_payment_id,
                    'gateway_response': transaction_obj.verification_response,
                    'paid_at': timezone.now()
                }
            )
            
            if not created:
                # Update existing payment
                payment.amount = transaction_obj.amount
                payment.payment_method = 'esewa'
                payment.status = 'completed'
                payment.transaction_id = str(transaction_obj.transaction_uid)
                payment.reference_number = transaction_obj.gateway_payment_id
                payment.gateway_response = transaction_obj.verification_response
                payment.paid_at = timezone.now()
                payment.save()
            
            # Calculate platform fee and provider amount
            payment.calculate_provider_amount()
            payment.save()
            
            logger.info(f"Payment record updated for booking {booking.id}")
            
        except Exception as e:
            logger.error(f"Error updating booking payment: {str(e)}")
            raise
