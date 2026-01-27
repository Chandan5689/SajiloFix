from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q, Avg, Sum
from datetime import timedelta
from django.utils import timezone

from bookings.models import Booking, Review
from .permissions import IsAdmin
from .serializers import (
    AdminUserSerializer, AdminBookingSerializer, 
    DashboardStatsSerializer, RecentBookingSerializer
)
from users.authentication import SupabaseAuthentication

User = get_user_model()


class AdminDashboardView(APIView):
    """Admin Dashboard Statistics API"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        """Get dashboard statistics"""
        try:
            # Current month stats
            now = timezone.now()
            current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
            last_month_end = current_month_start - timedelta(seconds=1)
            
            # Total users
            total_users = User.objects.count()
            last_month_users = User.objects.filter(
                date_joined__gte=last_month_start,
                date_joined__lte=last_month_end
            ).count()
            current_month_users = User.objects.filter(
                date_joined__gte=current_month_start
            ).count()
            users_growth = ((current_month_users - last_month_users) / max(last_month_users, 1)) * 100
            
            # Customers and Providers
            active_customers = User.objects.filter(user_type='find', is_active=True).count()
            active_providers = User.objects.filter(user_type='offer', is_active=True).count()
            last_month_providers = User.objects.filter(
                user_type='offer',
                date_joined__gte=last_month_start,
                date_joined__lte=last_month_end
            ).count()
            current_month_providers = User.objects.filter(
                user_type='offer',
                date_joined__gte=current_month_start
            ).count()
            providers_growth = ((current_month_providers - last_month_providers) / max(last_month_providers, 1)) * 100
            
            # Bookings
            total_bookings = Booking.objects.count()
            completed_bookings = Booking.objects.filter(status='completed').count()
            last_month_bookings = Booking.objects.filter(
                created_at__gte=last_month_start,
                created_at__lte=last_month_end
            ).count()
            current_month_bookings = Booking.objects.filter(
                created_at__gte=current_month_start
            ).count()
            bookings_growth = ((current_month_bookings - last_month_bookings) / max(last_month_bookings, 1)) * 100
            
            # Revenue (use final_price, fall back to quoted_price when missing)
            revenue_qs = Booking.objects.filter(status='completed')

            def sum_price(qs):
                val = qs.aggregate(total=Sum('final_price'))['total']
                if val is None:
                    val = qs.aggregate(total=Sum('quoted_price'))['total']
                return val or 0

            total_revenue = sum_price(revenue_qs)
            last_month_revenue = sum_price(revenue_qs.filter(
                created_at__gte=last_month_start,
                created_at__lte=last_month_end
            ))
            current_month_revenue = sum_price(revenue_qs.filter(
                created_at__gte=current_month_start
            ))
            
            revenue_growth = ((current_month_revenue - last_month_revenue) / max(last_month_revenue, 1)) * 100 if last_month_revenue > 0 else 0
            
            # Average rating
            avg_rating = Review.objects.aggregate(avg=Avg('rating'))['avg'] or 0
            
            # Pending verification
            pending_verification = User.objects.filter(is_verified=False, is_active=True).count()
            
            stats_data = {
                'total_users': total_users,
                'active_customers': active_customers,
                'active_providers': active_providers,
                'total_bookings': total_bookings,
                'completed_bookings': completed_bookings,
                'total_revenue': float(total_revenue),
                'average_rating': round(float(avg_rating), 2),
                'pending_verification': pending_verification,
                'users_growth': round(users_growth, 2),
                'bookings_growth': round(bookings_growth, 2),
                'revenue_growth': round(revenue_growth, 2),
                'providers_growth': round(providers_growth, 2),
            }
            
            serializer = DashboardStatsSerializer(stats_data)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AdminUsersViewSet(viewsets.ModelViewSet):
    """Admin Users Management API"""
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    authentication_classes = [SupabaseAuthentication]
    queryset = User.objects.all().order_by('-created_at')
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        """Filter users based on query params"""
        queryset = User.objects.all()
        
        # Filter by user type
        user_type = self.request.query_params.get('user_type', None)
        if user_type in ['find', 'offer']:
            queryset = queryset.filter(user_type=user_type)
        
        # Filter by status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by email or name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Override list to add success wrapper"""
        try:
            # Get filtered queryset
            queryset = self.filter_queryset(self.get_queryset())
            
            # Debug logging
            user_type = request.query_params.get('user_type', None)
            is_active_param = request.query_params.get('is_active', None)
            search = request.query_params.get('search', None)
            
            print(f"DEBUG: user_type={user_type}, is_active={is_active_param}, search={search}, queryset_count={queryset.count()}")
            
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"DEBUG: Exception in list: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'success': True,
            'message': f"User {'activated' if user.is_active else 'deactivated'} successfully",
            'data': AdminUserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a user"""
        user = self.get_object()
        user.is_verified = True
        user.phone_verified = True
        user.registration_completed = True
        user.save()
        return Response({
            'success': True,
            'message': "User verified successfully",
            'data': AdminUserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def make_admin(self, request, pk=None):
        """Make user an admin"""
        user = self.get_object()
        user.is_staff = True
        user.save()
        return Response({
            'success': True,
            'message': "User promoted to admin",
            'data': AdminUserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def remove_admin(self, request, pk=None):
        """Remove admin privileges"""
        user = self.get_object()
        user.is_staff = False
        user.is_superuser = False
        user.save()
        return Response({
            'success': True,
            'message': "Admin privileges removed",
            'data': AdminUserSerializer(user).data
        })


class AdminBookingsViewSet(viewsets.ModelViewSet):
    """Admin Bookings Management API"""
    serializer_class = AdminBookingSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    authentication_classes = [SupabaseAuthentication]
    queryset = Booking.objects.all().select_related('customer', 'provider').order_by('-created_at')
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        """Filter bookings based on query params"""
        queryset = Booking.objects.select_related('customer', 'provider').all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search by customer or provider email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(customer__email__icontains=search) |
                Q(provider__email__icontains=search) |
                Q(customer__first_name__icontains=search) |
                Q(provider__first_name__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Override list to add success wrapper"""
        try:
            # Get filtered queryset
            queryset = self.filter_queryset(self.get_queryset())
            
            status_filter = request.query_params.get('status', None)
            search = request.query_params.get('search', None)
            
            print(f"DEBUG Bookings: status={status_filter}, search={search}, queryset_count={queryset.count()}")
            
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"DEBUG: Exception in bookings list: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent bookings"""
        recent_bookings = Booking.objects.select_related('customer', 'provider').order_by('-created_at')[:10]
        serializer = RecentBookingSerializer(recent_bookings, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a booking"""
        booking = self.get_object()
        if booking.status == 'pending':
            booking.status = 'confirmed'
            booking.save()
            return Response({
                'success': True,
                'message': "Booking approved",
                'data': AdminBookingSerializer(booking).data
            })
        return Response({
            'success': False,
            'message': f"Cannot approve booking with status {booking.status}"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        reason = request.data.get('reason', 'Cancelled by admin')
        
        if booking.status not in ['pending', 'confirmed']:
            return Response({
                'success': False,
                'message': f"Cannot cancel booking with status {booking.status}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = 'cancelled'
        booking.save()
        
        return Response({
            'success': True,
            'message': f"Booking cancelled. Reason: {reason}",
            'data': AdminBookingSerializer(booking).data
        })


class RecentUsersView(APIView):
    """Get recent users for dashboard"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        """Get recent users"""
        try:
            limit = int(request.query_params.get('limit', 5))
            user_type = request.query_params.get('user_type', None)
            
            queryset = User.objects.all()
            
            # Filter by user type if specified
            if user_type in ['find', 'offer']:
                queryset = queryset.filter(user_type=user_type)
            
            recent_users = queryset.order_by('-created_at')[:limit]
            serializer = AdminUserSerializer(recent_users, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RecentBookingsView(APIView):
    """Get recent bookings for dashboard"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        """Get recent bookings"""
        try:
            limit = int(request.query_params.get('limit', 5))
            recent_bookings = Booking.objects.select_related(
                'customer', 'provider'
            ).order_by('-created_at')[:limit]
            serializer = RecentBookingSerializer(recent_bookings, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

