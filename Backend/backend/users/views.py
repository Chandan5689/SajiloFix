
# --- Imports ---
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
from rest_framework.decorators import authentication_classes, permission_classes
from .serializers import UserSerializer, SpecialitySerializer, SpecializationSerializer, CertificateSerializer
from .models import Speciality, Specialization, UserSpeciality, UserSpecialization, Certificate
from .authentication import SupabaseAuthentication

User = get_user_model()

# --- Permissions ---
class IsAdminUserType(BasePermission):
    """Allow access only to users with user_type='admin'"""
    message = 'Admin privileges required.'
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'user_type', None) == 'admin')

# Example admin-only view using IsAdminUserType
class AdminOnlyUserListView(generics.ListAPIView):
    """List all users (admin only)"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAdminUserType]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.all()

class IsRegistrationComplete(BasePermission):
    """Permission to check if user has completed registration (phone verified)"""
    message = 'Complete your registration first. Please verify your phone number.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.registration_completed


class RegistrationStatusView(APIView):
    """Check registration status without requiring completed registration"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    # Disable CSRF for this view (uses token auth, not cookies)
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        print(f"RegistrationStatusView called - User: {request.user}, Authenticated: {request.user.is_authenticated}")
        user = request.user
        return Response({
            'phone_verified': user.phone_verified,
            'registration_completed': user.registration_completed,
            'user_type': user.user_type,
            'email': user.email,
            'phone_number': user.phone_number,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_admin': user.user_type == 'admin',
        })


class CurrentUserView(generics.RetrieveAPIView):
    """Get current logged-in user details"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_object(self):
        return self.request.user


class UpdateUserProfileView(generics.UpdateAPIView):
    """Update current user's profile information"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class VerifyPhoneView(APIView):
    """Verify and save user's phone number"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
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
        # Only set registration_completed for 'find' users here. Providers complete registration after full profile.
        if user.user_type == 'find':
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


class UpdateUserTypeView(APIView):
    """Update user type and provider information"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        user_type = request.data.get('user_type')
        user = request.user
        
        if user_type not in ['find', 'offer']:
            return Response(
                {'error': 'Invalid user type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user name fields if provided
        if request.data.get('first_name'):
            user.first_name = request.data.get('first_name')
        if request.data.get('middle_name'):
            user.middle_name = request.data.get('middle_name')
        if request.data.get('last_name'):
            user.last_name = request.data.get('last_name')
        
        # Update profile picture if provided (now accepts URL string from Supabase)
        if 'profile_picture' in request.data and request.data['profile_picture']:
            user.profile_picture = request.data['profile_picture']
        
        # Update citizenship documents if provided (now accepts URL strings from Supabase)
        if 'citizenship_front' in request.data and request.data['citizenship_front']:
            user.citizenship_front = request.data['citizenship_front']
        if 'citizenship_back' in request.data and request.data['citizenship_back']:
            user.citizenship_back = request.data['citizenship_back']
        if 'citizenship_number' in request.data and request.data['citizenship_number']:
            citizenship_num = request.data['citizenship_number'].strip()
            # Validate citizenship number format (must be exactly 11 digits)
            if citizenship_num and (not citizenship_num.isdigit() or len(citizenship_num) != 11):
                return Response(
                    {'error': 'Citizenship number must be exactly 11 digits'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.citizenship_number = citizenship_num
        
        # Persist selected user type
        user.user_type = user_type
        
        # Update name fields (optional but preferred over default)
        first_name = request.data.get('first_name', '').strip()
        middle_name = request.data.get('middle_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        phone_number = request.data.get('phone_number', '').strip()
        
        # Validate and save phone number if provided
        if phone_number:
            if len(phone_number) != 10 or not (phone_number.startswith('98') or phone_number.startswith('97')):
                return Response(
                    {'error': 'Invalid phone number format. Must be 10 digits starting with 97 or 98'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if phone number already exists
            if User.objects.filter(phone_number=phone_number).exclude(id=user.id).exists():
                return Response(
                    {'error': 'Phone number already registered'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.phone_number = phone_number
            # For providers, phone verification will be done by admin after calling user
            # For customers (find), phone is auto-verified as they don't require manual verification
            if user_type == 'offer':
                user.phone_verified = False
            else:
                user.phone_verified = True
        
        # Apply name fields if provided
        if first_name:
            user.first_name = first_name[:150]
        if middle_name:
            user.middle_name = middle_name[:150]
        if last_name:
            user.last_name = last_name[:150]
        
        # Location is for all users (accept detailed fields and structured payload)
        loc_payload = request.data.get('location_payload')
        # Prefer explicit fields, fall back to structured payload if provided
        location_str = request.data.get('location', None)
        address_str = request.data.get('address', None)
        city_str = request.data.get('city', None)
        district_str = request.data.get('district', None)
        postal_str = request.data.get('postal_code', None)

        def _as_str(val, default=''):
            return str(val) if val is not None else default

        if not location_str and isinstance(loc_payload, dict):
            location_str = loc_payload.get('formatted')
        if not address_str and isinstance(loc_payload, dict):
            address_str = loc_payload.get('street')
        if not city_str and isinstance(loc_payload, dict):
            city_str = loc_payload.get('city')
        if not district_str and isinstance(loc_payload, dict):
            district_str = loc_payload.get('district')
        if not postal_str and isinstance(loc_payload, dict):
            postal_str = loc_payload.get('postal_code')

        # Assign with safe string conversion and length cap
        user.location = _as_str(location_str)[:255]
        user.address = _as_str(address_str, user.address)[:255]
        user.city = _as_str(city_str, user.city)[:100]
        user.district = _as_str(district_str, user.district)[:100]
        user.postal_code = _as_str(postal_str, user.postal_code)[:20]
        # Latitude/Longitude may be strings; cast safely
        lat = request.data.get('latitude', None)
        lng = request.data.get('longitude', None)
        try:
            user.latitude = float(lat) if lat not in [None, ''] else user.latitude
        except (ValueError, TypeError):
            pass
        try:
            user.longitude = float(lng) if lng not in [None, ''] else user.longitude
        except (ValueError, TypeError):
            pass
        
        # If changing to service provider, accept partial info here and enforce details later
        # so phone verification flow does not fail. Detailed validation will occur in
        # the provider profile completion step.
        if user_type == 'offer':
            # Optional fields captured if provided
            user.business_name = request.data.get('business_name', user.business_name)
            user.bio = request.data.get('bio', user.bio)
            user.years_of_experience = request.data.get('years_of_experience', user.years_of_experience)
            user.service_area = request.data.get('service_area', user.service_area)

            # Handle specialities/specializations only if supplied
            # Support multiple values in multipart/form-data (QueryDict.getlist)
            speciality_ids = request.data.getlist('specialities') if hasattr(request.data, 'getlist') else request.data.get('specialities', None)
            # Normalize to list of strings
            if isinstance(speciality_ids, str):
                speciality_ids = [s for s in speciality_ids.split(',') if s]

            specialization_ids = request.data.getlist('specializations') if hasattr(request.data, 'getlist') else request.data.get('specializations', None)
            if isinstance(specialization_ids, str):
                specialization_ids = [s for s in specialization_ids.split(',') if s]

            # Enforce: For providers, at least one specialization per selected speciality
            # Check if speciality_ids is both not None AND actually has values (not empty list from getlist)
            if speciality_ids and len(speciality_ids) > 0:
                # Convert IDs to integers where possible
                try:
                    speciality_ids_int = {int(sid) for sid in speciality_ids}
                except (ValueError, TypeError):
                    return Response({'error': 'Invalid speciality IDs'}, status=status.HTTP_400_BAD_REQUEST)

                # Require specializations provided
                if not specialization_ids:
                    return Response(
                        {'error': 'Provide at least one specialization for each selected speciality'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Fetch specializations and group by speciality
                try:
                    spec_qs = Specialization.objects.filter(id__in=specialization_ids).select_related('speciality')
                except (ValueError, TypeError):
                    return Response({'error': 'Invalid specialization IDs'}, status=status.HTTP_400_BAD_REQUEST)

                spec_by_speciality = {}
                for sp in spec_qs:
                    spec_by_speciality.setdefault(sp.speciality_id, []).append(sp.id)

                # Check that every selected speciality has at least one specialization
                missing = [sid for sid in speciality_ids_int if sid not in spec_by_speciality]
                if missing:
                    return Response(
                        {'error': 'Each selected speciality must include at least one specialization', 'missing_speciality_ids': missing},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Check that no specialization belongs to an unselected speciality
                invalid_specs = [sp.id for sp in spec_qs if sp.speciality_id not in speciality_ids_int]
                if invalid_specs:
                    return Response(
                        {'error': 'Specializations must belong to the selected specialities', 'invalid_specialization_ids': invalid_specs},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Persist selections
                UserSpeciality.objects.filter(user=user).delete()
                for sid in speciality_ids_int:
                    try:
                        speciality = Speciality.objects.get(id=sid)
                        UserSpeciality.objects.create(user=user, speciality=speciality)
                    except Speciality.DoesNotExist:
                        return Response({'error': f'Speciality id {sid} not found'}, status=status.HTTP_400_BAD_REQUEST)

                UserSpecialization.objects.filter(user=user).delete()
                for sp in spec_qs:
                    UserSpecialization.objects.create(user=user, specialization=sp)
            elif specialization_ids and len(specialization_ids) > 0:
                # If specialities not provided (or empty) but specializations are, ensure they are consistent and persist
                    try:
                        spec_qs = Specialization.objects.filter(id__in=specialization_ids).select_related('speciality')
                    except (ValueError, TypeError):
                        return Response({'error': 'Invalid specialization IDs'}, status=status.HTTP_400_BAD_REQUEST)

                    if not spec_qs.exists():
                        return Response({'error': 'At least one specialization is required for providers'}, status=status.HTTP_400_BAD_REQUEST)

                    # Derive specialities from provided specializations and save both
                    derived_speciality_ids = {sp.speciality_id for sp in spec_qs}
                    UserSpeciality.objects.filter(user=user).delete()
                    for sid in derived_speciality_ids:
                        try:
                            speciality = Speciality.objects.get(id=sid)
                            UserSpeciality.objects.create(user=user, speciality=speciality)
                        except Speciality.DoesNotExist:
                            return Response({'error': f'Speciality id {sid} not found'}, status=status.HTTP_400_BAD_REQUEST)

                    UserSpecialization.objects.filter(user=user).delete()
                    for sp in spec_qs:
                        UserSpecialization.objects.create(user=user, specialization=sp)
        
        # Mark registration as completed for service seekers (find) only
        if user_type == 'find':
            user.registration_completed = True
        
        user.save()
        
        return Response({
            'message': 'User type updated successfully',
            'user': UserSerializer(user, context={'request': request}).data
        })

class UploadCitizenshipView(APIView):
    """Upload citizenship/national ID documents - Now accepts URLs from Supabase"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # Accept both JSON and files
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        user = request.user
        
        # Check if URLs are provided (new Supabase approach)
        citizenship_front_url = request.data.get('citizenship_front')
        citizenship_back_url = request.data.get('citizenship_back')
        citizenship_number = request.data.get('citizenship_number')
        
        # Legacy support: Check if files are uploaded (old approach)
        citizenship_front_file = request.FILES.get('citizenship_front')
        citizenship_back_file = request.FILES.get('citizenship_back')
        
        # Require either URLs or files
        if not (citizenship_front_url or citizenship_front_file) or not (citizenship_back_url or citizenship_back_file):
            return Response(
                {'error': 'Both front and back images of citizenship are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate citizenship number format (must be exactly 11 digits)
        if citizenship_number:
            citizenship_number = citizenship_number.strip()
            if not citizenship_number.isdigit() or len(citizenship_number) != 11:
                return Response(
                    {'error': 'Citizenship number must be exactly 11 digits'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update user - prefer URLs, fallback to files
        if citizenship_front_url:
            user.citizenship_front = citizenship_front_url
        elif citizenship_front_file:
            # Validate file size for legacy uploads
            if citizenship_front_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': f'{citizenship_front_file.name} is too large. Maximum size is 5MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.citizenship_front = citizenship_front_file
        
        if citizenship_back_url:
            user.citizenship_back = citizenship_back_url
        elif citizenship_back_file:
            # Validate file size for legacy uploads
            if citizenship_back_file.size > 5 * 1024 * 1024:
                return Response(
                    {'error': f'{citizenship_back_file.name} is too large. Maximum size is 5MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.citizenship_back = citizenship_back_file
        
        user.citizenship_number = citizenship_number or ''
        
        # Do not mark registration as complete here; wait for full profile completion
        
        user.save()
        
        return Response({
            'message': 'Citizenship documents uploaded successfully',
            'user': UserSerializer(user, context={'request': request}).data
        })


class UploadCertificatesView(APIView):
    """Upload multiple certificates"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
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


class SaveCertificatesView(APIView):
    """Save certificate URLs (from Supabase) to database"""
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        user = request.user
        certificates_data = request.data.get('certificates', [])
        
        if not certificates_data:
            return Response(
                {'error': 'No certificates provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_certificates = []
        
        for cert_data in certificates_data:
            cert_name = cert_data.get('name', 'Certificate')
            cert_url = cert_data.get('url')
            
            if not cert_url:
                continue
            
            # Create certificate with URL
            certificate = Certificate.objects.create(
                user=user,
                name=cert_name,
                file=cert_url  # Now stores URL instead of file
            )
            uploaded_certificates.append(certificate)

        # After all required details are provided, mark provider registration as complete
        if user.user_type == 'offer':
            user.registration_completed = True
            user.save()
        
        return Response({
            'message': f'{len(uploaded_certificates)} certificate(s) saved successfully',
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
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)


class SpecializationsListView(generics.ListAPIView):
    """Get all specializations, optionally filtered by speciality"""
    serializer_class = SpecializationSerializer
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get_queryset(self):
        queryset = Specialization.objects.all().select_related('speciality')
        speciality_id = self.request.query_params.get('speciality_id', None)
        if speciality_id:
            queryset = queryset.filter(speciality_id=speciality_id)
        return queryset


class LocationsListView(APIView):
    """Get available cities and districts from provider data"""
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        try:
            # Get all unique cities and districts from users with complete profiles
            # Filter for users who are service providers with complete registration
            providers = User.objects.filter(
                user_type='offer',
                registration_completed=True,
                city__isnull=False
            ).exclude(city='').values_list('city', 'district').distinct()
            
            # Build cities and districts
            cities = {}
            for city, district in providers:
                if city not in cities:
                    cities[city] = []
                if district and district.strip():  # Check for non-empty district
                    cities[city].append(district)
            
            # Sort and remove duplicates
            for city in cities:
                cities[city] = sorted(list(set(cities[city])))
            
            sorted_cities = sorted(cities.keys())
            
            return Response({
                'cities': sorted_cities,
                'districts': cities
            })
        except Exception as e:
            # Log the error for debugging
            print(f"LocationsListView error: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Return empty data instead of failing
            return Response({
                'cities': [],
                'districts': {}
            }, status=status.HTTP_200_OK)