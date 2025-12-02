from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, SpecialitiesListView, SpecializationsListView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('specialities/', SpecialitiesListView.as_view(), name='specialities-list'),
    path('specializations/', SpecializationsListView.as_view(), name='specializations-list'),
]