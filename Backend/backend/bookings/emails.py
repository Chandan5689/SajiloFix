"""
Email notifications for booking-related events
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def send_booking_notification_to_provider(booking):
    """
    Send email notification to provider when a new booking is created
    
    Args:
        booking: Booking instance
    """
    try:
        provider_email = booking.provider.email
        if not provider_email:
            logger.warning(f"Provider {booking.provider.id} has no email address")
            print(f"⚠️ Warning: Provider {booking.provider.id} has no email")
            return False
        
        print(f"📧 Preparing to send email to provider: {provider_email}")
        
        # Get all services booked
        services_list = booking.booking_services.select_related('service', 'service__specialization').all()
        if not services_list:
            logger.warning(f"Booking {booking.id} has no booking_services")
            print(f"⚠️ Warning: No booking_services found for booking {booking.id}")
            # Still send email with just the primary service info
            service_names = [booking.service.title or booking.service.specialization.name or 'Service']
        else:
            service_names = [bs.service.title or bs.service.specialization.name or 'Service' for bs in services_list]
        
        print(f"📋 Services: {', '.join(service_names)}")
        
        subject = f'New Booking Request - {booking.customer.get_full_name() or booking.customer.email}'
        
        # Create HTML email body
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #16a34a; border-radius: 4px; }}
                .info-label {{ font-weight: bold; color: #374151; margin-bottom: 5px; }}
                .info-value {{ color: #1f2937; }}
                .services-list {{ background-color: #ecfdf5; padding: 15px; border-radius: 4px; margin: 10px 0; }}
                .service-item {{ padding: 8px 0; border-bottom: 1px solid #d1fae5; }}
                .service-item:last-child {{ border-bottom: none; }}
                .footer {{ background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
                .price {{ color: #16a34a; font-weight: bold; font-size: 18px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🔔 New Booking Request</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>{booking.provider.get_full_name() or 'Provider'}</strong>,</p>
                    <p>You have received a new booking request from <strong>{booking.customer.get_full_name() or booking.customer.email}</strong>.</p>
                    
                    <div class="info-box">
                        <div class="info-label">📅 Preferred Date & Time:</div>
                        <div class="info-value">{booking.preferred_date.strftime('%B %d, %Y')} at {booking.preferred_time.strftime('%I:%M %p')}</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">🛠️ Service{'' if len(service_names) == 1 else 's'} Requested:</div>
                        <div class="services-list">
                            {''.join([f'<div class="service-item">• {name}</div>' for name in service_names])}
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">💰 Quoted Price:</div>
                        <div class="price">Rs. {booking.quoted_price}</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">📍 Service Location:</div>
                        <div class="info-value">{booking.service_address}</div>
                    </div>
                    
                    {f'''<div class="info-box">
                        <div class="info-label">📝 Customer Note:</div>
                        <div class="info-value">{booking.description}</div>
                    </div>''' if booking.description else ''}
                    
                    <p style="margin-top: 30px; text-align: center;">
                        <strong>Please log in to your SajiloFix provider dashboard to accept or decline this booking.</strong>
                    </p>
                </div>
                <div class="footer">
                    <p>This is an automated message from SajiloFix. Please do not reply to this email.</p>
                    <p>© 2025 SajiloFix. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
New Booking Request

Hello {booking.provider.get_full_name() or 'Provider'},

You have received a new booking request from {booking.customer.get_full_name() or booking.customer.email}.

Preferred Date & Time: {booking.preferred_date.strftime('%B %d, %Y')} at {booking.preferred_time.strftime('%I:%M %p')}

Service{'s' if len(service_names) > 1 else ''} Requested:
{chr(10).join([f'• {name}' for name in service_names])}

Quoted Price: Rs. {booking.quoted_price}

Service Location: {booking.service_address}

{f'Customer Note: {booking.description}' if booking.description else ''}

Please log in to your SajiloFix provider dashboard to accept or decline this booking.

---
This is an automated message from SajiloFix.
© 2025 SajiloFix. All rights reserved.
        """
        
        print(f"📤 Sending email...")
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[provider_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Booking notification sent to provider {booking.provider.id} for booking {booking.id}")
        print(f"✅ Email successfully sent to provider {provider_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send booking notification to provider: {str(e)}")
        print(f"❌ Email failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False


def send_booking_acceptance_to_customer(booking):
    """
    Send email notification to customer when provider accepts their booking
    
    Args:
        booking: Booking instance
    """
    try:
        customer_email = booking.customer.email
        if not customer_email:
            logger.warning(f"Customer {booking.customer.id} has no email address")
            print(f"⚠️ Warning: Customer {booking.customer.id} has no email")
            return False
        
        print(f"📧 Preparing to send email to customer: {customer_email}")
        
        # Get all services booked
        services_list = booking.booking_services.select_related('service', 'service__specialization').all()
        if not services_list:
            logger.warning(f"Booking {booking.id} has no booking_services")
            print(f"⚠️ Warning: No booking_services found for booking {booking.id}")
            service_names = [booking.service.title or booking.service.specialization.name or 'Service']
        else:
            service_names = [bs.service.title or bs.service.specialization.name or 'Service' for bs in services_list]
        
        print(f"📋 Services: {', '.join(service_names)}")
        
        subject = f'Booking Accepted - {booking.provider.get_full_name() or "Provider"}'
        
        # Create HTML email body
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .success-badge {{ background-color: #d1fae5; color: #065f46; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; font-weight: bold; }}
                .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #16a34a; border-radius: 4px; }}
                .info-label {{ font-weight: bold; color: #374151; margin-bottom: 5px; }}
                .info-value {{ color: #1f2937; }}
                .services-list {{ background-color: #ecfdf5; padding: 15px; border-radius: 4px; margin: 10px 0; }}
                .service-item {{ padding: 8px 0; border-bottom: 1px solid #d1fae5; }}
                .service-item:last-child {{ border-bottom: none; }}
                .footer {{ background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }}
                .price {{ color: #16a34a; font-weight: bold; font-size: 18px; }}
                .provider-box {{ background-color: #eff6ff; padding: 15px; border-radius: 4px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">✅ Booking Confirmed!</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>{booking.customer.get_full_name() or 'Customer'}</strong>,</p>
                    
                    <div style="text-align: center;">
                        <span class="success-badge">🎉 Your booking has been accepted!</span>
                    </div>
                    
                    <p>Great news! <strong>{booking.provider.get_full_name() or 'The provider'}</strong> has accepted your booking request.</p>
                    
                    <div class="provider-box">
                        <div class="info-label">👨‍🔧 Service Provider:</div>
                        <div class="info-value" style="font-size: 16px; margin-top: 5px;">
                            {booking.provider.get_full_name() or booking.provider.email}
                        </div>
                        {f'''<div class="info-value" style="margin-top: 5px;">
                            📞 {booking.provider.phone_number}
                        </div>''' if booking.provider.phone_number else ''}
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">📅 Scheduled Date & Time:</div>
                        <div class="info-value">
                            {booking.scheduled_date.strftime('%B %d, %Y') if booking.scheduled_date else booking.preferred_date.strftime('%B %d, %Y')} 
                            at 
                            {booking.scheduled_time.strftime('%I:%M %p') if booking.scheduled_time else booking.preferred_time.strftime('%I:%M %p')}
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">🛠️ Service{'' if len(service_names) == 1 else 's'}:</div>
                        <div class="services-list">
                            {''.join([f'<div class="service-item">• {name}</div>' for name in service_names])}
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">💰 Total Price:</div>
                        <div class="price">Rs. {booking.quoted_price}</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">📍 Service Location:</div>
                        <div class="info-value">{booking.service_address}</div>
                    </div>
                    
                    <p style="margin-top: 30px; text-align: center; background-color: #fef3c7; padding: 15px; border-radius: 4px;">
                        <strong>💡 Tip:</strong> The provider will contact you if any schedule adjustments are needed.
                    </p>
                </div>
                <div class="footer">
                    <p>Track your booking status in your SajiloFix dashboard.</p>
                    <p>This is an automated message from SajiloFix. Please do not reply to this email.</p>
                    <p>© 2025 SajiloFix. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
Booking Confirmed!

Hello {booking.customer.get_full_name() or 'Customer'},

Great news! Your booking has been accepted by {booking.provider.get_full_name() or 'the provider'}.

Service Provider: {booking.provider.get_full_name() or booking.provider.email}
{f'Phone: {booking.provider.phone_number}' if booking.provider.phone_number else ''}

Scheduled Date & Time: {booking.scheduled_date.strftime('%B %d, %Y') if booking.scheduled_date else booking.preferred_date.strftime('%B %d, %Y')} at {booking.scheduled_time.strftime('%I:%M %p') if booking.scheduled_time else booking.preferred_time.strftime('%I:%M %p')}

Service{'s' if len(service_names) > 1 else ''}:
{chr(10).join([f'• {name}' for name in service_names])}

Total Price: Rs. {booking.quoted_price}

Service Location: {booking.service_address}

The provider will contact you if any schedule adjustments are needed.

Track your booking status in your SajiloFix dashboard.

---
This is an automated message from SajiloFix.
© 2025 SajiloFix. All rights reserved.
        """
        
        print(f"📤 Sending email...")
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[customer_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Booking acceptance notification sent to customer {booking.customer.id} for booking {booking.id}")
        print(f"✅ Email successfully sent to customer {customer_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send booking acceptance notification to customer: {str(e)}")
        print(f"❌ Email failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False


def send_booking_expiry_notification(booking):
    """
    Send email notifications to both customer and provider when a booking
    auto-expires because the provider did not respond before the deadline.
    
    Args:
        booking: Booking instance (status should already be 'expired')
    """
    # --- Email to Customer ---
    try:
        customer_email = booking.customer.email
        if not customer_email:
            logger.warning(f"Customer {booking.customer.id} has no email for expiry notification")
        else:
            services_list = booking.booking_services.select_related('service', 'service__specialization').all()
            if services_list:
                service_names = [bs.service.title or bs.service.specialization.name or 'Service' for bs in services_list]
            else:
                service_names = [booking.service.title or booking.service.specialization.name or 'Service']

            subject = f'Booking Expired - Provider Did Not Respond (Booking #{booking.id})'

            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                    .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 4px; }}
                    .info-label {{ font-weight: bold; color: #374151; margin-bottom: 5px; }}
                    .info-value {{ color: #1f2937; }}
                    .footer {{ background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }}
                    .suggestion {{ background-color: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">⏰ Booking Expired</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>{booking.customer.get_full_name() or 'Customer'}</strong>,</p>
                        <p>Unfortunately, your booking request has <strong>expired</strong> because the provider 
                        (<strong>{booking.provider.get_full_name() or booking.provider.email}</strong>) did not respond 
                        within the required timeframe.</p>
                        
                        <div class="info-box">
                            <div class="info-label">🛠️ Service{'s' if len(service_names) > 1 else ''} Requested:</div>
                            <div class="info-value">{'<br>'.join([f'• {name}' for name in service_names])}</div>
                        </div>
                        
                        <div class="info-box">
                            <div class="info-label">📅 Preferred Date:</div>
                            <div class="info-value">{booking.preferred_date.strftime('%B %d, %Y')} at {booking.preferred_time.strftime('%I:%M %p')}</div>
                        </div>

                        <div class="info-box">
                            <div class="info-label">💰 Quoted Price:</div>
                            <div class="info-value">Rs. {booking.quoted_price}</div>
                        </div>
                        
                        <div class="suggestion">
                            <strong>💡 What to do next?</strong><br>
                            You can search for other available providers and create a new booking from your SajiloFix dashboard.
                        </div>
                    </div>
                    <div class="footer">
                        <p>We apologize for the inconvenience. This is an automated message from SajiloFix.</p>
                        <p>© 2025 SajiloFix. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            plain_message = f"""
Booking Expired

Hello {booking.customer.get_full_name() or 'Customer'},

Unfortunately, your booking request (#{booking.id}) has expired because the provider ({booking.provider.get_full_name() or booking.provider.email}) did not respond within the required timeframe.

Service{'s' if len(service_names) > 1 else ''}: {', '.join(service_names)}
Preferred Date: {booking.preferred_date.strftime('%B %d, %Y')} at {booking.preferred_time.strftime('%I:%M %p')}
Quoted Price: Rs. {booking.quoted_price}

You can search for other available providers and create a new booking from your SajiloFix dashboard.

---
This is an automated message from SajiloFix.
© 2025 SajiloFix. All rights reserved.
            """

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[customer_email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Expiry notification sent to customer {booking.customer.id} for booking {booking.id}")
            print(f"✅ Expiry email sent to customer {customer_email}")

    except Exception as e:
        logger.error(f"Failed to send expiry notification to customer: {str(e)}")
        print(f"❌ Customer expiry email failed: {str(e)}")

    # --- Email to Provider ---
    try:
        provider_email = booking.provider.email
        if not provider_email:
            logger.warning(f"Provider {booking.provider.id} has no email for expiry notification")
        else:
            subject = f'Booking #{booking.id} Expired - You Did Not Respond in Time'

            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                    .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; border-radius: 4px; }}
                    .info-label {{ font-weight: bold; color: #374151; margin-bottom: 5px; }}
                    .info-value {{ color: #1f2937; }}
                    .footer {{ background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }}
                    .warning {{ background-color: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">⚠️ Booking Expired</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>{booking.provider.get_full_name() or 'Provider'}</strong>,</p>
                        <p>Booking <strong>#{booking.id}</strong> from <strong>{booking.customer.get_full_name() or booking.customer.email}</strong> 
                        has been <strong>automatically expired</strong> because you did not accept or decline it before the response deadline.</p>
                        
                        <div class="info-box">
                            <div class="info-label">📅 Requested Date:</div>
                            <div class="info-value">{booking.preferred_date.strftime('%B %d, %Y')} at {booking.preferred_time.strftime('%I:%M %p')}</div>
                        </div>

                        <div class="info-box">
                            <div class="info-label">💰 Quoted Price:</div>
                            <div class="info-value">Rs. {booking.quoted_price}</div>
                        </div>
                        
                        <div class="warning">
                            <strong>⏰ Tip:</strong> Respond to booking requests promptly to avoid losing customers. 
                            Bookings that are not accepted before their deadline are automatically expired.
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from SajiloFix. Please do not reply to this email.</p>
                        <p>© 2025 SajiloFix. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            plain_message = f"""
Booking Expired

Hello {booking.provider.get_full_name() or 'Provider'},

Booking #{booking.id} from {booking.customer.get_full_name() or booking.customer.email} has been automatically expired because you did not respond before the deadline.

Requested Date: {booking.preferred_date.strftime('%B %d, %Y')} at {booking.preferred_time.strftime('%I:%M %p')}
Quoted Price: Rs. {booking.quoted_price}

Please respond to future booking requests promptly.

---
This is an automated message from SajiloFix.
© 2025 SajiloFix. All rights reserved.
            """

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[provider_email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Expiry notification sent to provider {booking.provider.id} for booking {booking.id}")
            print(f"✅ Expiry email sent to provider {provider_email}")

    except Exception as e:
        logger.error(f"Failed to send expiry notification to provider: {str(e)}")
        print(f"❌ Provider expiry email failed: {str(e)}")
