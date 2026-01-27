"""
Test email configuration
Run this to verify your email settings are working
"""
from django.core.mail import send_mail
from django.conf import settings

print("=" * 60)
print("TESTING EMAIL CONFIGURATION")
print("=" * 60)

print(f"\n📧 Email Settings:")
print(f"  Backend: {settings.EMAIL_BACKEND}")
print(f"  Host: {settings.EMAIL_HOST}")
print(f"  Port: {settings.EMAIL_PORT}")
print(f"  TLS: {settings.EMAIL_USE_TLS}")
print(f"  From: {settings.DEFAULT_FROM_EMAIL}")
print(f"  User: {settings.EMAIL_HOST_USER}")
print(f"  Password: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")

print(f"\n📤 Sending test email...")

try:
    send_mail(
        subject='SajiloFix Test Email - Configuration Working!',
        message='This is a test email from SajiloFix.\n\nIf you receive this, your email configuration is working correctly!',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.EMAIL_HOST_USER],  # Send to yourself
        html_message='''
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #f0fdf4; padding: 30px; border-radius: 8px; border: 2px solid #16a34a;">
                <h1 style="color: #16a34a; text-align: center;">✅ Email Configuration Working!</h1>
                <p style="font-size: 16px; color: #374151;">This is a test email from SajiloFix.</p>
                <p style="font-size: 16px; color: #374151;">If you're seeing this, your email configuration is set up correctly and you're ready to send booking notifications!</p>
                <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #16a34a; border-radius: 4px;">
                    <p style="margin: 0; color: #059669; font-weight: bold;">✨ Next Steps:</p>
                    <ul style="color: #374151;">
                        <li>Create a booking from the frontend</li>
                        <li>Provider will receive email notification</li>
                        <li>Accept the booking as provider</li>
                        <li>Customer will receive confirmation email</li>
                    </ul>
                </div>
                <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
                    © 2025 SajiloFix. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        ''',
        fail_silently=False,
    )
    print(f"✅ SUCCESS! Test email sent to {settings.EMAIL_HOST_USER}")
    print(f"\n📬 Check your inbox: {settings.EMAIL_HOST_USER}")
    print(f"   (Check spam folder if not in inbox)")
    
except Exception as e:
    print(f"❌ FAILED! Error sending email:")
    print(f"   {str(e)}")
    import traceback
    print("\nFull error details:")
    print(traceback.format_exc())
    
print("\n" + "=" * 60)
