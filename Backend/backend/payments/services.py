"""
Payment Services - Business logic for payment processing

This module handles:
1. Khalti payment initiation and verification (ePayment API)
2. Cash payment processing
3. Transaction management
4. Payment model updates
"""

import requests
import logging
import hashlib
import base64
import hmac
import uuid
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.db import transaction as db_transaction
from .models import Transaction, KhaltiConfig
from bookings.models import Booking, Payment

logger = logging.getLogger(__name__)


class KhaltiService:
    """
    Service class for Khalti payment gateway integration
    
    Uses the new Khalti ePayment API (not the deprecated checkout SDK)
    Documentation: https://docs.khalti.com/khalti-epayment/
    """
    
    # Khalti ePayment API endpoints
    # Sandbox/Test URLs
    KHALTI_INITIATE_URL_TEST = "https://a.khalti.com/api/v2/epayment/initiate/"
    KHALTI_LOOKUP_URL_TEST = "https://a.khalti.com/api/v2/epayment/lookup/"
    
    # Production URLs
    KHALTI_INITIATE_URL_PROD = "https://khalti.com/api/v2/epayment/initiate/"
    KHALTI_LOOKUP_URL_PROD = "https://khalti.com/api/v2/epayment/lookup/"
    
    def __init__(self):
        """Initialize with active Khalti configuration"""
        self.config = KhaltiConfig.get_active_config()
        if not self.config:
            # Fallback to environment variables
            self.public_key = getattr(settings, 'KHALTI_PUBLIC_KEY', None)
            self.secret_key = getattr(settings, 'KHALTI_SECRET_KEY', None)
            self.is_test_mode = getattr(settings, 'KHALTI_TEST_MODE', True)
        else:
            self.public_key = self.config.public_key
            self.secret_key = self.config.secret_key
            self.is_test_mode = self.config.is_test_mode
        
        # Set URLs based on mode
        if self.is_test_mode:
            self.initiate_url = self.KHALTI_INITIATE_URL_TEST
            self.lookup_url = self.KHALTI_LOOKUP_URL_TEST
        else:
            self.initiate_url = self.KHALTI_INITIATE_URL_PROD
            self.lookup_url = self.KHALTI_LOOKUP_URL_PROD
    
    def get_public_key(self):
        """Get public key for frontend"""
        if not self.public_key:
            raise ValueError("Khalti public key not configured")
        return self.public_key
    
    def initiate_payment(self, booking_id, customer, amount, return_url=None, failure_url=None):
        """
        Initiate Khalti ePayment
        
        This creates a transaction record and initiates payment with Khalti's ePayment API.
        Khalti will return a payment_url where user should be redirected.
        
        Args:
            booking_id: Booking ID
            customer: User object
            amount: Payment amount in NPR
            return_url: URL to return after payment (success or failure)
            failure_url: URL for failure (optional, can use return_url)
        
        Returns:
            dict with transaction and payment_url
        """
        try:
            # Get booking
            booking = Booking.objects.get(id=booking_id, customer=customer)
            
            # Validate amount
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= 0:
                raise ValueError("Amount must be greater than 0")
            
            # Convert to paisa (Khalti uses paisa)
            amount_paisa = int(amount_decimal * 100)
            
            # Create unique purchase order ID
            purchase_order_id = f"SJFX-{booking.id}-{uuid.uuid4().hex[:8].upper()}"
            
            # Create transaction record
            transaction = Transaction.objects.create(
                booking=booking,
                customer=customer,
                payment_method='khalti',
                amount=amount_decimal,
                status='pending',
                customer_name=customer.get_full_name() or customer.email,
                customer_email=customer.email,
                customer_phone=getattr(customer, 'phone', '') or '',
                return_url=return_url or '',
                failure_url=failure_url or '',
                notes=f"Payment for booking #{booking.id}"
            )
            
            # Prepare Khalti ePayment initiation request
            headers = {
                'Authorization': f'key {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'return_url': return_url or '',
                'website_url': return_url.rsplit('/', 1)[0] if return_url else 'http://localhost:5173',
                'amount': amount_paisa,
                'purchase_order_id': purchase_order_id,
                'purchase_order_name': f"Booking #{booking.id} - {booking.service.title if booking.service else 'Service'}",
                'customer_info': {
                    'name': customer.get_full_name() or customer.email.split('@')[0],
                    'email': customer.email,
                    'phone': getattr(customer, 'phone', '') or '9800000000'
                }
            }
            
            logger.info(f"Initiating Khalti payment: {payload}")
            logger.info(f"Khalti initiate URL: {self.initiate_url}")
            
            # Make API request to Khalti
            response = requests.post(
                self.initiate_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response_data = response.json()
            logger.info(f"Khalti initiate response: {response_data}")
            
            if response.status_code == 200 and response_data.get('payment_url'):
                # Store Khalti's pidx for later verification
                transaction.gateway_transaction_id = response_data.get('pidx')
                transaction.gateway_response = response_data
                transaction.status = 'processing'
                transaction.save()
                
                logger.info(f"Payment initiated: Transaction {transaction.transaction_uid}, pidx: {response_data.get('pidx')}")
                
                return {
                    'transaction': transaction,
                    'payment_url': response_data.get('payment_url'),
                    'pidx': response_data.get('pidx'),
                    'purchase_order_id': purchase_order_id
                }
            else:
                # Khalti returned an error
                error_msg = response_data.get('detail') or response_data.get('error_message') or str(response_data)
                logger.error(f"Khalti initiation failed: {error_msg}")
                
                transaction.status = 'failed'
                transaction.gateway_response = response_data
                transaction.save()
                
                raise ValueError(f"Khalti payment initiation failed: {error_msg}")
                
        except Booking.DoesNotExist:
            logger.error(f"Booking {booking_id} not found for customer {customer.id}")
            raise ValueError("Booking not found")
        except requests.RequestException as e:
            logger.error(f"Khalti API request failed: {str(e)}")
            raise ValueError(f"Failed to connect to Khalti: {str(e)}")
        except Exception as e:
            logger.error(f"Error initiating payment: {str(e)}")
            raise
    
    def verify_payment(self, pidx, transaction_uid=None):
        """
        Verify/Lookup Khalti payment using pidx
        
        After user completes payment, Khalti redirects back with pidx.
        We use this to verify the payment status.
        
        Args:
            pidx: Khalti payment ID (from redirect or initiate response)
            transaction_uid: Our transaction UID (optional, for lookup)
        
        Returns:
            dict: Verification response
        """
        try:
            # Find transaction by pidx or transaction_uid
            if transaction_uid:
                transaction_obj = Transaction.objects.get(transaction_uid=transaction_uid)
            else:
                transaction_obj = Transaction.objects.get(gateway_transaction_id=pidx)
            
            if not self.secret_key:
                raise ValueError("Khalti secret key not configured")
            
            # Prepare lookup request
            headers = {
                'Authorization': f'key {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'pidx': pidx
            }
            
            logger.info(f"Verifying Khalti payment: pidx={pidx}")
            
            # Make lookup request
            response = requests.post(
                self.lookup_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response_data = response.json()
            logger.info(f"Khalti lookup response: {response_data}")
            
            # Update transaction with verification response
            transaction_obj.verification_response = response_data
            
            # Check payment status
            status = response_data.get('status', '').lower()
            
            if status == 'completed':
                # Payment verified successfully
                transaction_obj.gateway_payment_id = response_data.get('transaction_id')
                transaction_obj.status = 'completed'
                transaction_obj.completed_at = timezone.now()
                transaction_obj.save()
                
                # Update Payment model in bookings app
                self._update_booking_payment(transaction_obj)
                
                logger.info(f"Payment verified successfully: Transaction {transaction_obj.transaction_uid}")
                return {
                    'success': True,
                    'message': 'Payment verified successfully',
                    'transaction': transaction_obj,
                    'verification_data': response_data
                }
            elif status == 'pending':
                transaction_obj.status = 'processing'
                transaction_obj.save()
                
                return {
                    'success': False,
                    'message': 'Payment is still pending',
                    'transaction': transaction_obj
                }
            elif status in ['initiated', 'refunded', 'expired', 'user canceled']:
                transaction_obj.status = 'failed' if status != 'refunded' else 'refunded'
                transaction_obj.save()
                
                return {
                    'success': False,
                    'message': f'Payment {status}',
                    'transaction': transaction_obj
                }
            else:
                # Unknown status or error
                transaction_obj.status = 'failed'
                transaction_obj.save()
                
                error_message = response_data.get('detail') or f'Unknown status: {status}'
                logger.error(f"Payment verification failed: {error_message}")
                
                return {
                    'success': False,
                    'message': error_message,
                    'transaction': transaction_obj
                }
                
        except Transaction.DoesNotExist:
            logger.error(f"Transaction not found for pidx={pidx}, uid={transaction_uid}")
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
            from decimal import Decimal
            
            booking = transaction_obj.booking
            amount = transaction_obj.amount
            
            # Calculate platform fee and provider amount upfront
            # Default platform fee is 10% - use Decimal for proper calculation
            platform_fee_percentage = Decimal('10.00')
            platform_fee = (amount * platform_fee_percentage) / Decimal('100')
            provider_amount = amount - platform_fee
            
            # Get or create Payment record with all required fields
            payment, created = Payment.objects.get_or_create(
                booking=booking,
                defaults={
                    'customer': transaction_obj.customer,
                    'provider': booking.provider,
                    'amount': amount,
                    'platform_fee_percentage': platform_fee_percentage,
                    'platform_fee': platform_fee,
                    'provider_amount': provider_amount,  # Required field
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
                payment.amount = amount
                payment.platform_fee_percentage = platform_fee_percentage
                payment.platform_fee = platform_fee
                payment.provider_amount = provider_amount
                payment.payment_method = 'khalti'
                payment.status = 'completed'
                payment.transaction_id = str(transaction_obj.transaction_uid)
                payment.reference_number = transaction_obj.gateway_payment_id
                payment.gateway_response = transaction_obj.verification_response
                payment.paid_at = timezone.now()
                payment.save()
            
            # Also update the booking status to completed if not already
            if booking.status not in ['completed', 'cancelled']:
                booking.status = 'completed'
                booking.save(update_fields=['status'])
            
            logger.info(f"Payment record {'created' if created else 'updated'} for booking {booking.id}")
            
        except Exception as e:
            logger.error(f"Error updating booking payment: {str(e)}")
            raise


class PaymentService:
    """General payment service for handling multiple payment methods"""
    
    @staticmethod
    def get_pending_payments(customer):
        """Get bookings with pending payments for a customer"""
        from bookings.models import Booking, Payment
        
        # Get completed bookings without payment or with pending payment
        bookings = Booking.objects.filter(
            customer=customer,
            status__in=['completed', 'provider_completed']
        ).select_related('service', 'provider').prefetch_related('payment')
        
        pending = []
        for booking in bookings:
            try:
                # Check if payment exists and is completed
                if hasattr(booking, 'payment') and booking.payment and booking.payment.status == 'completed':
                    continue  # Skip - payment is complete
            except Payment.DoesNotExist:
                pass  # No payment exists, so it's pending
            
            # Add to pending list
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
            payment_method: Payment method ('khalti', 'cash')
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
            # For cash payment, create a pending transaction AND a pending Payment record
            transaction = Transaction.objects.create(
                booking=booking,
                customer=customer,
                payment_method='cash',
                amount=amount,
                status='pending',
                customer_name=customer.get_full_name() or customer.email,
                customer_email=customer.email,
                customer_phone=getattr(customer, 'phone', ''),
                notes="Cash payment - pending provider confirmation"
            )
            
            # Also create a pending Payment record so the booking shows payment info
            platform_fee_percentage = Decimal('10.00')
            platform_fee = (amount * platform_fee_percentage) / Decimal('100')
            provider_amount = amount - platform_fee
            
            Payment.objects.get_or_create(
                booking=booking,
                defaults={
                    'customer': customer,
                    'provider': booking.provider,
                    'amount': amount,
                    'platform_fee_percentage': platform_fee_percentage,
                    'platform_fee': platform_fee,
                    'provider_amount': provider_amount,
                    'payment_method': 'cash',
                    'status': 'pending',
                    'transaction_id': str(transaction.transaction_uid),
                }
            )
            
            return transaction
        else:
            raise ValueError(f"Unsupported payment method: {payment_method}")
    
    @staticmethod
    @db_transaction.atomic
    def confirm_cash_payment(booking_id, provider):
        """
        Provider confirms that cash payment was received for a booking.
        
        Updates both the Transaction and Payment records to 'completed'.
        
        Args:
            booking_id: Booking ID
            provider: Provider user object (the one confirming)
        
        Returns:
            dict with transaction and payment objects
        """
        # Get booking and verify it belongs to this provider
        booking = Booking.objects.get(id=booking_id, provider=provider)
        
        # Find the pending cash transaction for this booking
        try:
            transaction = Transaction.objects.filter(
                booking=booking,
                payment_method='cash',
                status='pending'
            ).latest('created_at')
        except Transaction.DoesNotExist:
            raise ValueError("No pending cash transaction found for this booking")
        
        # Update transaction to completed
        transaction.status = 'completed'
        transaction.completed_at = timezone.now()
        transaction.notes = f"Cash payment confirmed by provider on {timezone.now().strftime('%Y-%m-%d %H:%M')}"
        transaction.save()
        
        # Update Payment record to completed
        try:
            payment = Payment.objects.get(booking=booking)
            payment.status = 'completed'
            payment.paid_at = timezone.now()
            payment.save()
        except Payment.DoesNotExist:
            # Create Payment record if it doesn't exist
            amount = transaction.amount
            platform_fee_percentage = Decimal('10.00')
            platform_fee = (amount * platform_fee_percentage) / Decimal('100')
            provider_amount = amount - platform_fee
            
            Payment.objects.create(
                booking=booking,
                customer=booking.customer,
                provider=provider,
                amount=amount,
                platform_fee_percentage=platform_fee_percentage,
                platform_fee=platform_fee,
                provider_amount=provider_amount,
                payment_method='cash',
                status='completed',
                transaction_id=str(transaction.transaction_uid),
                paid_at=timezone.now()
            )
        
        # Update booking status to completed if it's in provider_completed
        if booking.status in ['provider_completed', 'completed']:
            booking.status = 'completed'
            if not booking.completed_at:
                booking.completed_at = timezone.now()
            booking.save(update_fields=['status', 'completed_at'])
        
        logger.info(f"Cash payment confirmed for booking {booking_id} by provider {provider.id}")
        
        return {
            'transaction': transaction,
            'booking': booking
        }
