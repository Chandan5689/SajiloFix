"""
Supabase Storage Migration Script

This script migrates all existing local files to Supabase Storage.
Files include:
- Profile pictures
- Citizenship documents (front and back)
- Booking images (before, during, after)

Usage:
    python migration_script.py

The script will:
1. Find all users with local profile pictures and upload them to Supabase
2. Find all users with citizenship documents and upload them to Supabase
3. Find all booking images and upload them to Supabase
4. Update database records with Supabase URLs
5. Show progress and summary statistics
"""

import os
import sys
import django
from pathlib import Path
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.files.base import ContentFile
from users.models import User
from bookings.models import BookingImage
from supabase import create_client
from decouple import config

# Get Supabase credentials
SUPABASE_URL = config('SUPABASE_URL', default='')
# Prefer service role if available; fallback to SUPABASE_KEY, then ANON
SUPABASE_KEY = (
    config('SUPABASE_SERVICE_ROLE_KEY', default='')
    or config('SUPABASE_KEY', default='')
    or config('SUPABASE_ANON_KEY', default='')
)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: SUPABASE_URL and a Supabase key must be set in .env file (service role preferred)")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'


def print_header(text):
    """Print a formatted header"""
    print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}\n")


def print_success(text):
    """Print success message"""
    print(f"{GREEN}✓{RESET} {text}")


def print_error(text):
    """Print error message"""
    print(f"{RED}✗{RESET} {text}")


def print_warning(text):
    """Print warning message"""
    print(f"{YELLOW}⚠{RESET}  {text}")


def print_info(text):
    """Print info message"""
    print(f"{BLUE}ℹ{RESET}  {text}")


def migrate_profile_pictures():
    """
    Migrate profile pictures from local storage to Supabase.
    
    Process:
    1. Find all users with profile pictures
    2. Read each file from local storage
    3. Upload to Supabase profile_pictures bucket
    4. Update database record with Supabase URL
    """
    print_header("📸 Profile Pictures Migration")
    
    users = User.objects.filter(profile_picture__isnull=False).exclude(profile_picture='')
    total = users.count()
    migrated = 0
    failed = 0
    skipped = 0
    
    print(f"Found {BOLD}{total}{RESET} users with profile pictures\n")
    
    if total == 0:
        print_info("No profile pictures to migrate")
        return migrated, failed
    
    for idx, user in enumerate(users, 1):
        try:
            if not user.profile_picture:
                skipped += 1
                continue
            
            # Check if already migrated (URL starts with http)
            if str(user.profile_picture).startswith('http'):
                print_info(f"[{idx}/{total}] Already migrated: {user.username}")
                skipped += 1
                continue
            
            # Read file from local storage
            profile_pic_path = user.profile_picture.path
            if not os.path.exists(profile_pic_path):
                print_warning(f"[{idx}/{total}] File not found: {profile_pic_path}")
                failed += 1
                continue
            
            with open(profile_pic_path, 'rb') as f:
                file_content = f.read()
            
            # Get file extension
            ext = os.path.splitext(profile_pic_path)[1] or '.jpg'
            file_name = f"profile_{user.id}{ext}"
            
            # Upload to Supabase
            supabase.storage.from_('profile_pictures').upload(
                file_name,
                file_content,
                {"upsert": "true"}
            )
            
            # Update the model with Supabase URL
            supabase_url = f"profile_pictures/{file_name}"
            user.profile_picture = supabase_url
            user.save(update_fields=['profile_picture'])
            migrated += 1
            print_success(f"[{idx}/{total}] {user.username}")
            
        except Exception as e:
            failed += 1
            print_error(f"[{idx}/{total}] {user.username}: {str(e)}")
    
    print(f"\n{BOLD}Profile Pictures Summary:{RESET}")
    print(f"   Total:     {total}")
    print(f"   Migrated:  {GREEN}{migrated}{RESET}")
    print(f"   Failed:    {RED}{failed}{RESET}")
    print(f"   Skipped:   {YELLOW}{skipped}{RESET}")
    
    return migrated, failed


def migrate_citizenship_documents():
    """
    Migrate citizenship documents (front and back) to Supabase.
    
    Process:
    1. Find all users with citizenship documents
    2. Upload front and back images separately
    3. Update database records with Supabase URLs
    """
    print_header("🆔 Citizenship Documents Migration")
    
    users = User.objects.filter(
        citizenship_front__isnull=False
    ).exclude(citizenship_front='')
    
    total = users.count()
    migrated = 0
    failed = 0
    skipped = 0
    
    print(f"Found {BOLD}{total}{RESET} users with citizenship documents\n")
    
    if total == 0:
        print_info("No citizenship documents to migrate")
        return migrated, failed
    
    for idx, user in enumerate(users, 1):
        try:
            front_migrated = False
            back_migrated = False
            
            # Migrate front side
            if user.citizenship_front and not str(user.citizenship_front).startswith('http'):
                front_path = user.citizenship_front.path
                if os.path.exists(front_path):
                    with open(front_path, 'rb') as f:
                        file_content = f.read()
                    
                    ext = os.path.splitext(front_path)[1] or '.jpg'
                    file_name = f"citizenship_front_{user.id}{ext}"
                    supabase.storage.from_('citizenship').upload(
                        file_name,
                        file_content,
                        {"upsert": "true"}
                    )
                    user.citizenship_front = f'citizenship/{file_name}'
                    front_migrated = True
                else:
                    print_warning(f"[{idx}/{total}] Front file not found for: {user.username}")
            else:
                front_migrated = True  # Already migrated or empty
            
            # Migrate back side
            if user.citizenship_back and not str(user.citizenship_back).startswith('http'):
                back_path = user.citizenship_back.path
                if os.path.exists(back_path):
                    with open(back_path, 'rb') as f:
                        file_content = f.read()
                    
                    ext = os.path.splitext(back_path)[1] or '.jpg'
                    file_name = f"citizenship_back_{user.id}{ext}"
                    supabase.storage.from_('citizenship').upload(
                        file_name,
                        file_content,
                        {"upsert": "true"}
                    )
                    user.citizenship_back = f'citizenship/{file_name}'
                    back_migrated = True
                else:
                    print_warning(f"[{idx}/{total}] Back file not found for: {user.username}")
            else:
                back_migrated = True  # Already migrated or empty
            
            if front_migrated or back_migrated:
                user.save(update_fields=['citizenship_front', 'citizenship_back'])
                migrated += 1
                print_success(f"[{idx}/{total}] {user.username}")
            else:
                failed += 1
            
        except Exception as e:
            failed += 1
            print_error(f"[{idx}/{total}] {user.username}: {str(e)}")
    
    print(f"\n{BOLD}Citizenship Documents Summary:{RESET}")
    print(f"   Total:     {total}")
    print(f"   Migrated:  {GREEN}{migrated}{RESET}")
    print(f"   Failed:    {RED}{failed}{RESET}")
    print(f"   Skipped:   {YELLOW}{skipped}{RESET}")
    
    return migrated, failed


def migrate_booking_images():
    """
    Migrate booking images from local storage to Supabase.
    
    Process:
    1. Find all booking images
    2. Read each image from local storage
    3. Upload to Supabase bookings bucket
    4. Update database record with Supabase URL
    """
    print_header("📷 Booking Images Migration")
    
    images = BookingImage.objects.all()
    total = images.count()
    migrated = 0
    failed = 0
    skipped = 0
    
    print(f"Found {BOLD}{total}{RESET} booking images\n")
    
    if total == 0:
        print_info("No booking images to migrate")
        return migrated, failed
    
    for idx, booking_img in enumerate(images, 1):
        try:
            if not booking_img.image:
                skipped += 1
                continue
            
            # Check if already migrated
            if str(booking_img.image).startswith('http'):
                print_info(f"[{idx}/{total}] Already migrated: Booking {booking_img.booking.id}")
                skipped += 1
                continue
            
            # Read file from local storage
            image_path = booking_img.image.path
            if not os.path.exists(image_path):
                print_warning(f"[{idx}/{total}] File not found: {image_path}")
                failed += 1
                continue
            
            with open(image_path, 'rb') as f:
                file_content = f.read()
            
            # Create unique file name with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
            ext = os.path.splitext(image_path)[1] or '.jpg'
            file_name = f"{booking_img.image_type}_{timestamp}{ext}"
            
            # Upload to Supabase
            supabase.storage.from_('bookings').upload(
                f"booking_{booking_img.booking.id}/{file_name}",
                file_content,
                {"upsert": "true"}
            )
            
            # Update the model with Supabase URL
            supabase_url = f"bookings/booking_{booking_img.booking.id}/{file_name}"
            booking_img.image = supabase_url
            booking_img.save(update_fields=['image'])
            migrated += 1
            print_success(f"[{idx}/{total}] Booking {booking_img.booking.id} ({booking_img.image_type})")
            
        except Exception as e:
            failed += 1
            print_error(f"[{idx}/{total}] Booking Image {booking_img.id}: {str(e)}")
    
    print(f"\n{BOLD}Booking Images Summary:{RESET}")
    print(f"   Total:     {total}")
    print(f"   Migrated:  {GREEN}{migrated}{RESET}")
    print(f"   Failed:    {RED}{failed}{RESET}")
    print(f"   Skipped:   {YELLOW}{skipped}{RESET}")
    
    return migrated, failed


def main():
    """Main migration function"""
    print_header("🚀 Supabase Storage Migration Started")
    print_info(f"Supabase URL: {SUPABASE_URL}")
    print_info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Run migrations
    profile_migrated, profile_failed = migrate_profile_pictures()
    citizenship_migrated, citizenship_failed = migrate_citizenship_documents()
    booking_migrated, booking_failed = migrate_booking_images()
    
    # Summary
    total_migrated = profile_migrated + citizenship_migrated + booking_migrated
    total_failed = profile_failed + citizenship_failed + booking_failed
    
    print_header("✅ Migration Complete!")
    
    print(f"{BOLD}Overall Statistics:{RESET}")
    print(f"   Total Migrated:  {GREEN}{total_migrated}{RESET}")
    print(f"   Total Failed:    {RED}{total_failed}{RESET}")
    
    if total_failed == 0:
        print(f"\n{GREEN}{BOLD}All files migrated successfully!{RESET}")
    else:
        print(f"\n{YELLOW}{BOLD}Migration completed with {total_failed} failures.{RESET}")
        print(f"{YELLOW}Please review the errors above and re-run the migration.{RESET}")
    
    print(f"\n{BOLD}Next Steps:{RESET}")
    print(f"1. Verify images are visible in Supabase Dashboard")
    print(f"2. Test image display in your application")
    print(f"3. Backup and delete local files (optional):")
    print(f"   Remove-Item -Path 'Backend/backend/media/*' -Recurse -Force")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{RED}Migration interrupted by user{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}Fatal error: {str(e)}{RESET}")
        sys.exit(1)
