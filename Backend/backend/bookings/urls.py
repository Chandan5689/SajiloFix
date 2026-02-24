from django.urls import path
from .views import (
    MyBookingsView,
    ProviderBookingsView,
    BookingDetailView,
    CreateBookingView,
    UploadBookingImagesView,
    MyPaymentsView,
    ProviderEarningsView,
    UserDashboardStatsView,
    ProviderDashboardStatsView,
    CreateReviewView,
    MyProviderReviewsView,
    MyCustomerReviewsView,
    RespondReviewView,
    AcceptBookingView,
    DeclineBookingView,
    CancelBookingView,
    ScheduleBookingView,
    StartBookingView,
    CompleteBookingView,
    DisputeBookingView,
    ProviderMyServicesView,
    CreateServiceView,
    UpdateServiceView,
    ToggleServiceActiveView,
    DeleteServiceView,
    ServicePublicListView,
    ServicePublicDetailView,
    ProviderAvailabilityView,
    ProviderAvailabilityPublicView,
    ProviderBookedSlotsView,
    ProviderListView,
    ProviderDetailView,
    CheckBookingConflictView,
    GetAvailableTimeSlotsView,
    GetAlternativeDatesView,
    RecentTestimonialsView,
)

urlpatterns = [
    # Bookings
    path('my-bookings/', MyBookingsView.as_view(), name='my-bookings'),
    path('provider-bookings/', ProviderBookingsView.as_view(), name='provider-bookings'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/create/', CreateBookingView.as_view(), name='booking-create'),
    path('bookings/<int:booking_id>/images/', UploadBookingImagesView.as_view(), name='booking-upload-images'),
    path('bookings/<int:booking_id>/accept/', AcceptBookingView.as_view(), name='booking-accept'),
    path('bookings/<int:booking_id>/decline/', DeclineBookingView.as_view(), name='booking-decline'),
    path('bookings/<int:booking_id>/cancel/', CancelBookingView.as_view(), name='booking-cancel'),
    path('bookings/<int:booking_id>/schedule/', ScheduleBookingView.as_view(), name='booking-schedule'),
    path('bookings/<int:booking_id>/start/', StartBookingView.as_view(), name='booking-start'),
    path('bookings/<int:booking_id>/complete/', CompleteBookingView.as_view(), name='booking-complete'),
    path('bookings/<int:booking_id>/dispute/', DisputeBookingView.as_view(), name='booking-dispute'),

    # Payments
    path('payments/my/', MyPaymentsView.as_view(), name='payments-my'),
    path('payments/provider/earnings/', ProviderEarningsView.as_view(), name='payments-provider-earnings'),

    # Dashboard stats
    path('dashboard/stats/user/', UserDashboardStatsView.as_view(), name='dashboard-stats-user'),
    path('dashboard/stats/provider/', ProviderDashboardStatsView.as_view(), name='dashboard-stats-provider'),

    # Reviews
    path('bookings/<int:booking_id>/review/create/', CreateReviewView.as_view(), name='review-create'),
    path('reviews/my/', MyProviderReviewsView.as_view(), name='reviews-my'),
    path('reviews/my-submitted/', MyCustomerReviewsView.as_view(), name='reviews-my-submitted'),
    path('reviews/<int:review_id>/respond/', RespondReviewView.as_view(), name='review-respond'),

    # Availability
    path('availability/', ProviderAvailabilityView.as_view(), name='provider-availability'),

    # Services
    path('services/', ServicePublicListView.as_view(), name='services-list-public'),
    path('services/<int:pk>/', ServicePublicDetailView.as_view(), name='services-detail-public'),
    path('services/my/', ProviderMyServicesView.as_view(), name='services-my'),
    path('services/create/', CreateServiceView.as_view(), name='services-create'),
    path('services/<int:service_id>/update/', UpdateServiceView.as_view(), name='services-update'),
    path('services/<int:service_id>/toggle/', ToggleServiceActiveView.as_view(), name='services-toggle'),
    path('services/<int:service_id>/delete/', DeleteServiceView.as_view(), name='services-delete'),

    # Providers
    path('providers/', ProviderListView.as_view(), name='providers-list'),
    path('providers/<int:id>/', ProviderDetailView.as_view(), name='providers-detail'),
    path('providers/<int:provider_id>/availability/', ProviderAvailabilityPublicView.as_view(), name='provider-availability-public'),
    path('providers/<int:provider_id>/booked-slots/', ProviderBookedSlotsView.as_view(), name='provider-booked-slots'),

    # Public - Recent testimonials for homepage
    path('testimonials/', RecentTestimonialsView.as_view(), name='recent-testimonials'),

    # Booking Conflict Detection
    path('check-conflict/', CheckBookingConflictView.as_view(), name='check-booking-conflict'),
    path('available-slots/', GetAvailableTimeSlotsView.as_view(), name='get-available-slots'),
    path('alternative-dates/', GetAlternativeDatesView.as_view(), name='get-alternative-dates'),
]
