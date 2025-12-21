from rest_framework import serializers

class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(required=True)
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_null=True
    )