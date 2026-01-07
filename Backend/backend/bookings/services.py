from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from .models import Payment, Booking


class PaymentService:
    """
    Orchestrates payment release/hold tied to booking lifecycle.

    Assumptions:
    - A Payment record may or may not exist yet. If none exists, we skip
      processing and return a structured result to avoid inventing defaults.
    - Actual gateway capture/payout is not integrated here; this service
      only updates our Payment record state for now.
    """

    @staticmethod
    @transaction.atomic
    def release_payment(booking):
        """
        Release funds to the provider when a booking is approved/completed.

        Returns a dict result describing the action taken.
        """
        try:
            payment = booking.payment
        except Payment.DoesNotExist:
            return {"action": "release", "status": "skipped", "reason": "no_payment_attached"}

        if payment.status in ("completed", "refunded", "cancelled"):
            return {"action": "release", "status": "noop", "payment_status": payment.status}

        # Determine amount sanity; Payment.amount should be set by upstream flow.
        if payment.amount is None or payment.amount <= 0:
            return {"action": "release", "status": "skipped", "reason": "invalid_amount"}

        # Calculate platform/provider amounts if not yet set
        if payment.provider_amount is None or payment.platform_fee is None:
            payment.calculate_provider_amount()

        payment.status = "completed"
        payment.paid_at = timezone.now()
        note_line = f"[auto] Released on booking approval at {payment.paid_at.isoformat()}"
        payment.payment_notes = (payment.payment_notes + "\n" + note_line) if payment.payment_notes else note_line
        payment.save(update_fields=[
            "status", "paid_at", "platform_fee", "provider_amount", "payment_notes", "updated_at"
        ])

        return {"action": "release", "status": "released", "payment_id": payment.id}

    @staticmethod
    @transaction.atomic
    def hold_payment(booking, reason: str = ""):
        """
        Hold funds while a booking is disputed. We keep Payment.status as-is
        unless it's unsafe to do so. For MVP, a missing Payment is a skip.
        """
        try:
            payment = booking.payment
        except Payment.DoesNotExist:
            return {"action": "hold", "status": "skipped", "reason": "no_payment_attached"}

        if payment.status == "completed":
            # Already paid out – cannot hold retroactively in MVP
            return {"action": "hold", "status": "noop", "payment_status": payment.status}

        ts = timezone.now().isoformat()
        note_line = f"[auto] Held due to dispute at {ts}. {reason}".strip()
        payment.payment_notes = (payment.payment_notes + "\n" + note_line) if payment.payment_notes else note_line
        # Keep status pending to represent held funds (explicit 'held' state can be added later)
        payment.save(update_fields=["payment_notes", "updated_at"])

        return {"action": "hold", "status": "held", "payment_id": payment.id}


class BookingConflictService:
    """
    Handles booking conflict detection to prevent double-booking and 
    provides conflict warnings and alternative time suggestions.
    """

    @staticmethod
    def check_customer_pending_bookings(customer, provider):
        """
        Check if customer has any pending/confirmed/scheduled bookings with this provider.
        
        Args:
            customer: Customer user object
            provider: Provider user object
            
        Returns:
            {
                'has_conflict': bool,
                'pending_bookings': [Booking],
                'message': str
            }
        """
        pending_statuses = ['pending', 'confirmed', 'scheduled']
        existing = Booking.objects.filter(
            customer=customer,
            provider=provider,
            status__in=pending_statuses
        ).select_related('service').order_by('-created_at')
        
        has_conflict = existing.exists()
        message = ''
        
        if has_conflict:
            count = existing.count()
            message = f"You already have {count} {'booking' if count == 1 else 'bookings'} with this provider."
        
        return {
            'has_conflict': has_conflict,
            'pending_bookings': list(existing),
            'message': message
        }

    @staticmethod
    def check_time_slot_conflict(provider, date, time, exclude_booking_id=None):
        """
        Check if a time slot is already booked by the provider.
        
        Args:
            provider: Provider user object
            date: Date object or string (YYYY-MM-DD)
            time: Time object or string (HH:MM:SS)
            exclude_booking_id: Optional booking ID to exclude from check
            
        Returns:
            {
                'slot_available': bool,
                'conflicting_bookings': [Booking],
                'message': str
            }
        """
        statuses_to_check = ['confirmed', 'scheduled', 'in_progress']
        
        query = Booking.objects.filter(
            provider=provider,
            scheduled_date=date,
            scheduled_time=time,
            status__in=statuses_to_check
        ).select_related('service', 'customer')
        
        if exclude_booking_id:
            query = query.exclude(id=exclude_booking_id)
        
        conflicting = list(query)
        slot_available = len(conflicting) == 0
        message = ''
        
        if not slot_available:
            message = f"This time slot is already booked. {len(conflicting)} booking(s) at this time."
        
        return {
            'slot_available': slot_available,
            'conflicting_bookings': conflicting,
            'message': message
        }

    @staticmethod
    def get_available_time_slots(provider, date, minutes_per_slot=60, exclude_booking_id=None):
        """
        Get available time slots for a given date by checking provider's schedule
        and existing bookings.
        
        Args:
            provider: Provider user object
            date: Date object or string (YYYY-MM-DD)
            minutes_per_slot: Duration per booking slot in minutes (default 60)
            exclude_booking_id: Optional booking ID to exclude from check
            
        Returns:
            {
                'available_slots': [{'time': 'HH:MM:SS', 'label': '09:00 AM', 'available': bool}],
                'booked_times': [{'time': 'HH:MM:SS', 'booking_id': int, 'customer': str}],
                'message': str
            }
        """
        # Generate hourly slots (8 AM to 5 PM)
        slots = []
        booked_times = []
        
        for hour in range(8, 18):  # 8 AM to 5 PM
            time_str = f"{hour:02d}:00:00"
            time_display = f"{hour if hour <= 12 else hour - 12:02d}:00 {'AM' if hour < 12 else 'PM'}"
            slots.append({
                'time': time_str,
                'label': time_display,
                'available': True
            })
        
        # Check which slots are booked
        statuses_to_check = ['confirmed', 'scheduled', 'in_progress']
        booked = Booking.objects.filter(
            provider=provider,
            scheduled_date=date,
            status__in=statuses_to_check
        ).select_related('customer')
        
        if exclude_booking_id:
            booked = booked.exclude(id=exclude_booking_id)
        
        for booking in booked:
            if booking.scheduled_time:
                time_str = booking.scheduled_time.strftime('%H:%M:%S')
                time_display = booking.scheduled_time.strftime('%I:%M %p')
                
                # Mark slot as unavailable
                for slot in slots:
                    if slot['time'] == time_str:
                        slot['available'] = False
                        break
                
                # Add to booked times list
                booked_times.append({
                    'time': time_str,
                    'booking_id': booking.id,
                    'customer': booking.customer_name
                })
        
        available_slots = [s for s in slots if s['available']]
        
        message = f"Found {len(available_slots)} available time slot(s) out of {len(slots)} total."
        if not available_slots:
            message = "No available time slots on this date."
        
        return {
            'available_slots': available_slots,
            'booked_times': booked_times,
            'message': message
        }

    @staticmethod
    def get_alternative_dates(provider, preferred_date, days_ahead=7, exclude_booking_id=None):
        """
        Get alternative dates with availability near the preferred date.
        
        Args:
            provider: Provider user object
            preferred_date: Date object or string (YYYY-MM-DD)
            days_ahead: Number of days to look ahead
            exclude_booking_id: Optional booking ID to exclude from check
            
        Returns:
            {
                'alternatives': [
                    {
                        'date': 'YYYY-MM-DD',
                        'day_name': 'Monday',
                        'available_slots_count': int,
                        'total_slots': int
                    }
                ],
                'message': str
            }
        """
        from datetime import datetime, date as date_class
        
        # Convert preferred_date to date object if string
        if isinstance(preferred_date, str):
            preferred_date = datetime.strptime(preferred_date, '%Y-%m-%d').date()
        
        alternatives = []
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        # Check next 7 days
        for i in range(1, days_ahead + 1):
            check_date = preferred_date + timedelta(days=i)
            date_str = check_date.strftime('%Y-%m-%d')
            
            # Get available slots for this date
            slot_info = BookingConflictService.get_available_time_slots(
                provider, 
                check_date, 
                exclude_booking_id=exclude_booking_id
            )
            
            available_count = len(slot_info['available_slots'])
            total_count = len(slot_info['available_slots']) + len(slot_info['booked_times'])
            
            if available_count > 0:
                alternatives.append({
                    'date': date_str,
                    'day_name': day_names[check_date.weekday()],
                    'available_slots_count': available_count,
                    'total_slots': total_count
                })
        
        message = f"Found {len(alternatives)} date(s) with available slots in the next {days_ahead} days."
        if not alternatives:
            message = f"No available slots in the next {days_ahead} days."
        
        return {
            'alternatives': alternatives,
            'message': message
        }

    @staticmethod
    def validate_booking_request(customer, provider, service, preferred_date, preferred_time=None):
        """
        Comprehensive validation of a booking request for conflicts.
        
        Args:
            customer: Customer user object
            provider: Provider user object
            service: Service object
            preferred_date: Date object or string (YYYY-MM-DD)
            preferred_time: Optional time object or string (HH:MM:SS)
            
        Returns:
            {
                'valid': bool,
                'conflicts': [],
                'warnings': [],
                'suggestions': {
                    'alternative_times': [],
                    'alternative_dates': [],
                    'similar_services': []
                }
            }
        """
        conflicts = []
        warnings = []
        suggestions = {
            'alternative_times': [],
            'alternative_dates': [],
            'similar_services': []
        }
        
        # Check 1: Customer already has pending bookings with this provider
        pending_check = BookingConflictService.check_customer_pending_bookings(customer, provider)
        if pending_check['has_conflict']:
            warnings.append({
                'type': 'existing_pending_booking',
                'severity': 'high',
                'message': pending_check['message'],
                'bookings': [
                    {
                        'id': b.id,
                        'service': b.service.title,
                        'status': b.status,
                        'date': b.scheduled_date or b.preferred_date
                    }
                    for b in pending_check['pending_bookings']
                ]
            })
        
        # Check 2: Time slot conflict (only if preferred_time provided)
        if preferred_time:
            slot_check = BookingConflictService.check_time_slot_conflict(
                provider, 
                preferred_date, 
                preferred_time
            )
            if not slot_check['slot_available']:
                conflicts.append({
                    'type': 'time_slot_conflict',
                    'severity': 'critical',
                    'message': slot_check['message'],
                    'conflicting_bookings': [
                        {
                            'id': b.id,
                            'customer': b.customer_name,
                            'service': b.service.title
                        }
                        for b in slot_check['conflicting_bookings']
                    ]
                })
                
                # Provide alternative times
                available_slots = BookingConflictService.get_available_time_slots(
                    provider, 
                    preferred_date
                )
                suggestions['alternative_times'] = available_slots['available_slots'][:5]
        
        # Check 3: Get alternative dates if there's any conflict
        if conflicts or warnings:
            alternatives = BookingConflictService.get_alternative_dates(
                provider, 
                preferred_date, 
                days_ahead=7
            )
            suggestions['alternative_dates'] = alternatives['alternatives'][:3]
        
        valid = len(conflicts) == 0
        
        return {
            'valid': valid,
            'conflicts': conflicts,
            'warnings': warnings,
            'suggestions': suggestions
        }
