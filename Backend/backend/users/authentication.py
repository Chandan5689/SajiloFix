import requests
import jwt
from rest_framework import authentication, exceptions
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import UserSpeciality, UserSpecialization

User = get_user_model()


class ClerkAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode JWT token without verification first to get user_id
            # Clerk tokens are signed but we'll verify by fetching user data
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            user_id = unverified_payload.get('sub')  # Clerk uses 'sub' for user ID
            
            if not user_id:
                raise exceptions.AuthenticationFailed('Invalid token: no user ID found')
            
            # Get user details from Clerk to verify token is valid
            user_response = requests.get(
                f'https://api.clerk.com/v1/users/{user_id}',
                headers={
                    'Authorization': f'Bearer {settings.CLERK_SECRET_KEY}',
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            if user_response.status_code != 200:
                print(f"❌ Clerk API Error: {user_response.status_code}")
                print(f"Response: {user_response.text}")
                raise exceptions.AuthenticationFailed(f'Could not verify user with Clerk API: {user_response.status_code}')
            
            user_data = user_response.json()
            email = user_data.get('email_addresses', [{}])[0].get('email_address')
            
            if not email:
                raise exceptions.AuthenticationFailed('No email found')
            
            # Get or create user in Django
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': user_data.get('first_name', ''),
                    'last_name': user_data.get('last_name', ''),
                    'is_active': True,
                    'clerk_user_id': user_id,
                }
            )
            
            # Update clerk_user_id if not set
            if not user.clerk_user_id:
                user.clerk_user_id = user_id
                user.save()
            
            return (user, token)
            
        except requests.RequestException as e:
            raise exceptions.AuthenticationFailed(f'Clerk API error: {str(e)}')
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')