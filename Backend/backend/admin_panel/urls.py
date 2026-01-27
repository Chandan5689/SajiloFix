from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminDashboardView,
    AdminUsersViewSet,
    AdminBookingsViewSet,
    RecentUsersView,
    RecentBookingsView,
)

router = DefaultRouter()
router.register(r'users', AdminUsersViewSet, basename='admin-users')
router.register(r'bookings', AdminBookingsViewSet, basename='admin-bookings')

urlpatterns = [
    path('dashboard/stats/', AdminDashboardView.as_view(), name='admin-dashboard-stats'),
    path('recent-users/', RecentUsersView.as_view(), name='recent-users'),
    path('recent-bookings/', RecentBookingsView.as_view(), name='recent-bookings'),
    path('', include(router.urls)),
]
