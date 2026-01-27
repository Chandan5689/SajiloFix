import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Find user with email ramillamichhane@gmail.com
try:
    user = User.objects.get(email='ramillamichhane@gmail.com')
    print(f"✅ Found user: {user.email}")
    print(f"   Current status:")
    print(f"   - is_staff: {user.is_staff}")
    print(f"   - is_superuser: {user.is_superuser}")
    print(f"   - user_type: {user.user_type}")
    
    if not user.is_staff and not user.is_superuser:
        print(f"\n🔧 Setting admin privileges...")
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"✅ Admin privileges granted!")
        print(f"   - is_staff: {user.is_staff}")
        print(f"   - is_superuser: {user.is_superuser}")
    else:
        print(f"\n✅ User already has admin privileges!")
        
except User.DoesNotExist:
    print(f"❌ User not found: ramillamichhane@gmail.com")
    print(f"\nAll users in database:")
    for u in User.objects.all()[:10]:
        print(f"   - {u.email} (is_staff: {u.is_staff}, is_superuser: {u.is_superuser})")
