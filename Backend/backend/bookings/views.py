from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Avg, Count

from users.authentication import ClerkAuthentication
from .models import Service, Booking, BookingImage, Payment, Review, ProviderAvailability
from .serializers import (
	ServiceSerializer,
	BookingSerializer,
	BookingImageSerializer,
	PaymentSerializer,
	ReviewSerializer,
	ProviderAvailabilitySerializer,
	ProviderListSerializer,
	ProviderDetailSerializer
)

User = get_user_model()


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
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = BookingSerializer

	def get_queryset(self):
		return (
			Booking.objects
			.filter(customer=self.request.user)
			.select_related('service', 'provider', 'customer')
			.prefetch_related('images')
			.order_by('-created_at')
		)


class ProviderBookingsView(generics.ListAPIView):
	"""List bookings for the current provider"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = BookingSerializer

	def get_queryset(self):
		return (
			Booking.objects
			.filter(provider=self.request.user)
			.select_related('service', 'provider', 'customer')
			.prefetch_related('images')
			.order_by('-created_at')
		)


class BookingDetailView(generics.RetrieveAPIView):
	"""Retrieve a booking if user is customer or provider on it"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated]
	serializer_class = BookingSerializer
	queryset = (
		Booking.objects.select_related('service', 'provider', 'customer').prefetch_related('images')
	)

	def get_queryset(self):
		user = self.request.user
		return self.queryset.filter(Q(customer=user) | Q(provider=user))


class AcceptBookingView(APIView):
	"""Provider accepts a pending booking"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['pending']:
			return Response({'error': 'Only pending bookings can be accepted'}, status=status.HTTP_400_BAD_REQUEST)
		booking.status = 'confirmed'
		booking.accepted_at = booking.accepted_at or timezone.now()
		booking.save()
		return Response(BookingSerializer(booking).data)


class DeclineBookingView(APIView):
	"""Provider declines a pending booking"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['pending']:
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
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated]

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
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['confirmed', 'pending']:
			return Response({'error': 'Only confirmed/pending bookings can be scheduled'}, status=status.HTTP_400_BAD_REQUEST)
		scheduled_date = request.data.get('scheduled_date')
		scheduled_time = request.data.get('scheduled_time')
		if not scheduled_date or not scheduled_time:
			return Response({'error': 'scheduled_date and scheduled_time are required'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			booking.scheduled_date = scheduled_date
			booking.scheduled_time = scheduled_time
			booking.status = 'scheduled'
			booking.save()
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
		return Response(BookingSerializer(booking).data)


class StartBookingView(APIView):
	"""Provider marks the booking as in progress"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['scheduled', 'confirmed']:
			return Response({'error': 'Only scheduled/confirmed bookings can be started'}, status=status.HTTP_400_BAD_REQUEST)
		booking.status = 'in_progress'
		booking.save()
		return Response(BookingSerializer(booking).data)


class CompleteBookingView(APIView):
	"""Provider marks the booking as completed"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id, provider=request.user)
		if booking.status not in ['in_progress', 'scheduled']:
			return Response({'error': 'Only in-progress/scheduled bookings can be completed'}, status=status.HTTP_400_BAD_REQUEST)
		final_price = request.data.get('final_price', None)
		if final_price is not None:
			booking.final_price = final_price
		booking.status = 'completed'
		booking.completed_at = timezone.now()
		booking.save()
		return Response(BookingSerializer(booking).data)


class ProviderMyServicesView(generics.ListAPIView):
	"""List services created by the current provider"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = ServiceSerializer

	def get_queryset(self):
		qs = Service.objects.filter(provider=self.request.user).order_by('-created_at')
		active = self.request.query_params.get('active')
		if active in ['true', 'false']:
			qs = qs.filter(is_active=(active == 'true'))
		return qs


class CreateServiceView(generics.CreateAPIView):
	"""Create a new service as provider"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = ServiceSerializer

	def perform_create(self, serializer):
		serializer.save(provider=self.request.user)


class UpdateServiceView(generics.UpdateAPIView):
	"""Update an existing service for the current provider"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = ServiceSerializer
	lookup_url_kwarg = 'service_id'

	def get_queryset(self):
		return Service.objects.filter(provider=self.request.user)


class ToggleServiceActiveView(APIView):
	"""Activate/Deactivate a service owned by the provider"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

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
			qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
		return qs.order_by('-created_at')


class ServicePublicDetailView(generics.RetrieveAPIView):
	permission_classes = [AllowAny]
	serializer_class = ServiceSerializer
	queryset = Service.objects.select_related('provider', 'specialization').filter(is_active=True)


class CreateBookingView(generics.CreateAPIView):
	"""Create a new booking as a customer"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = BookingSerializer

	def perform_create(self, serializer):
		service = serializer.validated_data.get('service')
		if not service:
			raise ValueError('Service is required')
		serializer.save(customer=self.request.user, provider=service.provider)


class UploadBookingImagesView(APIView):
	"""Upload booking images (before/during/after)"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated]
	parser_classes = [MultiPartParser, FormParser]

	def post(self, request, booking_id):
		booking = get_object_or_404(Booking, id=booking_id)
		# Only customer or provider on the booking can upload
		if request.user not in [booking.customer, booking.provider]:
			return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

		image_type = request.data.get('image_type')
		files = request.FILES.getlist('images')
		if not files:
			return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

		created = []
		for f in files:
			img = BookingImage(booking=booking, image=f, image_type=image_type, uploaded_by=request.user)
			try:
				img.save()  # triggers validation
				created.append(img)
			except Exception as e:
				return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

		return Response(BookingImageSerializer(created, many=True, context={'request': request}).data)


class MyPaymentsView(generics.ListAPIView):
	"""List payments made by the current customer"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = PaymentSerializer

	def get_queryset(self):
		return (
			Payment.objects.filter(customer=self.request.user)
			.select_related('booking', 'provider', 'customer')
			.order_by('-created_at')
		)


class ProviderEarningsView(APIView):
	"""Summary of provider earnings"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

	def get(self, request):
		payments = Payment.objects.filter(provider=request.user, status='completed')
		total_earnings = sum(p.provider_amount for p in payments)
		total_jobs = payments.count()
		return Response({
			'total_earnings_nrs': float(total_earnings),
			'total_paid_jobs': total_jobs,
		})


class CreateReviewView(generics.CreateAPIView):
	"""Create a review for a completed booking (customer only)"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = ReviewSerializer

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


class MyProviderReviewsView(generics.ListAPIView):
	"""List reviews received by current provider"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]
	serializer_class = ReviewSerializer

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
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceSeeker]
	serializer_class = ReviewSerializer

	def get_queryset(self):
		return Review.objects.filter(customer=self.request.user).select_related('booking', 'customer', 'provider').order_by('-created_at')


class RespondReviewView(APIView):
	"""Provider responds to a review they received"""
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

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
	authentication_classes = [ClerkAuthentication]
	permission_classes = [IsAuthenticated, IsServiceProvider]

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
					'min_advance_booking': 24  # hours
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
	
	def get_queryset(self):
		"""Get active providers (user_type='offer')"""
		qs = User.objects.filter(
			user_type='offer',
			is_active=True
		).prefetch_related('user_specializations', 'services')
		
		# Filters
		specialization = self.request.query_params.get('specialization')
		city = self.request.query_params.get('city')
		district = self.request.query_params.get('district')
		min_rating = self.request.query_params.get('min_rating')
		search = self.request.query_params.get('q')
		
		if specialization:
			qs = qs.filter(user_specializations__specialization__name__icontains=specialization)
		
		if city:
			qs = qs.filter(city__iexact=city)
		
		if district:
			qs = qs.filter(district__iexact=district)
		
		if search:
			qs = qs.filter(
				Q(first_name__icontains=search) |
				Q(last_name__icontains=search) |
				Q(bio__icontains=search) |
				Q(user_specializations__specialization__name__icontains=search)
			)
		
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


class ProviderAvailabilityPublicView(APIView):
	"""
	GET /bookings/providers/<provider_id>/availability/
	Returns a specific provider's availability schedule (public endpoint for booking page).
	"""
	permission_classes = [AllowAny]
	
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
					'min_advance_booking': 24
				}
			}
			return Response(default_availability, status=status.HTTP_200_OK)


class ProviderBookedSlotsView(APIView):
	"""
	GET /bookings/providers/<provider_id>/booked-slots/?date=YYYY-MM-DD
	Returns booked time slots for a specific provider on a given date.
	"""
	permission_classes = [AllowAny]
	
	def get(self, request, provider_id):
		"""Fetch booked slots for a provider on a specific date."""
		provider = get_object_or_404(User, id=provider_id, user_type='offer', is_active=True)
		date_str = request.query_params.get('date')
		
		if not date_str:
			return Response(
				{'error': 'Date parameter is required (format: YYYY-MM-DD)'},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		try:
			from datetime import datetime
			date = datetime.strptime(date_str, '%Y-%m-%d').date()
		except ValueError:
			return Response(
				{'error': 'Invalid date format. Use YYYY-MM-DD'},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		# Get all bookings for this provider on this date (excluding cancelled/declined)
		bookings = Booking.objects.filter(
			provider=provider,
			preferred_date=date,
			status__in=['pending', 'confirmed', 'scheduled', 'in_progress']
		).values('preferred_time', 'status')
		
		# Format booked slots
		booked_slots = [
			{
				'time': booking['preferred_time'].strftime('%H:%M:%S'),
				'status': booking['status']
			}
			for booking in bookings
		]
		
		return Response({
			'date': date_str,
			'booked_slots': booked_slots
		}, status=status.HTTP_200_OK)
