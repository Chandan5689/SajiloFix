# import google.genai as genai 
# from google.genai import types
# from django.conf import settings
# import os

# class GeminiChatService:
#     def __init__(self):
#         # Configure Gemini API
#         genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
#         # self.model = genai.GenerativeModel('gemini-2.5-flash')

#         self.model = genai.GenerativeModel('gemini-1.5-pro')
        
#     def get_response(self, message, conversation_history=None):
#         """
#         Get response from Gemini AI
#         """
#         try:
#             # Create context about SajiloFix
#             system_context = """
#             You are a helpful assistant for SajiloFix, a service providing platform in Nepal. 
#             SajiloFix connects customers with service providers for:
#             - Plumbing services
#             - Electrical work
#             - AC repair and maintenance
#             - And many other home services
            
#             Help users with:
#             - Finding the right service
#             - Booking appointments
#             - Understanding pricing
#             - General inquiries about services
            
#             Be friendly, professional, and concise in your responses.
#             """
            
#             # Combine context with user message
#             full_prompt = f"{system_context}\n\nUser: {message}\n\nAssistant:"
            
#             # Generate response
#             response = self.model.generate_content(full_prompt)
            
#             return {
#                 'success': True,
#                 'message': response.text
#             }
            
#         except Exception as e:
#             return {
#                 'success': False,
#                 'message': f"Error: {str(e)}"
#             }




import google.genai as genai
from google.genai import types
import os
from decouple import config
from rest_framework import serializers


class GeminiChatService:
    def __init__(self):
        # Get API key from environment
        api_key = config('GEMINI_API_KEY', default=None) 
    
        if not api_key:
            # Do not raise here; allow application to run without Gemini configured.
            # get_response will return a friendly error instead of causing a 500.
            self.client = None
            self.model = None
            self.enabled = False
            return
        
        # Configure Gemini API with new SDK
        self.client = genai.Client(api_key=api_key)
        self.model = 'gemini-2.5-flash-lite'  # Latest model
        self.enabled = True
        
    def get_response(self, message, conversation_history=None):
        """
        Get response from Gemini AI using new google.genai SDK
        """
        try:
            if not getattr(self, 'enabled', False) or not self.client:
                return {
                    'success': False,
                    'message': 'Chat service is not configured. Please set GEMINI_API_KEY in the server environment.'
                }
            # Create context about SajiloFix
            system_instruction = """
You are a helpful assistant for SajiloFix, a service providing platform in Nepal. 
SajiloFix connects customers with service providers for various home services including:
- Plumbing services
- Electrical work
- AC repair and maintenance
- Carpentry
- Painting
- Cleaning services
- And many other home services

Your role:
- Help users find the right service
- Answer questions about available services
- Provide general information about the platform
- Assist with booking inquiries
- Give advice on home maintenance

Communication style:
- Be friendly and professional
- Keep responses concise (2-4 sentences)
- Use simple language
- If you don't know something specific, be honest
            """
            
            # Generate response
            response = self.client.models.generate_content(
                model=self.model,
                contents=message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                    max_output_tokens=1024,
                )
            )
            
            # Extract text from response
            if response and response.text:
                return {
                    'success': True,
                    'message': response.text
                }
            else:
                return {
                    'success': False,
                    'message': "I couldn't generate a response. Please try again."
                }
            
        except Exception as e:
            print(f"Error in get_response: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'message': f"Sorry, I encountered an error. Please try again."
            }
        
        
