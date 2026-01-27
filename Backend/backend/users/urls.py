# from django.urls import path
# from django.views.decorators.csrf import csrf_exempt
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# from .views import  CurrentUserView, SpecialitiesListView, SpecializationsListView, UploadCertificatesView, UploadCitizenshipView, VerifyPhoneView,UpdateUserTypeView

# urlpatterns = [
   
#     path('me/', csrf_exempt(CurrentUserView.as_view()), name='current-user'),
#     path('verify-phone/', csrf_exempt(VerifyPhoneView.as_view()), name='verify-phone'),
#     path('update-user-type/', csrf_exempt(UpdateUserTypeView.as_view()), name='update-user-type'),
#     path('upload-citizenship/', UploadCitizenshipView.as_view(), name='upload-citizenship'),
#     path('upload-certificates/', UploadCertificatesView.as_view(), name='upload-certificates'),
#     path('specialities/', SpecialitiesListView.as_view(), name='specialities-list'),
#     path('specializations/', SpecializationsListView.as_view(), name='specializations-list'),
# ]



from django.urls import path
from .views import (
    CurrentUserView,
    UpdateUserProfileView,
    VerifyPhoneView,
    UpdateUserTypeView,
    UploadCitizenshipView,
    UploadCertificatesView,
    SaveCertificatesView,
    SpecialitiesListView,
    SpecializationsListView,
    LocationsListView
)
from .views import RegistrationStatusView

urlpatterns = [
    # User endpoints
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('me/update/', UpdateUserProfileView.as_view(), name='update-user-profile'),
    path('verify-phone/', VerifyPhoneView.as_view(), name='verify-phone'),
    path('update-user-type/', UpdateUserTypeView.as_view(), name='update-user-type'),
    path('upload-citizenship/', UploadCitizenshipView.as_view(), name='upload-citizenship'),
    path('upload-certificates/', UploadCertificatesView.as_view(), name='upload-certificates'),
    path('save-certificates/', SaveCertificatesView.as_view(), name='save-certificates'),
    path('registration-status/', RegistrationStatusView.as_view(), name='registration-status'),
    
    # Lookup endpoints
    path('specialities/', SpecialitiesListView.as_view(), name='specialities-list'),
    path('specializations/', SpecializationsListView.as_view(), name='specializations-list'),
    path('locations/', LocationsListView.as_view(), name='locations-list'),
]