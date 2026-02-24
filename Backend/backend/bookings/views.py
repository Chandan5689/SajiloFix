from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Avg, Count, Sum, Case, When, Value, F, DecimalField
from django.db.models.functions import Coalesce
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from users.authentication import SupabaseAuthentication
from .models import Service, Booking, BookingImage, Payment, Review, ProviderAvailability
from .serializers import (
	ServiceSerializer,
	BookingSerializer,
	BookingListSerializer,
	BookingImageSerializer,
	PaymentSerializer,
	ReviewSerializer,
	ProviderAvailabilitySerializer,
	ProviderListSerializer,
	ProviderDetailSerializer
)
from .emails import send_booking_notification_to_provider, send_booking_acceptance_to_customer, send_booking_expiry_notification

User = get_user_model()
NPT = ZoneInfo("Asia/Kathmandu")

import logging
logger = logging.getLogger(__name__)


def _lazy_expire_overdue_bookings(customer=None, provider=None):
	"""
	Lazy-expire any pending bookings that are past their confirmation_deadline.
	Called when listing bookings so expired ones are updated before the user sees them.
	Sends expiry notification emails for each expired booking.
	"""
	filters = {'status': 'pending', 'confirmation_deadline__lte': timezone.now()}
	if customer:
		filters['customer'] = customer
	if provider:
		filters['provider'] = provider

	overdue = Booking.objects.filter(**filters).select_related('customer', 'provider', 'service')
	for booking in overdue:
		if booking.expire_if_overdue():
			try:
				send_booking_expiry_notification(booking)
			except Exception as e:
				logger.error(f"Failed to send expiry email for booking {booking.id}: {e}")


class StandardResultsSetPagination(PageNumberPagination):
	"""Standard pagination for dashboards"""
	page_size = 20
	page_query_param = 'page'
	page_size_query_param = 'page_size'
	max_page_size = 100


class IsServiceSeeker(BasePermission):
	"""Only allow users with user_type 'find'"""
	message = 'Only service seekers can access this endpoint.'

	def has_permission(self, request, view):
		return bool(request.user and request.user.is_authenticated and request.user.user_type == 'find')


class IsServiceProvider(BasePermission):
	"""Only allow users with user_type 'offer'"""
	message = 'Only service providers can access this endpoint.'

	def has_permission(self, request, view):
		return bool(request.user and request.user.is_authenticated and request.user.user_type == 'offer')


class MyBookingsView(generics.ListAPIView):
	"""List bookings for the current customer"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = BookingListSerializer
	pagination_class = StandardResultsSetPagination
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		# Lazy-expire any overdue pending bookings for this customer
		_lazy_expire_overdue_bookings(customer=self.request.user)
		return (
			Booking.objects
			.filter(customer=self.request.user)
			.select_related('service', 'service__specialization', 'service__specialization__speciality', 'provider', 'customer')
			.prefetch_related('booking_services__service', 'booking_services__service__specialization', 'booking_services__service__specialization__speciality')
			.order_by('-created_at')
		)


class ProviderBookingsView(generics.ListAPIView):
	"""List bookings for the current provider"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = BookingListSerializer
	pagination_class = StandardResultsSetPagination
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		# Lazy-expire any overdue pending bookings for this provider
		_lazy_expire_overdue_bookings(provider=self.request.user)
		return (
			Booking.objects
			.filter(provider=self.request.user)
			.select_related('service', 'service__specialization', 'service__specialization__speciality', 'provider', 'customer')
			.prefetch_related('booking_services__service', 'booking_services__service__specialization', 'booking_services__service__specialization__speciality')
			.order_by('-created_at')
		)


class BookingDetailView(generics.RetrieveAPIView):
	"""Retrieve a booking if user is customer or provider on it"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated]
	serializer_class = BookingSerializer
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		user = self.request.user
		return (
			Booking.objects
			.select_related('service', 'service__specialization', 'service__specialization__speciality', 'provider', 'customer')
			.prefetch_related('images', 'booking_services__service', 'booking_services__service__specialization', 'booking_services__service__specialization__speciality')
			.filter(Q(customer=user) | Q(provider=user))
		)

	def retrieve(self, request, *args, **kwargs):
		instance = self.get_object()
		# Lazy-expire if overdue
		if instance.expire_if_overdue():
			try:
				send_booking_expiry_notification(instance)
			except Exception:
				pass
			instance.refresh_from_db()
		serializer = self.get_serializer(instance)
		return Response(serializer.data)


class AcceptBookingView(APIView):
	"""Provider accepts a pending booking"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['pending']:
			return Response({'error': 'Only pending bookings can be accepted'}, status=status.HTTP_400_BAD_REQUEST)

		# Check if the booking has expired (deadline passed)
		if booking.is_expired:
			booking.expire_if_overdue()
			try:
				send_booking_expiry_notification(booking)
			except Exception:
				pass
			return Response(
				{'error': 'This booking has expired because you did not respond before the deadline. The customer has been notified.'},
				status=status.HTTP_400_BAD_REQUEST
			)

		# Check if the preferred service date/time has already passed
		if booking.preferred_date and booking.preferred_time:
			service_dt = datetime.combine(booking.preferred_date, booking.preferred_time, tzinfo=NPT)
			if service_dt <= timezone.now().astimezone(NPT):
				return Response(
					{'error': 'Cannot accept this booking — the requested service date/time has already passed.'},
					status=status.HTTP_400_BAD_REQUEST
				)

		booking.status = 'confirmed'
		booking.accepted_at = booking.accepted_at or timezone.now()
		booking.save()
		
		# Reload booking with booking_services to ensure they're available for email
		booking.refresh_from_db()
		
		# Send email notification to customer (asynchronously to avoid blocking)
		try:
			send_booking_acceptance_to_customer(booking)
			print(f"✅ Email sent to customer: {booking.customer.email}")
		except Exception as e:
			# Log error but don't fail the acceptance
			import logging
			logger = logging.getLogger(__name__)
			logger.error(f"❌ Failed to send booking acceptance email: {str(e)}")
			print(f"❌ Email error: {str(e)}")
		
		return Response(BookingSerializer(booking).data)


class DeclineBookingView(APIView):
	"""Provider declines a pending booking"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['pending']:
			# If it expired in the meantime, give a clear message
			if booking.status == 'expired':
				return Response({'error': 'This booking has already expired.'}, status=status.HTTP_400_BAD_REQUEST)
			return Response({'error': 'Only pending bookings can be declined'}, status=status.HTTP_400_BAD_REQUEST)
		reason = request.data.get('reason', '')
		booking.status = 'declined'
		booking.cancelled_by = request.user
		booking.cancellation_reason = reason
		booking.cancelled_at = timezone.now()
		booking.save()
		return Response(BookingSerializer(booking).data)


class CancelBookingView(APIView):
	"""Customer or provider cancels a booking if allowed"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id)
		# Only participants can cancel
		if request.user not in [booking.customer, booking.provider]:
			return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
		if not booking.is_cancellable():
			return Response({'error': 'Booking cannot be cancelled at this stage'}, status=status.HTTP_400_BAD_REQUEST)
		reason = request.data.get('reason', '')
		booking.status = 'cancelled'
		booking.cancelled_by = request.user
		booking.cancellation_reason = reason
		booking.cancelled_at = timezone.now()
		booking.save()
		return Response(BookingSerializer(booking).data)


class ScheduleBookingView(APIView):
	"""Provider schedules a confirmed booking by setting date/time"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['confirmed', 'pending']:
			return Response({'error': 'Only confirmed/pending bookings can be scheduled'}, status=status.HTTP_400_BAD_REQUEST)
		scheduled_date_str = request.data.get('scheduled_date')
		scheduled_time_str = request.data.get('scheduled_time')
		if not scheduled_date_str or not scheduled_time_str:
			return Response({'error': 'scheduled_date and scheduled_time are required'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			sched_date = datetime.strptime(scheduled_date_str, "%Y-%m-%d").date()
		except ValueError:
			return Response({'error': 'Invalid scheduled_date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

		sched_time = None
		for fmt in ["%H:%M:%S", "%H:%M"]:
			try:
				sched_time = datetime.strptime(scheduled_time_str, fmt).time()
				break
			except ValueError:
				continue
		if sched_time is None:
			return Response({'error': 'Invalid scheduled_time format. Use HH:MM or HH:MM:SS'}, status=status.HTTP_400_BAD_REQUEST)

		now_npt = timezone.now().astimezone(NPT)
		requested_dt = datetime.combine(sched_date, sched_time, tzinfo=NPT)
		if requested_dt <= now_npt:
			return Response({
				'error': f'Scheduled time is in the past. Current Nepal time: {now_npt.strftime("%Y-%m-%d %H:%M:%S")}'
			}, status=status.HTTP_400_BAD_REQUEST)

		try:
			booking.scheduled_date = sched_date
			booking.scheduled_time = sched_time
			booking.status = 'scheduled'
			booking.save()
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		return Response(BookingSerializer(booking).data)


class StartBookingView(APIView):
	"""Provider marks the booking as in progress"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['scheduled', 'confirmed']:
			return Response({'error': 'Only scheduled/confirmed bookings can be started'}, status=status.HTTP_400_BAD_REQUEST)
		booking.status = 'in_progress'
		booking.save()
		return Response(BookingSerializer(booking).data)


class CompleteBookingView(APIView):
	"""Provider marks the booking as completed"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['in_progress', 'scheduled']:
			return Response({'error': 'Only in-progress/scheduled bookings can be completed'}, status=status.HTTP_400_BAD_REQUEST)
		final_price = request.data.get('final_price', None)
		if final_price is not None:
			booking.final_price = final_price
		booking.status = 'completed'
		booking.provider_completed_at = timezone.now()
		booking.completed_at = timezone.now()
		booking.completion_note = request.data.get('completion_note', '')
		booking.save()
		# Trigger payment release
		from .services import PaymentService
		PaymentService.release_payment(booking)
		return Response(BookingSerializer(booking).data)


class DisputeBookingView(APIView):
	"""Customer disputes a completed booking — requires after-image upload and reason"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, customer=request.user)
		if booking.status != 'completed':
			return Response(
				{'error': 'Only completed bookings can be disputed'},
				status=status.HTTP_400_BAD_REQUEST
			)
		reason = request.data.get('reason', '').strip()
		if not reason:
			return Response(
				{'error': 'A dispute reason is required'},
				status=status.HTTP_400_BAD_REQUEST
			)
		booking.status = 'disputed'
		booking.dispute_reason = reason
		booking.dispute_note = request.data.get('note', '')
		booking.save()
		# Hold payment via service (if payment exists)
		from .services import PaymentService
		PaymentService.hold_payment(booking, reason=booking.dispute_reason)
		return Response(BookingSerializer(booking).data)


class ProviderMyServicesView(generics.ListAPIView):
	"""List services created by the current provider"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = ServiceSerializer
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		qs = Service.objects.filter(provider=self.request.user).order_by('-created_at')
		active = self.request.query_params.get('active')
		if active in ['true', 'false']:
			qs = qs.filter(is_active=(active == 'true'))
		return qs


class CreateServiceView(generics.CreateAPIView):
	"""Create a new service as provider"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = ServiceSerializer
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def perform_create(self, serializer):
		serializer.save(provider=self.request.user)


class UpdateServiceView(generics.UpdateAPIView):
	"""Update an existing service for the current provider"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = ServiceSerializer
	lookup_url_kwarg = 'service_id'
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		return Service.objects.filter(provider=self.request.user)


class ToggleServiceActiveView(APIView):
	"""Activate/Deactivate a service owned by the provider"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, service_id):
		service = get_object_or_404(Service, id=service_id, provider=request.user)
		desired = request.data.get('is_active')
		if desired is None:
			# toggle if not explicitly provided
			service.is_active = not service.is_active
		else:
			service.is_active = bool(desired) in [True, 'true', 'True', '1', 1]
		service.save()
		return Response(ServiceSerializer(service).data)


class ServicePublicListView(generics.ListAPIView):
	"""Public list of active services with filters and search"""
	permission_classes = [AllowAny]
	serializer_class = ServiceSerializer
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		qs = Service.objects.select_related('provider', 'specialization').filter(is_active=True)
		# Filters
		specialization_id = self.request.query_params.get('specialization')
		provider_id = self.request.query_params.get('provider')
		city = self.request.query_params.get('city')
		district = self.request.query_params.get('district')
		price_type = self.request.query_params.get('price_type')
		emergency = self.request.query_params.get('emergency')
		min_price = self.request.query_params.get('min_price')
		max_price = self.request.query_params.get('max_price')
		q = self.request.query_params.get('q')

		if specialization_id:
			qs = qs.filter(specialization_id=specialization_id)
		if provider_id:
			qs = qs.filter(provider_id=provider_id)
		if city:
			qs = qs.filter(provider__city__iexact=city)
		if district:
			qs = qs.filter(provider__district__iexact=district)
		if price_type in ['fixed', 'hourly', 'negotiable']:
			qs = qs.filter(price_type=price_type)
		if emergency in ['true', 'false']:
			qs = qs.filter(emergency_service=(emergency == 'true'))
		if min_price:
			try:
				qs = qs.filter(base_price__gte=min_price)
			except Exception:
				pass
		if max_price:
			try:
				qs = qs.filter(base_price__lte=max_price)
			except Exception:
				pass
		if q:
			# Smart search with comprehensive matching
			search_terms = q.lower().strip().split()
			
			# Define service keywords mapping
			service_keywords = {
				'electric': ['electric', 'electrician', 'electrical', 'wiring', 'electricity'],
				'plumb': ['plumb', 'plumber', 'plumbing', 'pipe', 'drain', 'water'],
				'carpen': ['carpenter', 'carpentry', 'wood', 'furniture', 'cabinet'],
				'paint': ['paint', 'painter', 'painting', 'color', 'wall'],
				'clean': ['clean', 'cleaner', 'cleaning', 'housekeeping', 'maid'],
				'repair': ['repair', 'fix', 'maintenance', 'service'],
				'ac': ['ac', 'air', 'conditioning', 'hvac', 'cooling'],
				'garden': ['garden', 'gardener', 'gardening', 'lawn', 'landscaping'],
				'appliance': ['appliance', 'fridge', 'refrigerator', 'washing', 'machine'],
			}
			
			# Collect all search variants
			all_variants = set()
			for term in search_terms:
				all_variants.add(term)
				
				# Add suffix variants
				if term.endswith('ian'):
					all_variants.add(term[:-3])  # electrician -> electric
					all_variants.add(term[:-3] + 'al')  # electrician -> electrical
				elif term.endswith('er'):
					all_variants.add(term[:-2])  # plumber -> plumb
					all_variants.add(term[:-2] + 'ing')  # plumber -> plumbing
				elif term.endswith('ing'):
					all_variants.add(term[:-3])  # plumbing -> plumb
					all_variants.add(term[:-3] + 'er')  # plumbing -> plumber
				elif term.endswith('al'):
					all_variants.add(term[:-2])  # electrical -> electric
					all_variants.add(term[:-2] + 'ian')  # electrical -> electrician
				
				# Check for keyword matches
				for key, related_terms in service_keywords.items():
					if key in term or term in key:
						all_variants.update(related_terms)
						break
			
			# Build comprehensive Q objects
			q_objects = Q()
			for variant in all_variants:
				q_objects |= (
					Q(title__icontains=variant) |
					Q(description__icontains=variant) |
					Q(specialization__name__icontains=variant) |
					Q(provider__first_name__icontains=variant) |
					Q(provider__last_name__icontains=variant) |
					Q(provider__bio__icontains=variant) |
					Q(provider__city__icontains=variant) |
					Q(provider__district__icontains=variant)
				)
			
			qs = qs.filter(q_objects).distinct()
		return qs.order_by('-created_at')


class ServicePublicDetailView(generics.RetrieveAPIView):
	permission_classes = [AllowAny]
	serializer_class = ServiceSerializer
	queryset = Service.objects.select_related('provider', 'specialization').filter(is_active=True)
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)


class CreateBookingView(generics.CreateAPIView):
	"""Create a new booking as a customer"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = BookingSerializer
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def perform_create(self, serializer):
		# BookingSerializer creates BookingService snapshots and sets provider
		primary_service = serializer.validated_data.get('service')
		preferred_date = serializer.validated_data.get('preferred_date')
		preferred_time = serializer.validated_data.get('preferred_time')
		if preferred_date and preferred_time:
			try:
				requested_dt = datetime.combine(preferred_date, preferred_time, tzinfo=NPT)
			except Exception:
				raise ValidationError({'preferred_time': 'Invalid preferred date/time'})
			now_npt = timezone.now().astimezone(NPT)
			if requested_dt <= now_npt:
				raise ValidationError({'preferred_time': f'Selected time is in the past. Current Nepal time: {now_npt.strftime("%Y-%m-%d %H:%M:%S")}'})

			# Maximum advance booking check: at most 5 days ahead
			max_advance = timedelta(days=Booking.MAX_ADVANCE_BOOKING_DAYS)
			time_until_service = requested_dt - now_npt
			if time_until_service > max_advance:
				raise ValidationError({
					'preferred_date': f'Bookings can only be made up to {Booking.MAX_ADVANCE_BOOKING_DAYS} days in advance. '
					f'Please select a date within the next {Booking.MAX_ADVANCE_BOOKING_DAYS} days.'
				})

			# Minimum advance booking check
			# Emergency services: at least 30 min | Normal services: at least 1 hour
			is_emergency = primary_service.emergency_service if primary_service else False
			min_advance = timedelta(minutes=30) if is_emergency else timedelta(hours=1)
			min_label = "30 minutes" if is_emergency else "1 hour"
			if time_until_service < min_advance:
				raise ValidationError({
					'preferred_time': f'You must book at least {min_label} before the service time. '
					f'Please select a later time slot.'
				})

		booking = serializer.save(customer=self.request.user, provider=primary_service.provider)

		# Calculate and set the confirmation deadline
		booking.calculate_confirmation_deadline()
		booking.save(update_fields=['confirmation_deadline'])
		
		# Reload booking with booking_services to ensure they're available for email
		booking.refresh_from_db()
		
		# Send email notification to provider (asynchronously to avoid blocking)
		try:
			send_booking_notification_to_provider(booking)
			print(f"✅ Email sent to provider: {booking.provider.email}")
		except Exception as e:
			# Log error but don't fail the booking creation
			import logging
			logger = logging.getLogger(__name__)
			logger.error(f"❌ Failed to send booking notification email: {str(e)}")
			print(f"❌ Email error: {str(e)}")



class UploadBookingImagesView(APIView):
	"""Upload booking images (before/during/after)"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated]
	parser_classes = [MultiPartParser, FormParser]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id)
		# Only customer or provider on the booking can upload
		if request.user not in [booking.customer, booking.provider]:
			return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

		image_type = request.data.get('image_type')
		description = request.data.get('description', '')
		files = request.FILES.getlist('images')
		if not files:
			return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

		created = []
		for f in files:
			img = BookingImage(booking=booking, image=f, image_type=image_type, uploaded_by=request.user, description=description)
			try:
				img.save()
				created.append(img)
			except Exception as e:
				return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

		return Response(BookingImageSerializer(created, many=True, context={'request': request}).data)


class MyPaymentsView(generics.ListAPIView):
	"""List payments made by the current customer"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = PaymentSerializer
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		return (
			Payment.objects.filter(customer=self.request.user)
			.select_related('booking', 'provider', 'customer')
			.order_by('-created_at')
		)


class ProviderEarningsView(APIView):
	"""Summary of provider earnings"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get(self, request):
		payments = Payment.objects.filter(provider=request.user, status='completed')
		total_earnings = sum(p.provider_amount for p in payments)
		total_jobs = payments.count()
		return Response({
			'total_earnings_nrs': float(total_earnings),
			'total_paid_jobs': total_jobs,
		})


class UserDashboardStatsView(APIView):
	"""Lightweight, cached stats for user dashboard."""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get(self, request):
		cache_key = f"user_dashboard_stats:{request.user.id}"
		cached = cache.get(cache_key)
		if cached:
			return Response(cached)

		qs = Booking.objects.filter(customer=request.user)
		active_statuses = ['pending', 'confirmed', 'scheduled', 'in_progress', 'provider_completed']
		agg = qs.aggregate(
			total_bookings=Count('id'),
			active_jobs=Count('id', filter=Q(status__in=active_statuses)),
			completed_jobs=Count('id', filter=Q(status='completed')),
			total_spent=Sum(
				Coalesce(
					F('final_price'),
					F('quoted_price'),
					Value(0),
					output_field=DecimalField(max_digits=12, decimal_places=2)
				),
				output_field=DecimalField(max_digits=12, decimal_places=2)
			),
		)
		data = {
			"total_bookings": agg.get('total_bookings') or 0,
			"active_jobs": agg.get('active_jobs') or 0,
			"completed_jobs": agg.get('completed_jobs') or 0,
			"total_spent": float(agg.get('total_spent') or 0),
		}
		cache.set(cache_key, data, timeout=60)
		return Response(data)


class ProviderDashboardStatsView(APIView):
	"""Lightweight, cached stats for provider dashboard."""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get(self, request):
		cache_key = f"provider_dashboard_stats:{request.user.id}"
		cached = cache.get(cache_key)
		if cached:
			return Response(cached)

		booking_qs = Booking.objects.filter(provider=request.user)
		active_statuses = ['pending', 'confirmed', 'scheduled', 'in_progress']
		review_qs = Review.objects.filter(provider=request.user)
		payment_qs = Payment.objects.filter(provider=request.user, status='completed')

		agg_bookings = booking_qs.aggregate(
			total_jobs=Count('id', filter=Q(status='completed')),
			active_jobs=Count('id', filter=Q(status__in=active_statuses)),
		)
		agg_payments = payment_qs.aggregate(total_earnings=Sum('provider_amount'))
		agg_reviews = review_qs.aggregate(avg_rating=Avg('rating'), review_count=Count('id'))

		data = {
			"total_jobs": agg_bookings.get('total_jobs') or 0,
			"active_jobs": agg_bookings.get('active_jobs') or 0,
			"total_earnings": float(agg_payments.get('total_earnings') or 0),
			"average_rating": round(agg_reviews.get('avg_rating') or 0, 1),
			"review_count": agg_reviews.get('review_count') or 0,
		}
		cache.set(cache_key, data, timeout=60)
		return Response(data)


class CreateReviewView(generics.CreateAPIView):
	"""Create a review for a completed booking (customer only)"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = ReviewSerializer
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def perform_create(self, serializer):
		# Use booking_id from URL to ensure the correct booking is reviewed
		booking_id = self.kwargs.get('booking_id')
		booking = get_object_or_404(Booking, id=booking_id)

		# Only the customer on the booking can review
		if booking.customer != self.request.user:
			raise ValidationError('Only the booking customer can review this booking')

		# Only completed bookings can be reviewed
		if booking.status != 'completed':
			raise ValidationError('Only completed bookings can be reviewed')

		# One review per booking per customer
		if Review.objects.filter(booking=booking, customer=self.request.user).exists():
			raise ValidationError('You have already reviewed this booking')

		serializer.save(customer=self.request.user, provider=booking.provider, booking=booking)

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id)
		serializer = ReviewSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save(
			customer=request.user,
			provider=booking.provider,
			booking=booking,
		)
		return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyProviderReviewsView(generics.ListAPIView):
	"""List reviews received by current provider"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = ReviewSerializer
	pagination_class = StandardResultsSetPagination
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		qs = Review.objects.filter(provider=self.request.user).select_related('booking', 'customer', 'provider').order_by('-created_at')
		rating = self.request.query_params.get('rating')
		recommended = self.request.query_params.get('recommended')
		responded = self.request.query_params.get('responded')
		date_from = self.request.query_params.get('date_from')
		date_to = self.request.query_params.get('date_to')

		if rating:
			try:
				r = int(rating)
				if 1 <= r <= 5:
					qs = qs.filter(rating=r)
			except ValueError:
				pass

		if recommended in ['true', 'false']:
			qs = qs.filter(would_recommend=(recommended == 'true'))

		if responded in ['true', 'false']:
			if responded == 'true':
				qs = qs.exclude(provider_response__isnull=True).exclude(provider_response__exact='')
			else:
				qs = qs.filter(Q(provider_response__isnull=True) | Q(provider_response__exact=''))

		if date_from:
			qs = qs.filter(created_at__date__gte=date_from)
		if date_to:
			qs = qs.filter(created_at__date__lte=date_to)

		return qs


class MyCustomerReviewsView(generics.ListAPIView):
	"""List reviews submitted by current customer"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = ReviewSerializer
	pagination_class = StandardResultsSetPagination
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get_queryset(self):
		return (
			Review.objects
			.filter(customer=self.request.user)
			.select_related('booking', 'customer', 'provider')
			.order_by('-created_at')
		)


class RespondReviewView(APIView):
	"""Provider responds to a review they received"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request, review_id):
		review = get_object_or_404(Review, id=review_id, provider=request.user)

		response_text = (request.data.get('provider_response') or '').strip()
		if not response_text:
			return Response({'error': 'Response text is required'}, status=status.HTTP_400_BAD_REQUEST)

		review.provider_response = response_text
		review.responded_at = timezone.now()
		review.save()

		return Response(ReviewSerializer(review).data)


class DeleteServiceView(APIView):
	"""Delete a service (only if no active bookings exist)"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def delete(self, request, service_id):
		service = get_object_or_404(Service, id=service_id, provider=request.user)
		
		# Check for active bookings (pending, confirmed, scheduled, in_progress)
		active_bookings = service.bookings.filter(
			status__in=['pending', 'confirmed', 'scheduled', 'in_progress']
		).count()
		
		if active_bookings > 0:
			return Response({
				'error': f'Cannot delete service with {active_bookings} active booking(s). '
				         'Please complete or cancel all bookings first, or deactivate the service instead.'
			}, status=status.HTTP_400_BAD_REQUEST)
		
		# Safe to delete
		service_title = service.title
		service.delete()
		
		return Response({
			'message': f'Service "{service_title}" has been permanently deleted.',
			'deleted': True
		}, status=status.HTTP_200_OK)


class ProviderAvailabilityView(APIView):
	"""
	GET /bookings/availability/
	Returns current provider's availability schedule.
	Returns default availability if not yet set.
	
	PUT /bookings/availability/
	Updates current provider's availability schedule.
	Validates that current user is a service provider.
	"""
	permission_classes = [IsAuthenticated, IsServiceProvider]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)
	
	def get(self, request):
		"""Fetch current provider's availability."""
		try:
			availability = ProviderAvailability.objects.get(provider=request.user)
			serializer = ProviderAvailabilitySerializer(availability)
			return Response(serializer.data, status=status.HTTP_200_OK)
		except ProviderAvailability.DoesNotExist:
			# Return default availability structure
			default_availability = {
				'weekly_schedule': [
					{
						'day': day,
						'enabled': True,
						'start_time': '8:00 AM',
						'end_time': '5:00 PM',
						'break_start': '12:00 PM',
						'break_end': '1:00 PM'
					}
					for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
				] + [
					{
						'day': day,
						'enabled': False,
						'start_time': '10:00 AM',
						'end_time': '2:00 PM',
						'break_start': '12:00 PM',
						'break_end': '12:30 PM'
					}
					for day in ['Saturday', 'Sunday']
				],
				'settings': {
					'timezone': 'UTC',
					'min_advance_booking': 24,  # hours
					'max_advance_days': Booking.MAX_ADVANCE_BOOKING_DAYS
				}
			}
			return Response(default_availability, status=status.HTTP_200_OK)
	
	def put(self, request):
		"""Update or create availability for current provider."""
		try:
			availability = ProviderAvailability.objects.get(provider=request.user)
		except ProviderAvailability.DoesNotExist:
			availability = ProviderAvailability(provider=request.user)
		
		serializer = ProviderAvailabilitySerializer(availability, data=request.data, partial=True)
		if serializer.is_valid():
			# Ensure provider is set to current user before saving
			serializer.save(provider=request.user)
			return Response(serializer.data, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderListView(generics.ListAPIView):
	"""List all service providers with ratings and statistics"""
	permission_classes = [AllowAny]
	serializer_class = ProviderListSerializer
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)
	
	def get_queryset(self):
		"""Get active providers (user_type='offer')"""
		qs = User.objects.filter(
			user_type='offer',
			is_active=True
		).prefetch_related('user_specializations', 'user_specialities', 'services')
		
		# Filters
		specialization = self.request.query_params.get('specialization')
		speciality = self.request.query_params.get('speciality')
		city = self.request.query_params.get('city')
		district = self.request.query_params.get('district')
		min_rating = self.request.query_params.get('min_rating')
		search = self.request.query_params.get('q')
		
		# Allow filtering by either specialization or speciality name (e.g., "Carpentry" vs "Carpenter")
		specialization_value = specialization or speciality
		if specialization_value:
			qs = qs.filter(
				Q(user_specializations__specialization__name__icontains=specialization_value) |
				Q(user_specializations__specialization__speciality__name__icontains=specialization_value) |
				Q(user_specialities__speciality__name__icontains=specialization_value)
			)
		
		if city:
			qs = qs.filter(
				Q(city__iexact=city) |  # Exact match (case-insensitive)
				Q(city__icontains=city)  # Partial match
			)
		
		if district:
			qs = qs.filter(
				Q(district__iexact=district) |  # Exact match (case-insensitive)
				Q(district__icontains=district)  # Partial match
			)
		
		if search:
			# Smart search with comprehensive matching
			search_terms = search.lower().strip().split()
			
			# Define service keywords mapping for intelligent matching
			service_keywords = {
				'electric': ['electric', 'electrician', 'electrical', 'wiring', 'electricity'],
				'plumb': ['plumb', 'plumber', 'plumbing', 'pipe', 'drain', 'water'],
				'carpen': ['carpenter', 'carpentry', 'wood', 'furniture', 'cabinet'],
				'paint': ['paint', 'painter', 'painting', 'color', 'wall'],
				'clean': ['clean', 'cleaner', 'cleaning', 'housekeeping', 'maid'],
				'repair': ['repair', 'fix', 'maintenance', 'service'],
				'ac': ['ac', 'air', 'conditioning', 'hvac', 'cooling'],
				'garden': ['garden', 'gardener', 'gardening', 'lawn', 'landscaping'],
				'appliance': ['appliance', 'fridge', 'refrigerator', 'washing', 'machine'],
			}
			
			# Collect all search variants
			all_variants = set()
			for term in search_terms:
				all_variants.add(term)
				
				# Add suffix variants
				if term.endswith('ian'):
					all_variants.add(term[:-3])  # electrician -> electric
					all_variants.add(term[:-3] + 'al')  # electrician -> electrical
				elif term.endswith('er'):
					all_variants.add(term[:-2])  # plumber -> plumb
					all_variants.add(term[:-2] + 'ing')  # plumber -> plumbing
				elif term.endswith('ing'):
					all_variants.add(term[:-3])  # plumbing -> plumb
					all_variants.add(term[:-3] + 'er')  # plumbing -> plumber
				elif term.endswith('al'):
					all_variants.add(term[:-2])  # electrical -> electric
					all_variants.add(term[:-2] + 'ian')  # electrical -> electrician
				
				# Check for keyword matches and add related terms
				for key, related_terms in service_keywords.items():
					if key in term or term in key:
						all_variants.update(related_terms)
						break
			
			# Build comprehensive Q objects
			q_objects = Q()
			for variant in all_variants:
				q_objects |= (
					Q(first_name__icontains=variant) |
					Q(last_name__icontains=variant) |
					Q(bio__icontains=variant) |
					Q(city__icontains=variant) |
					Q(district__icontains=variant) |
					Q(user_specializations__specialization__name__icontains=variant) |
					Q(user_specializations__specialization__speciality__name__icontains=variant) |
					Q(user_specialities__speciality__name__icontains=variant) |
					Q(services__title__icontains=variant) |
					Q(services__description__icontains=variant) |
					Q(services__specialization__name__icontains=variant)
				)
			
			qs = qs.filter(q_objects)
		
		# Sort by rating (highest first)
		qs = qs.distinct()
		return qs

class ProviderDetailView(generics.RetrieveAPIView):
	"""Get detailed information about a specific provider"""
	permission_classes = [AllowAny]
	serializer_class = ProviderDetailSerializer
	queryset = User.objects.filter(
		user_type='offer',
		is_active=True
	).prefetch_related('user_specializations', 'services')
	lookup_field = 'id'
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)


class ProviderAvailabilityPublicView(APIView):
	"""
	GET /bookings/providers/<provider_id>/availability/
	Returns a specific provider's availability schedule (public endpoint for booking page).
	"""
	permission_classes = [AllowAny]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)
	
	def get(self, request, provider_id):
		"""Fetch provider's availability schedule."""
		provider = get_object_or_404(User, id=provider_id, user_type='offer', is_active=True)
		
		try:
			availability = ProviderAvailability.objects.get(provider=provider)
			serializer = ProviderAvailabilitySerializer(availability)
			return Response(serializer.data, status=status.HTTP_200_OK)
		except ProviderAvailability.DoesNotExist:
			# Return default availability structure
			default_availability = {
				'weekly_schedule': [
					{
						'day': day,
						'enabled': True,
						'start_time': '8:00 AM',
						'end_time': '5:00 PM',
						'break_start': '12:00 PM',
						'break_end': '1:00 PM'
					}
					for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
				] + [
					{
						'day': day,
						'enabled': False,
						'start_time': '10:00 AM',
						'end_time': '2:00 PM',
						'break_start': '12:00 PM',
						'break_end': '12:30 PM'
					}
					for day in ['Saturday', 'Sunday']
				],
				'settings': {
					'timezone': 'UTC',
					'min_advance_booking': 24,
					'max_advance_days': Booking.MAX_ADVANCE_BOOKING_DAYS
				}
			}
			return Response(default_availability, status=status.HTTP_200_OK)


class ProviderBookedSlotsView(APIView):
	"""
	GET /bookings/providers/<provider_id>/booked-slots/?date=YYYY-MM-DD
	Returns booked time slots for a specific provider on a given date.
	"""
	permission_classes = [AllowAny]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)
	
	def get(self, request, provider_id):
		"""Fetch booked slots for a provider on a specific date."""
		from datetime import datetime, timedelta
		from decimal import Decimal

		provider = get_object_or_404(User, id=provider_id, user_type='offer', is_active=True)
		date_str = request.query_params.get('date')
		
		if not date_str:
			return Response(
				{'error': 'Date parameter is required (format: YYYY-MM-DD)'},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		try:
			date = datetime.strptime(date_str, '%Y-%m-%d').date()
		except ValueError:
			return Response(
				{'error': 'Invalid date format. Use YYYY-MM-DD'},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		# Get provider buffer time from availability settings
		buffer_minutes = 15  # default
		try:
			availability = ProviderAvailability.objects.get(provider=provider)
			buffer_raw = availability.settings.get('bufferTime', 15)
			# Handle values like "15 minutes" or plain integers
			if isinstance(buffer_raw, str):
				buffer_minutes = int(buffer_raw.split()[0])
			else:
				buffer_minutes = int(buffer_raw)
		except (ProviderAvailability.DoesNotExist, ValueError, IndexError):
			pass

		# Get all bookings for this provider on this date (excluding cancelled/declined)
		# Only block slots for bookings the provider has accepted (not pending)
		bookings = Booking.objects.filter(
			provider=provider,
			preferred_date=date,
			status__in=['confirmed', 'scheduled', 'in_progress']
		).prefetch_related('booking_services', 'booking_services__service')
		
		# Format booked slots with duration-based time ranges
		booked_slots = []
		for booking in bookings:
			start_time = booking.preferred_time
			
			# Calculate total duration from all services in this booking
			total_duration_hours = Decimal('0')
			for bs in booking.booking_services.all():
				duration = bs.estimated_duration_at_booking
				if duration is None:
					# Fallback to service's estimated_duration
					duration = bs.service.estimated_duration if bs.service.estimated_duration else Decimal('1')
				total_duration_hours += duration
			
			# Default to 1 hour if no duration info at all
			if total_duration_hours <= 0:
				total_duration_hours = Decimal('1')
			
			total_duration_minutes = int(total_duration_hours * 60)
			
			# Calculate end time and end time with buffer
			start_dt = datetime.combine(date, start_time)
			end_dt = start_dt + timedelta(minutes=total_duration_minutes)
			end_with_buffer_dt = start_dt + timedelta(minutes=total_duration_minutes + buffer_minutes)
			
			booked_slots.append({
				'time': start_time.strftime('%H:%M:%S'),
				'end_time': end_dt.time().strftime('%H:%M:%S'),
				'end_time_with_buffer': end_with_buffer_dt.time().strftime('%H:%M:%S'),
				'duration_minutes': total_duration_minutes,
				'status': booking.status
			})
		
		return Response({
			'date': date_str,
			'booked_slots': booked_slots
		}, status=status.HTTP_200_OK)

class CheckBookingConflictView(APIView):
	"""
	Check for booking conflicts before creating a new booking.
	
	POST /bookings/check-conflict/
	Required params:
	- provider_id: int
	- preferred_date: string (YYYY-MM-DD)
	Optional params:
	- preferred_time: string (HH:MM:SS)
	- service_id: int
	
	Returns:
	{
		'valid': bool,
		'conflicts': [],
		'warnings': [],
		'suggestions': {
			'alternative_times': [],
			'alternative_dates': [],
		}
	}
	"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def post(self, request):
		provider_id = request.data.get('provider_id')
		preferred_date = request.data.get('preferred_date')
		preferred_time = request.data.get('preferred_time')
		service_id = request.data.get('service_id')

		if not provider_id or not preferred_date:
			return Response(
				{'error': 'provider_id and preferred_date are required'},
				status=status.HTTP_400_BAD_REQUEST
			)

		try:
			provider = get_object_or_404(User, id=provider_id, user_type='offer')
		except User.DoesNotExist:
			return Response(
				{'error': 'Provider not found'},
				status=status.HTTP_404_NOT_FOUND
			)

		# Import the conflict service
		from .services import BookingConflictService

		try:
			service = Service.objects.get(id=service_id, provider=provider) if service_id else None
		except Service.DoesNotExist:
			return Response(
				{'error': 'Service not found'},
				status=status.HTTP_404_NOT_FOUND
			)

		# Validate the booking request
		validation_result = BookingConflictService.validate_booking_request(
			customer=request.user,
			provider=provider,
			service=service,
			preferred_date=preferred_date,
			preferred_time=preferred_time
		)

		return Response(validation_result, status=status.HTTP_200_OK)


class GetAvailableTimeSlotsView(APIView):
	"""
	Get available time slots for a provider on a specific date.
	
	GET /bookings/available-slots/
	Required params:
	- provider_id: int
	- date: string (YYYY-MM-DD)
	
	Returns:
	{
		'available_slots': [
			{'time': 'HH:MM:SS', 'label': '09:00 AM', 'available': true/false}
		],
		'booked_times': [
			{'time': 'HH:MM:SS', 'booking_id': int, 'customer': str}
		],
		'message': str
	}
	"""
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get(self, request):
		provider_id = request.query_params.get('provider_id')
		date_str = request.query_params.get('date')

		if not provider_id or not date_str:
			return Response(
				{'error': 'provider_id and date are required'},
				status=status.HTTP_400_BAD_REQUEST
			)

		try:
			provider = get_object_or_404(User, id=provider_id, user_type='offer')
		except User.DoesNotExist:
			return Response(
				{'error': 'Provider not found'},
				status=status.HTTP_404_NOT_FOUND
			)

		from .services import BookingConflictService

		try:
			result = BookingConflictService.get_available_time_slots(
				provider=provider,
				date=date_str
			)
			return Response(result, status=status.HTTP_200_OK)
		except Exception as e:
			return Response(
				{'error': str(e)},
				status=status.HTTP_400_BAD_REQUEST
			)


class GetAlternativeDatesView(APIView):
	"""
	Get alternative dates with available slots near a preferred date.
	
	GET /bookings/alternative-dates/
	Required params:
	- provider_id: int
	- preferred_date: string (YYYY-MM-DD)
	
	Optional params:
	- days_ahead: int (default 7)
	
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
	authentication_classes = [SupabaseAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	
	@method_decorator(csrf_exempt)
	def dispatch(self, *args, **kwargs):
		return super().dispatch(*args, **kwargs)

	def get(self, request):
		provider_id = request.query_params.get('provider_id')
		preferred_date = request.query_params.get('preferred_date')
		days_ahead = request.query_params.get('days_ahead', 7)

		if not provider_id or not preferred_date:
			return Response(
				{'error': 'provider_id and preferred_date are required'},
				status=status.HTTP_400_BAD_REQUEST
			)

		try:
			provider = get_object_or_404(User, id=provider_id, user_type='offer')
		except User.DoesNotExist:
			return Response(
				{'error': 'Provider not found'},
				status=status.HTTP_404_NOT_FOUND
			)

		from .services import BookingConflictService

		try:
			days_ahead = int(days_ahead)
		except (ValueError, TypeError):
			days_ahead = 7

		try:
			result = BookingConflictService.get_alternative_dates(
				provider=provider,
				preferred_date=preferred_date,
				days_ahead=days_ahead
			)
			return Response(result, status=status.HTTP_200_OK)
		except Exception as e:
			return Response(
				{'error': str(e)},
				status=status.HTTP_400_BAD_REQUEST
			)


class RecentTestimonialsView(APIView):
	"""Public endpoint - returns the 4 most recent reviews for the homepage"""
	authentication_classes = []
	permission_classes = [AllowAny]

	def get(self, request):
		reviews = (
			Review.objects
			.select_related('customer', 'booking__service', 'booking__service__specialization')
			.filter(rating__gte=3)
			.order_by('-created_at')[:4]
		)

		data = []
		for r in reviews:
			try:
				service_name = (
					r.booking.service.title
					if r.booking and r.booking.service and r.booking.service.title
					else (r.booking.service.specialization.name if r.booking and r.booking.service and r.booking.service.specialization else 'Customer')
				)
			except Exception:
				service_name = 'Customer'

			data.append({
				'id': r.id,
				'name': f"{r.customer.first_name} {r.customer.last_name}".strip() or 'Anonymous',
				'role': service_name,
				'image': r.customer.profile_picture or '',
				'text': r.comment or r.title or 'Great service!',
				'rating': r.rating,
			})

		return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)