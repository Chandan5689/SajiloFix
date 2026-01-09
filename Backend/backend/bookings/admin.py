from django.contrib import admin
from .models import Service, Booking, BookingService, BookingImage, Review


class BookingServiceInline(admin.TabularInline):
	"""Inline admin for viewing/managing services in a booking"""
	model = BookingService
	extra = 1
	fields = ('service', 'price_at_booking', 'price_type_at_booking', 'minimum_charge_at_booking', 'estimated_duration_at_booking', 'order')
	readonly_fields = ('service', 'price_at_booking', 'price_type_at_booking', 'minimum_charge_at_booking', 'estimated_duration_at_booking')
	ordering = ('order',)


class BookingImageInline(admin.TabularInline):
	"""Inline admin for booking images"""
	model = BookingImage
	extra = 0
	fields = ('image_type', 'image', 'uploaded_at')
	readonly_fields = ('uploaded_at',)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
	"""Admin for Service model"""
	list_display = ('title', 'provider', 'specialization', 'base_price', 'price_type', 'created_at')
	list_filter = ('price_type', 'specialization', 'created_at', 'provider__user_type')
	search_fields = ('title', 'provider__first_name', 'provider__last_name', 'specialization__name')
	readonly_fields = ('created_at', 'updated_at')
	fieldsets = (
		('Provider & Specialization', {
			'fields': ('provider', 'specialization')
		}),
		('Service Details', {
			'fields': ('title', 'description')
		}),
		('Pricing', {
			'fields': ('base_price', 'price_type', 'minimum_charge')
		}),
		('Timing', {
			'fields': ('estimated_duration', 'service_radius')
		}),
		('Status & Timestamps', {
			'fields': ('is_active', 'created_at', 'updated_at'),
			'classes': ('collapse',)
		}),
	)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
	"""Admin for Booking model with inline services"""
	list_display = ('id', 'customer_display', 'provider_display', 'service_count', 'status', 'preferred_date', 'created_at')
	list_filter = ('status', 'preferred_date', 'created_at', 'provider__user_type')
	search_fields = ('id', 'customer__first_name', 'customer__last_name', 'customer__email', 
					 'provider__first_name', 'provider__last_name', 'provider__email')
	readonly_fields = ('created_at', 'updated_at', 'cancelled_at', 'service_count', 'total_price')
	inlines = [BookingServiceInline, BookingImageInline]
    
	fieldsets = (
		('Booking Info', {
			'fields': ('id', 'status', 'created_at', 'updated_at')
		}),
		('Customer & Provider', {
			'fields': ('customer', 'provider')
		}),
		('Services', {
			'fields': ('service', 'service_count', 'total_price'),
			'description': 'Primary service field (legacy). View/add services using "Booking Services" section below.'
		}),
		('Schedule', {
			'fields': ('preferred_date', 'preferred_time', 'scheduled_date', 'scheduled_time')
		}),
		('Service Location', {
			'fields': ('service_address', 'service_city', 'service_district', 'latitude', 'longitude')
		}),
		('Pricing & Payment', {
			'fields': ('estimated_price', 'final_price', 'paid_amount', 'payment_status', 'payment_method')
		}),
		('Completion', {
			'fields': ('estimated_completion_date', 'actual_completion_date'),
			'classes': ('collapse',)
		}),
		('Customer Approval', {
			'fields': ('customer_approval', 'approval_note'),
			'classes': ('collapse',)
		}),
		('Cancellation', {
			'fields': ('cancelled_at', 'cancelled_by', 'cancellation_reason'),
			'classes': ('collapse',)
		}),
		('Provider Notes', {
			'fields': ('provider_notes',),
			'classes': ('collapse',)
		}),
	)
    
	def customer_display(self, obj):
		"""Display customer name"""
		return f"{obj.customer.get_full_name()} ({obj.customer.email})"
	customer_display.short_description = 'Customer'
    
	def provider_display(self, obj):
		"""Display provider name"""
		return f"{obj.provider.get_full_name()} ({obj.provider.email})"
	provider_display.short_description = 'Provider'
    
	def service_count(self, obj):
		"""Display count of services in booking"""
		count = obj.booking_services.count()
		return f"{count} service(s)" if count > 0 else "No services added"
	service_count.short_description = 'Services'
    
	def total_price(self, obj):
		"""Display total price of all services"""
		total = sum(float(bs.price_at_booking) for bs in obj.booking_services.all())
		return f"NPR {total:,.2f}" if total > 0 else "—"
	total_price.short_description = 'Total Service Price'


@admin.register(BookingService)
class BookingServiceAdmin(admin.ModelAdmin):
	"""Admin for BookingService model"""
	list_display = ('booking_id', 'service_title', 'price_at_booking', 'price_type_at_booking', 'order', 'created_at')
	list_filter = ('price_type_at_booking', 'created_at', 'service__specialization')
	search_fields = ('booking__id', 'service__title', 'service__provider__first_name', 'service__provider__last_name')
	readonly_fields = ('created_at', 'updated_at')
	ordering = ('booking', 'order')
    
	fieldsets = (
		('Booking & Service', {
			'fields': ('booking', 'service', 'order')
		}),
		('Pricing Snapshot', {
			'fields': ('price_at_booking', 'price_type_at_booking', 'minimum_charge_at_booking')
		}),
		('Duration', {
			'fields': ('estimated_duration_at_booking',)
		}),
		('Timestamps', {
			'fields': ('created_at', 'updated_at'),
			'classes': ('collapse',)
		}),
	)
    
	def booking_id(self, obj):
		"""Display booking ID as clickable link"""
		return f"Booking #{obj.booking.id}"
	booking_id.short_description = 'Booking'
    
	def service_title(self, obj):
		"""Display service title"""
		return obj.service.title
	service_title.short_description = 'Service'


@admin.register(BookingImage)
class BookingImageAdmin(admin.ModelAdmin):
	"""Admin for BookingImage model"""
	list_display = ('booking_id', 'image_type', 'uploaded_at', 'image_preview')
	list_filter = ('image_type', 'uploaded_at')
	search_fields = ('booking__id', 'booking__customer__first_name', 'booking__customer__last_name')
	readonly_fields = ('uploaded_at', 'image_preview')
	ordering = ('-uploaded_at',)
    
	def booking_id(self, obj):
		"""Display booking ID"""
		return f"Booking #{obj.booking.id}"
	booking_id.short_description = 'Booking'
    
	def image_preview(self, obj):
		"""Display image preview"""
		if obj.image:
			return f'<img src="{obj.image.url}" width="200" height="auto" />'
		return '—'
	image_preview.allow_tags = True
	image_preview.short_description = 'Preview'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
	"""Admin for Review model"""
	list_display = ('booking_id', 'reviewer_display', 'rating', 'created_at')
	list_filter = ('rating', 'created_at', 'booking__provider')
	search_fields = ('booking__id', 'reviewer__first_name', 'reviewer__last_name', 'comment')
	readonly_fields = ('created_at', 'updated_at')
    
	def booking_id(self, obj):
		"""Display booking ID"""
		return f"Booking #{obj.booking.id}"
	booking_id.short_description = 'Booking'
    
	def reviewer_display(self, obj):
		"""Display reviewer name"""
		return f"{obj.reviewer.get_full_name()}"
	reviewer_display.short_description = 'Reviewer'
