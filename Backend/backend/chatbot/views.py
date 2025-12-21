from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import ChatMessageSerializer
from .services import GeminiChatService

class ChatbotView(APIView):
    """
    API endpoint for chatbot interactions
    """
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            message = serializer.validated_data.get('message')
            conversation_history = serializer.validated_data.get('conversation_history', [])
            
            # Get response from Gemini
            chat_service = GeminiChatService()
            result = chat_service.get_response(message, conversation_history)
            
            if result['success']:
                return Response({
                    'response': result['message'],
                    'status': 'success'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': result['message'],
                    'status': 'error'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)