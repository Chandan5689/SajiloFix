from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from django.core.validators import RegexValidator
from .models import Speciality, Specialization, UserSpeciality, UserSpecialization, Certificate

User = get_user_model()


class SpecialitySerializer(serializers.ModelSerializer):
    """Serializer for Speciality model"""
    class Meta:
        model = Speciality
        fields = ['id', 'name', 'slug', 'description']


class SpecializationSerializer(serializers.ModelSerializer):
    """Serializer for Specialization model"""
    speciality_name = serializers.CharField(source='speciality.name', read_only=True)
    speciality = serializers.IntegerField(source='speciality.id', read_only=True)
    
    class Meta:
        model = Specialization
        fields = ['id', 'name', 'speciality', 'speciality_name']


class CertificateSerializer(serializers.ModelSerializer):
    """Serializer for Certificate model"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Certificate
        fields = ['id', 'name', 'file', 'file_url', 'uploaded_at']
        read_only_fields = ['uploaded_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=True,max_length=14,
        min_length=10,
        validators=[
            RegexValidator(
                regex=r'^98\d{8}|^97\d{8}$',
                message="Phone number must be 10 digits starting with 98 or 97 (e.g., 9812345678)"
            )]
    )
    user_type = serializers.ChoiceField(choices=['find', 'offer'], required=True)
    
    # Optional fields for service providers
    business_name = serializers.CharField(required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    service_area = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=True, allow_null=False)
    
    # Specialities and Specializations (IDs) - now handled as lists
    specialities = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        allow_empty=False,
        
    )
    specializations = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        allow_empty=False,
        
    )

     # Certificates - handled as file list
    certificates = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        write_only=True
    )

    class Meta:
        model = User
        fields = (
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'user_type', 'business_name', 'years_of_experience',
            'service_area', 'address', 'city', 'bio', 'profile_picture',
            'specialities', 'specializations','certificates'
        )

    def to_internal_value(self, data):
        """
        Handle FormData array format like specialities[0], specialities[1]
        """
        # Convert FormData array format to Python lists
        if hasattr(data, 'getlist'):
            # DRF request.data for FormData
            specialities = []
            specializations = []
            certificates = []
            
            # Collect all specialities[*] keys
            for key in data.keys():
                if key.startswith('specialities['):
                    try:
                        specialities.append(int(data[key]))
                    except (ValueError, TypeError):
                        pass
                elif key.startswith('specializations['):
                    try:
                        specializations.append(int(data[key]))
                    except (ValueError, TypeError):
                        pass
                elif key.startswith('certificates['):
                    # Get certificate file
                    cert_file = data.get(key)
                    if cert_file:
                        certificates.append(cert_file)
            
            # Create a mutable copy
            mutable_data = data.copy()
            
            # Remove individual array items
            keys_to_remove = [k for k in mutable_data.keys() if k.startswith('specialities[') or k.startswith('specializations[') or k.startswith('certificates[')]
            for key in keys_to_remove:
                mutable_data.pop(key)
            
            # Add lists
            if specialities:
                mutable_data.setlist('specialities', specialities)
            if specializations:
                mutable_data.setlist('specializations', specializations)
            if certificates:
                mutable_data.setlist('certificates', certificates)

            data = mutable_data
        
        return super().to_internal_value(data)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        
        phone_number = attrs.get('phone_number')
        if User.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError(
                {"phone_number": "This phone number is already registered."}
            )
        
        
        # If user is offering services, validate specialities
        if attrs.get('user_type') == 'offer':
            specialities = attrs.get('specialities', [])
            if not specialities or len(specialities) == 0:
                raise serializers.ValidationError(
                    {"specialities": "Service providers must select at least one speciality."}
                )
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        
        # Extract specialities and specializations
        speciality_ids = validated_data.pop('specialities', [])
        specialization_ids = validated_data.pop('specializations', [])
        certificate_files = validated_data.pop('certificates', [])
        
        # Create username from email
        username = validated_data['email'].split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number'],
            user_type=validated_data['user_type'],
            password=validated_data['password'],
            business_name=validated_data.get('business_name', ''),
            years_of_experience=validated_data.get('years_of_experience', 0),
            service_area=validated_data.get('service_area', ''),
            address=validated_data.get('address', ''),
            city=validated_data.get('city', ''),
            bio=validated_data.get('bio', ''),
            profile_picture=validated_data.get('profile_picture', None)
        )
        
        # Add specialities
        for spec_id in speciality_ids:
            try:
                speciality = Speciality.objects.get(id=spec_id)
                UserSpeciality.objects.create(user=user, speciality=speciality)
            except Speciality.DoesNotExist:
                pass
        
        # Add specializations
        for spec_id in specialization_ids:
            try:
                specialization = Specialization.objects.get(id=spec_id)
                UserSpecialization.objects.create(user=user, specialization=specialization)
            except Specialization.DoesNotExist:
                pass

        # Add certificates
        for cert_file in certificate_files:
            Certificate.objects.create(
                user=user,
                name=cert_file.name,
                file=cert_file
            )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - used for profile display and updates"""
    specialities = serializers.SerializerMethodField()
    specializations = serializers.SerializerMethodField()
    certificates = CertificateSerializer(many=True, read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone_number', 'user_type', 'profile_picture', 'profile_picture_url',
            'address', 'city', 'bio', 'business_name', 'years_of_experience',
            'service_area', 'is_verified', 'specialities', 'specializations',
            'certificates', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'username', 'email', 'is_verified', 'created_at', 'updated_at')
    
    def get_full_name(self, obj):
        """Return full name of the user"""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_profile_picture_url(self, obj):
        """Return absolute URL for profile picture"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None
    
    def get_specialities(self, obj):
        """Get all specialities for the user"""
        user_specialities = UserSpeciality.objects.filter(user=obj).select_related('speciality')
        return [
            {
                'id': us.speciality.id,
                'name': us.speciality.name,
                'slug': us.speciality.slug
            }
            for us in user_specialities
        ]
    
    def get_specializations(self, obj):
        """Get all specializations for the user"""
        user_specializations = UserSpecialization.objects.filter(user=obj).select_related(
            'specialization', 'specialization__speciality'
        )
        return [
            {
                'id': us.specialization.id,
                'name': us.specialization.name,
                'speciality': us.specialization.speciality.name
            }
            for us in user_specializations
        ]