from django.shortcuts import render

from rest_framework import viewsets
from .models import ExampleService
from .serializers import ExampleServiceSerializer

class ExampleServiceViewSet(viewsets.ModelViewSet):
    queryset = ExampleService.objects.all()
    serializer_class = ExampleServiceSerializer