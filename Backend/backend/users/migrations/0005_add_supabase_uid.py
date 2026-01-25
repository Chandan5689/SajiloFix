# Generated migration for cleaning up deprecated Clerk fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_populate_address_from_location'),
    ]

    operations = [
        # Add new Supabase UID field to store sub claim
        migrations.AddField(
            model_name='user',
            name='supabase_uid',
            field=models.CharField(
                max_length=255,
                blank=True,
                null=True,
                unique=True,
                help_text='Supabase user UUID (stored from JWT sub claim)',
            ),
        ),
        # Note: clerk_user_id and firebase_phone_uid can be removed in a future migration
        # after confirming no code references them
    ]
