import jwt
import requests
import logging
from jwt import PyJWKClient
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
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Authenticates users via Supabase JWT tokens.
    Supports both HS256 (legacy) and ES256 (new) algorithms.
    """
    def authenticate(self, request):
        print("[SupabaseAuth] authenticate() called")
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        print(f"[SupabaseAuth] Authorization header present: {bool(auth_header)}")
        
        if not auth_header.startswith('Bearer '):
            print("[SupabaseAuth] No Bearer token found, returning None")
            return None
        
        token = auth_header.split(' ')[1]
        print(f"[SupabaseAuth] Token extracted (first 20 chars): {token[:20]}...")
        
        try:
            # First, try to decode without verification to check the algorithm
            unverified = jwt.decode(token, options={"verify_signature": False})
            print(f"[SupabaseAuth] Token decoded (unverified). Email: {unverified.get('email')}")
            
            # Get the token header to check the algorithm
            header = jwt.get_unverified_header(token)
            alg = header.get('alg', 'HS256')
            print(f"[SupabaseAuth] Token algorithm: {alg}")
            
            if alg == 'HS256':
                # Use legacy JWT secret for HS256 tokens
                jwt_secret = settings.SUPABASE_JWT_SECRET
                if not jwt_secret:
                    print("[SupabaseAuth] ERROR: SUPABASE_JWT_SECRET not configured")
                    raise exceptions.AuthenticationFailed('SUPABASE_JWT_SECRET not configured')
                
                print("[SupabaseAuth] Using HS256 validation")
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=['HS256'],
                    options={"verify_signature": True}
                )
            else:
                # For ES256 or other asymmetric algorithms, use JWKS
                print(f"[SupabaseAuth] Using JWKS validation for {alg}")
                jwks_client = get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=['ES256', 'RS256'],
                    options={"verify_signature": True}
                )
            
            print(f"[SupabaseAuth] Token validated successfully")
            
            # Extract user ID (sub) and email from token
            user_id = payload.get('sub')
            email = payload.get('email')
            print(f"[SupabaseAuth] Extracted - Email: {email}, UserID: {user_id}")
            
            if not email:
                print("[SupabaseAuth] ERROR: No email in token payload")
                raise exceptions.AuthenticationFailed('Invalid token: no email found')

            # Get or create user in Django based on email
            print(f"[SupabaseAuth] Getting or creating user for: {email}")
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'is_active': True,
                    'supabase_uid': user_id,
                }
            )

            if created:
                print(f"[SupabaseAuth] New user created: {email}")
                logger.info(f'New user created from token: {email}')
            else:
                print(f"[SupabaseAuth] Existing user found: {email}")
                # Update supabase_uid if not already set
                if user.supabase_uid != user_id:
                    print(f"[SupabaseAuth] Updating supabase_uid for: {email}")
                    logger.info(f'Updating supabase_uid for user: {email}')
                    user.supabase_uid = user_id
                    user.save(update_fields=['supabase_uid'])

            # Ensure user is active (in case it was deactivated)
            if not user.is_active:
                print(f"[SupabaseAuth] Reactivating user: {email}")
                logger.info(f'Reactivating user: {email}')
                user.is_active = True
                user.save(update_fields=['is_active'])

            print(f"[SupabaseAuth] Authentication successful for: {email}")
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            print("[SupabaseAuth] ERROR: Token expired")
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            print(f"[SupabaseAuth] ERROR: Invalid token - {str(e)}")
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            print(f"[SupabaseAuth] ERROR: Authentication failed - {str(e)}")
            import traceback
            traceback.print_exc()
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')
