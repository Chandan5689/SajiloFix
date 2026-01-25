from django.db import migrations

def populate_address_from_location(apps, schema_editor):
    """
    Populate address field from location field for users who have location but empty address.
    This ensures pre-fill functionality works correctly on the booking page.
    """
    User = apps.get_model('users', 'User')
    
    # Get all users with location but no address
    users_to_update = User.objects.filter(
        location__isnull=False,
        location__gt='',  # location is not empty
        address__isnull=True  # address is null
    ) | User.objects.filter(
        location__isnull=False,
        location__gt='',
        address__exact=''  # address is empty string
    )
    
    count = 0
    for user in users_to_update:
        user.address = user.location
        user.save(update_fields=['address'])
        count += 1
    
    print(f"✓ Updated {count} users - populated address field from location")


def reverse_populate_address(apps, schema_editor):
    """
    Reverse migration: clear address fields that were populated from location.
    Only clears if address matches location (to avoid data loss).
    """
    User = apps.get_model('users', 'User')
    
    # Find users where address equals location (likely populated by this migration)
    users_to_revert = User.objects.filter(address__isnull=False, location__isnull=False).exclude(address='')
    
    count = 0
    for user in users_to_revert:
        if user.address == user.location:
            user.address = ''
            user.save(update_fields=['address'])
            count += 1
    
    print(f"✓ Reverted {count} users - cleared address field")


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_user_citizenship_number'),
    ]

    operations = [
        migrations.RunPython(populate_address_from_location, reverse_populate_address),
    ]
