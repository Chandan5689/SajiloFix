from rest_framework import serializers
from .models import ExampleService

class ExampleServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExampleService
        fields = '__all__'