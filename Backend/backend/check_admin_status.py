"""
Admin Status Verification Script
Run this to check if your admin user is properly configured

Usage:
    python manage.py shell < check_admin_status.py
    
Or manually:
    python manage.py shell
    >>> exec(open('check_admin_status.py').read())
"""

from django.contrib.auth import get_user_model
import sys

User = get_user_model()

print("\n" + "="*60)
print("🔐 ADMIN STATUS CHECK - SajiloFix Admin Dashboard")
print("="*60)

# Get all users with admin privileges
admin_users = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)

if not admin_users.exists():
    print("\n❌ NO ADMIN USERS FOUND!")
    print("\nTo create an admin user, run:")
    print("   python manage.py createsuperuser")
    sys.exit(1)

print(f"\n✅ Found {admin_users.count()} admin user(s):\n")

for user in admin_users:
    print(f"  👤 Email: {user.email}")
    print(f"     • is_staff: {user.is_staff}")
    print(f"     • is_superuser: {user.is_superuser}")
    print(f"     • Joined: {user.date_joined.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"     • Last login: {user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never'}")
    print()

# Get all users
all_users = User.objects.all()
print(f"\n📊 Total Users: {all_users.count()}")

# Count by type
find_users = all_users.filter(user_type='find').count()
offer_users = all_users.filter(user_type='offer').count()
no_type = all_users.filter(user_type__isnull=True).count()

print(f"   • Customers (find): {find_users}")
print(f"   • Providers (offer): {offer_users}")
print(f"   • No type assigned: {no_type}")

print("\n" + "="*60)
print("✅ Admin setup is valid!")
print("="*60)

print("\n📝 Next Steps:")
print("   1. Start backend: python manage.py runserver")
print("   2. Start frontend: npm run dev")
print("   3. Go to: http://localhost:5173/login")
print("   4. Click 'Admin' tab")
print("   5. Enter admin email and password")
print("   6. Access dashboard at: http://localhost:5173/admin")
print()
