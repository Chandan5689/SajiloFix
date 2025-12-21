from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import UserSerializer, SpecialitySerializer, SpecializationSerializer, CertificateSerializer
from .models import Speciality, Specialization, UserSpeciality, UserSpecialization, Certificate
from .authentication import ClerkAuthentication

User = get_user_model()

class IsRegistrationComplete(BasePermission):
    """Permission to check if user has completed registration (phone verified)"""
    message = 'Complete your registration first. Please verify your phone number.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.registration_completed


class RegistrationStatusView(APIView):
    """Check registration status without requiring completed registration"""
    authentication_classes = [ClerkAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'phone_verified': user.phone_verified,
            'registration_completed': user.registration_completed,
            'user_type': user.user_type,
            'email': user.email,
            'phone_number': user.phone_number,
        })


class CurrentUserView(generics.RetrieveAPIView):
    """Get current logged-in user details"""
    authentication_classes = [ClerkAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


@method_decorator(csrf_exempt, name='dispatch')
class VerifyPhoneView(APIView):
    """Verify and save user's phone number"""
    authentication_classes = [ClerkAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        phone_number = request.data.get('phone_number')
        firebase_uid = request.data.get('firebase_uid')
        
        if not phone_number:
            return Response(
                {'error': 'Phone number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate phone number format (10 digits starting with 97 or 98)
        if len(phone_number) != 10 or not (phone_number.startswith('98') or phone_number.startswith('97')):
            return Response(
                {'error': 'Invalid phone number format. Must be 10 digits starting with 97 or 98'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if phone number already exists
        if User.objects.filter(phone_number=phone_number).exclude(id=request.user.id).exists():
            return Response(
                {'error': 'Phone number already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user and mark registration complete
        user = request.user
        user.phone_number = phone_number
        user.phone_verified = True
        user.firebase_phone_uid = firebase_uid
        user.registration_completed = True
        user.save()
        
        return Response({
            'message': 'Phone verified successfully and registration completed',
            'user': UserSerializer(user, context={'request': request}).data,
            'registration_status': {
                'phone_verified': user.phone_verified,
                'registration_completed': user.registration_completed,
            }
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class UpdateUserTypeView(APIView):
    """Update user type and provider information"""
    authentication_classes = [ClerkAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user_type = request.data.get('user_type')
        user = request.user
        
        if user_type not in ['find', 'offer']:
            return Response(
                {'error': 'Invalid user type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Persist selected user type
        user.user_type = user_type
        
        # Location is for all users
        user.location = request.data.get('location', '')
        
        # If changing to service provider, accept partial info here and enforce details later
        # so phone verification flow does not fail. Detailed validation will occur in
        # the provider profile completion step.
        if user_type == 'offer':
            # Optional fields captured if provided
            user.business_name = request.data.get('business_name', user.business_name)
            user.bio = request.data.get('bio', user.bio)
            user.years_of_experience = request.data.get('years_of_experience', user.years_of_experience)
            user.service_area = request.data.get('service_area', user.service_area)
            user.city = request.data.get('city', user.city)
            user.address = request.data.get('address', user.address)

            # Handle specialities/specializations only if supplied
            speciality_ids = request.data.get('specialities', None)
            if speciality_ids is not None:
                UserSpeciality.objects.filter(user=user).delete()
                for spec_id in speciality_ids:
                    try:
                        speciality = Speciality.objects.get(id=spec_id)
                        UserSpeciality.objects.create(user=user, speciality=speciality)
                    except Speciality.DoesNotExist:
                        pass

            specialization_ids = request.data.get('specializations', None)
            if specialization_ids is not None:
                UserSpecialization.objects.filter(user=user).delete()
                for spec_id in specialization_ids:
                    try:
                        specialization = Specialization.objects.get(id=spec_id)
                        UserSpecialization.objects.create(user=user, specialization=specialization)
                    except Specialization.DoesNotExist:
                        pass
        
        user.save()
        
        return Response({
            'message': 'User type updated successfully',
            'user': UserSerializer(user, context={'request': request}).data
        })

class UploadCitizenshipView(APIView):
    """Upload citizenship/national ID documents"""
    authentication_classes = [ClerkAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        user = request.user
        
        citizenship_front = request.FILES.get('citizenship_front')
        citizenship_back = request.FILES.get('citizenship_back')
        citizenship_number = request.data.get('citizenship_number')
        
        if not citizenship_front or not citizenship_back:
            return Response(
                {'error': 'Both front and back images of citizenship are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB each)
        for file in [citizenship_front, citizenship_back]:
            if file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': f'{file.name} is too large. Maximum size is 5MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update user
        user.citizenship_front = citizenship_front
        user.citizenship_back = citizenship_back
        user.citizenship_number = citizenship_number or ''
        user.save()
        
        return Response({
            'message': 'Citizenship documents uploaded successfully',
            'user': UserSerializer(user, context={'request': request}).data
        })


class UploadCertificatesView(APIView):
    """Upload multiple certificates"""
    authentication_classes = [ClerkAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        user = request.user
        files = request.FILES.getlist('certificates')
        
        if not files:
            return Response(
                {'error': 'No files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_certificates = []
        
        for file in files:
            # Validate file size (max 10MB)
            if file.size > 10 * 1024 * 1024:
                return Response(
                    {'error': f'{file.name} is too large. Maximum size is 10MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create certificate
            certificate = Certificate.objects.create(
                user=user,
                name=file.name,
                file=file
            )
            uploaded_certificates.append(certificate)
        
        return Response({
            'message': f'{len(uploaded_certificates)} certificate(s) uploaded successfully',
            'certificates': CertificateSerializer(
                uploaded_certificates, 
                many=True, 
                context={'request': request}
            ).data
        })


class SpecialitiesListView(generics.ListAPIView):
    """Get all available specialities"""
    queryset = Speciality.objects.all()
    serializer_class = SpecialitySerializer
    permission_classes = [AllowAny]


class SpecializationsListView(generics.ListAPIView):
    """Get all specializations, optionally filtered by speciality"""
    serializer_class = SpecializationSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Specialization.objects.all().select_related('speciality')
        speciality_id = self.request.query_params.get('speciality_id', None)
        if speciality_id:
            queryset = queryset.filter(speciality_id=speciality_id)
        return queryset