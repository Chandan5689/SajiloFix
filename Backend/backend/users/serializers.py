from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from .models import Speciality, Specialization, UserSpeciality, UserSpecialization, Certificate

User = get_user_model()


class SpecialitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Speciality
        fields = ['id', 'name', 'slug']


class SpecializationSerializer(serializers.ModelSerializer):
    speciality_name = serializers.CharField(source='speciality.name', read_only=True)
    
    class Meta:
        model = Specialization
        fields = ['id', 'name', 'speciality_name']


class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ['id', 'name', 'file', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class RegisterSerializer(serializers.ModelSerializer):
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
    phone_number = serializers.CharField(required=True)
    user_type = serializers.ChoiceField(choices=['find', 'offer'], required=True)
    
    # Optional fields for service providers
    business_name = serializers.CharField(required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    service_area = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=True, allow_null=False)
    
    # Specialities and Specializations (IDs)
    specialities = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    specializations = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )

    class Meta:
        model = User
        fields = (
            'email', 'password', 'confirm_password', 'first_name', 'last_name',
            'phone_number', 'user_type', 'business_name', 'years_of_experience',
            'service_area', 'address', 'city', 'bio', 'profile_picture',
            'specialities', 'specializations'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        
        # If user is offering services, validate specialities
        if attrs.get('user_type') == 'offer':
            specialities = attrs.get('specialities', [])
            if not specialities:
                raise serializers.ValidationError(
                    {"specialities": "Service providers must select at least one speciality."}
                )
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        
        # Extract specialities and specializations
        speciality_ids = validated_data.pop('specialities', [])
        specialization_ids = validated_data.pop('specializations', [])
        
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
        
        return user


class UserSerializer(serializers.ModelSerializer):
    specialities = serializers.SerializerMethodField()
    specializations = serializers.SerializerMethodField()
    certificates = CertificateSerializer(many=True, read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'phone_number', 'user_type',
            'profile_picture', 'profile_picture_url', 'address', 'city', 'bio',
            'business_name', 'years_of_experience', 'service_area', 'is_verified',
            'specialities', 'specializations', 'certificates', 'created_at'
        )
        read_only_fields = ('id', 'is_verified', 'created_at')
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None
    
    def get_specialities(self, obj):
        user_specialities = UserSpeciality.objects.filter(user=obj).select_related('speciality')
        return [{'id': us.speciality.id, 'name': us.speciality.name} for us in user_specialities]
    
    def get_specializations(self, obj):
        user_specializations = UserSpecialization.objects.filter(user=obj).select_related('specialization')
        return [{'id': us.specialization.id, 'name': us.specialization.name} for us in user_specializations]