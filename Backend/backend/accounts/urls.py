from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExampleServiceViewSet

router = DefaultRouter()
router.register(r'services', ExampleServiceViewSet, basename='services')

urlpatterns = [
    path('', include(router.urls)),
]