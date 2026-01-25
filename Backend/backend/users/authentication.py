import jwt
import requests
import logging
from jwt import PyJWKClient
from jwt.exceptions import (
    PyJWKClientError, 
    InvalidSignatureError, 
    DecodeError, 
    InvalidTokenError,
    ExpiredSignatureError
)
from rest_framework import authentication, exceptions
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import UserSpeciality, UserSpecialization

logger = logging.getLogger(__name__)

User = get_user_model()

# Cache for JWKS client
_jwks_client = None

def get_jwks_client():
    """Get or create a cached JWKS client for Supabase"""
    global _jwks_client
    if _jwks_client is None:
        supabase_url = settings.SUPABASE_URL
        if not supabase_url:
            raise ValueError("SUPABASE_URL not configured")
        
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Authenticates users via Supabase JWT tokens.
    Supports both HS256 (legacy) and ES256 (new) algorithms.
    """
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # First, try to decode without verification to check the algorithm
            unverified = jwt.decode(token, options={"verify_signature": False})
            
            # Get the token header to check the algorithm
            header = jwt.get_unverified_header(token)
            alg = header.get('alg', 'HS256')
            
            if alg == 'HS256':
                # Use legacy JWT secret for HS256 tokens
                jwt_secret = settings.SUPABASE_JWT_SECRET
                if not jwt_secret:
                    raise exceptions.AuthenticationFailed('SUPABASE_JWT_SECRET not configured')
                
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=['HS256'],
                    options={"verify_signature": True, "verify_aud": False}
                )
            else:
                # Use JWKS for asymmetric algorithms (ES256, RS256)
                try:
                    jwks_client = get_jwks_client()
                    signing_key = jwks_client.get_signing_key_from_jwt(token)
                    
                    payload = jwt.decode(
                        token,
                        signing_key.key,
                        algorithms=['ES256', 'RS256'],
                        options={"verify_signature": True, "verify_aud": False}
                    )
                except PyJWKClientError as jwks_err:
                    raise exceptions.AuthenticationFailed(f'JWKS error: {str(jwks_err)}')
                except KeyError as key_err:
                    raise exceptions.AuthenticationFailed(f'Key not found in JWKS: {str(key_err)}')
            
            # Extract user ID (sub) and email from token
            user_id = payload.get('sub')  # Supabase uses 'sub' for UUID
            email = payload.get('email')
            
            if not email:
                raise exceptions.AuthenticationFailed('Invalid token: no email found')

            # Get or create user in Django based on email
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'is_active': True,
                    'supabase_uid': user_id,
                }
            )

            if created:
                logger.info(f'New user created from token: {email}')
            else:
                # Update supabase_uid if not already set
                if user.supabase_uid != user_id:
                    logger.info(f'Updating supabase_uid for user: {email}')
                    user.supabase_uid = user_id
                    user.save(update_fields=['supabase_uid'])

            # Ensure user is active (in case it was deactivated)
            if not user.is_active:
                logger.info(f'Reactivating user: {email}')
                user.is_active = True
                user.save(update_fields=['is_active'])

            return (user, token)
            
        except ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except InvalidTokenError as e:
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
        except exceptions.AuthenticationFailed:
            # Re-raise our own exceptions
            raise
        except Exception as e:
            logger.error(f'Authentication error: {type(e).__name__}: {str(e)}')
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')

