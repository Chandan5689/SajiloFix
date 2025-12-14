from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, SpecialitySerializer, SpecializationSerializer
from .models import Speciality, Specialization

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Get user data with context for absolute URLs
        user_serializer = UserSerializer(user, context={'request': request})
        
        return Response({
            'user': user_serializer.data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class SpecialitiesListView(generics.ListAPIView):
    """Get all available specialities"""
    queryset = Speciality.objects.all()
    serializer_class = SpecialitySerializer
    permission_classes = (AllowAny,)


class SpecializationsListView(generics.ListAPIView):
    """Get all specializations, optionally filtered by speciality"""
    serializer_class = SpecializationSerializer
    permission_classes = (AllowAny,)
    
    def get_queryset(self):
        queryset = Specialization.objects.all().select_related('speciality')
        speciality_id = self.request.query_params.get('speciality_id', None)
        if speciality_id:
            queryset = queryset.filter(speciality_id=speciality_id)
        return queryset