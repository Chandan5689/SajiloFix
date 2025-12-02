from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import Speciality, Specialization, UserSpeciality, UserSpecialization, Certificate

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_staff', 'created_at')
    list_filter = ('user_type', 'is_verified', 'is_staff', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number', 'business_name')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'profile_picture', 'address', 'city', 'bio')}),
        ('Professional Info', {'fields': ('user_type', 'business_name', 'years_of_experience', 'service_area')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'phone_number', 'user_type'),
        }),
    )


@admin.register(Speciality)
class SpecialityAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ('name', 'speciality', 'created_at')
    list_filter = ('speciality',)
    search_fields = ('name', 'speciality__name')


@admin.register(UserSpeciality)
class UserSpecialityAdmin(admin.ModelAdmin):
    list_display = ('user', 'speciality', 'added_at')
    list_filter = ('speciality',)
    search_fields = ('user__email', 'speciality__name')


@admin.register(UserSpecialization)
class UserSpecializationAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialization', 'added_at')
    list_filter = ('specialization__speciality',)
    search_fields = ('user__email', 'specialization__name')


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'uploaded_at')
    search_fields = ('user__email', 'name')
    list_filter = ('uploaded_at',)