import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RatingBadge from "../../components/RatingBadge";
import api from "../../api/axios";
import bookingsService from "../../services/bookingsService";

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State variables
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true); // initial page load for provider details
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('1');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [serviceCity, setServiceCity] = useState('');
  const [serviceDistrict, setServiceDistrict] = useState('');
  const [serviceLat, setServiceLat] = useState(null);
  const [serviceLng, setServiceLng] = useState(null);
  const [description, setDescription] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [providerAvailability, setProviderAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [providerLat, setProviderLat] = useState(null);
  const [providerLng, setProviderLng] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const serviceMarkerRef = useRef(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  const minDate = new Date().toISOString().split('T')[0];

  // Fetch provider details + availability (once per provider)
  useEffect(() => {
    let isMounted = true;
    const fetchProvider = async () => {
      try {
        setLoading(true);
        setError(null);
        const [providerRes, availabilityRes] = await Promise.all([
          api.get(`/bookings/providers/${id}/`),
          api.get(`/bookings/providers/${id}/availability/`)
        ]);

        if (!isMounted) return;

        const providerData = providerRes.data;
        setProvider(providerData);
        setProviderLat(providerData.latitude);
        setProviderLng(providerData.longitude);
        setServiceCity(providerData.city || '');
        setServiceDistrict(providerData.district || '');
        setProviderAvailability(availabilityRes.data || null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching provider data:', err);
        const status = err?.response?.status;
        if (status === 404) {
          setError('Provider not found');
        } else {
          setError(err.message || 'Failed to load provider details');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProvider();
    return () => { isMounted = false; };
  }, [id]);

  // Fetch booked slots when date changes (non-blocking for whole page)
  useEffect(() => {
    let isMounted = true;
    const fetchBookedSlots = async () => {
      if (!preferredDate) {
        setBookedSlots([]);
        return;
      }
      try {
        setLoadingAvailability(true);
        const res = await api.get(`/bookings/providers/${id}/booked-slots/`, { params: { date: preferredDate } });
        if (isMounted) {
          setBookedSlots(res.data?.booked_slots || []);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching booked slots:', err);
        // Keep existing slots; surface inline message via error state
        setError(err.message || 'Failed to load availability');
      } finally {
        if (isMounted) setLoadingAvailability(false);
      }
    };

    fetchBookedSlots();
    return () => { isMounted = false; };
  }, [id, preferredDate]);

  // Generate hourly time slots (8 AM to 5 PM) with 24h value for backend
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      const ampm = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      const label = `${String(displayHour).padStart(2, '0')}:00 ${ampm}`;
      const value = `${String(hour).padStart(2, '0')}:00:00`; // HH:MM:SS
      slots.push({ label, value });
    }
    return slots;
  };

  // Get day name from date string
  const getDayName = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString + 'T00:00:00');
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[date.getDay()];
  };

  // Simple geocoding via OpenStreetMap Nominatim
  const geocodeAddress = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=np&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Failed to geocode');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
    }
    return null;
  };

  // Haversine distance in kilometers
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim()) {
      setMapSearchError('Enter a location to search');
      return;
    }
    try {
      setMapSearchLoading(true);
      setMapSearchError(null);
      const contextualQuery = [mapSearchQuery, serviceCity, serviceDistrict, 'Nepal']
        .filter(Boolean)
        .join(', ');
      const coords = await geocodeAddress(contextualQuery);
      if (!coords) {
        setMapSearchError('No results found. Try a more specific address.');
        return;
      }
      setServiceLat(coords.lat);
      setServiceLng(coords.lng);
    } catch (err) {
      console.error('Map search failed', err);
      setMapSearchError('Failed to search location');
    } finally {
      setMapSearchLoading(false);
    }
  };

  const validateStep = (step) => {
    // Clear previous error
    setError(null);
    if (step === 1) {
      if (!selectedServiceId) {
        setError("Please select a service");
        return false;
      }
      if (!preferredDate || !preferredTime) {
        setError("Please select preferred date and time");
        return false;
      }
      const dayCheck = isProviderAvailableOnDay(preferredDate);
      if (!dayCheck.available) {
        setError(dayCheck.message);
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!fullName.trim()) {
        setError("Please enter full name");
        return false;
      }
      const phoneRegex = /^(97|98)\d{8}$/;
      if (!phoneRegex.test(phone)) {
        setError("Enter a valid Nepal mobile number (e.g., 9812345678)");
        return false;
      }
      if (!email.trim()) {
        setError("Please enter email");
        return false;
      }
      if (!address || address.trim().length < 5) {
        setError("Please enter a valid service address");
        return false;
      }
      if (!serviceCity.trim()) {
        setError("Please enter service city");
        return false;
      }
      if (selectedService?.service_radius && (serviceLat == null || serviceLng == null)) {
        setError("Please locate the service address on the map to continue");
        return false;
      }
      if (selectedService?.service_radius && distanceKm != null && distanceKm > selectedService.service_radius) {
        setError("Selected location is outside the provider's service radius");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!description.trim()) {
        setError("Please describe the service you need");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleStepSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < 4) {
      if (!validateStep(currentStep)) return;
      setCurrentStep((prev) => prev + 1);
      return;
    }
    // Final submit
    await submitBooking();
  };

  // Clear inline errors when the user edits fields
  useEffect(() => {
    setError(null);
  }, [
    selectedServiceId,
    preferredDate,
    preferredTime,
    fullName,
    phone,
    email,
    address,
    serviceCity,
    serviceDistrict,
    description,
    specialInstructions,
    isEmergency
  ]);

  // Compute distance when coords available
  useEffect(() => {
    if (providerLat != null && providerLng != null && serviceLat != null && serviceLng != null) {
      setDistanceKm(haversineKm(providerLat, providerLng, serviceLat, serviceLng));
    } else {
      setDistanceKm(null);
    }
  }, [providerLat, providerLng, serviceLat, serviceLng]);

  // Initialize Leaflet map and handle clicks to pick location
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const defaultCenter = [27.7172, 85.3240]; // Kathmandu
    const center = serviceLat != null && serviceLng != null
      ? [serviceLat, serviceLng]
      : (providerLat != null && providerLng != null ? [providerLat, providerLng] : defaultCenter);

    const map = L.map(mapContainerRef.current).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add draggable marker for service location
    const marker = L.marker(center, { draggable: true }).addTo(map);
    serviceMarkerRef.current = marker;

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setServiceLat(pos.lat);
      setServiceLng(pos.lng);
    });

    // Click to set marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setServiceLat(lat);
      setServiceLng(lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      serviceMarkerRef.current = null;
    };
  }, [mapContainerRef, providerLat, providerLng, serviceLat, serviceLng]);

  // Update marker position and map view when service coords change
  useEffect(() => {
    if (mapInstanceRef.current && serviceMarkerRef.current && serviceLat != null && serviceLng != null) {
      serviceMarkerRef.current.setLatLng([serviceLat, serviceLng]);
      mapInstanceRef.current.setView([serviceLat, serviceLng], 14, { animate: true });
    }
  }, [serviceLat, serviceLng]);

  // Check if provider is available on a specific day of the week
  const isProviderAvailableOnDay = (dateString) => {
    if (!dateString || !providerAvailability) return { available: true, message: null };
    
    const dayName = getDayName(dateString);
    const daySchedule = providerAvailability.weekly_schedule?.find(d => d.day === dayName);
    
    if (!daySchedule || !daySchedule.enabled) {
      return {
        available: false,
        message: `Provider is not available on ${dayName}s. Please select another date.`
      };
    }
    
    return { available: true, message: null };
  };

  // Convert 12-hour time string to 24-hour format for comparison
  const convertTo24Hour = (time12h) => {
    if (!time12h) return null;
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    
    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes || '00'}:00`;
  };

  // Check if a time slot is available based on provider schedule and booked slots (single-slot check)
  const isSlotAvailable = (slotValue) => {
    if (!preferredDate || !providerAvailability) return true; // Default to available
    
    // Get day of week for selected date
    const dayName = getDayName(preferredDate);
    
    // Find day schedule
    const daySchedule = providerAvailability.weekly_schedule?.find(d => d.day === dayName);
    
    // If day is not enabled, slot is not available
    if (!daySchedule || !daySchedule.enabled) {
      return false;
    }
    
    // Check if time is within working hours
    const startTime = convertTo24Hour(daySchedule.start_time);
    const endTime = convertTo24Hour(daySchedule.end_time);
    const breakStart = convertTo24Hour(daySchedule.break_start);
    const breakEnd = convertTo24Hour(daySchedule.break_end);
    
    if (startTime && slotValue < startTime) return false;
    if (endTime && slotValue >= endTime) return false;
    
    // Check if time is during break
    if (breakStart && breakEnd && slotValue >= breakStart && slotValue < breakEnd) {
      return false;
    }
    
    // Check if slot is already booked
    const isBooked = bookedSlots.some(slot => slot.time === slotValue);
    if (isBooked) return false;
    
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50 p-10 min-h-screen">
        <div className="text-center text-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Loading provider details...</h2>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex items-center justify-center bg-gray-50 p-10 min-h-screen">
        <div className="text-center text-gray-700">
          <h2 className="text-2xl font-semibold mb-4">{error || "Provider Not Found"}</h2>
          <button
            onClick={() => navigate(-1)}
            className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const providerName = `${provider.first_name} ${provider.last_name}`.trim();
  const providerSpecialty = provider.specializations?.[0] || 'Service Provider';
  const selectedService = provider.services?.find((s) => String(s.id) === String(selectedServiceId));
  const priceNumber = selectedService?.base_price ?? provider.services?.[0]?.base_price ?? null;
  const priceType = selectedService?.price_type ?? provider.services?.[0]?.price_type ?? 'fixed';
  const minimumCharge = selectedService?.minimum_charge ?? provider.services?.[0]?.minimum_charge ?? 0;
  const isHourly = priceType === 'hourly';
  const hourlyRate = priceNumber != null ? Number(priceNumber) : null;
  const hoursNum = Number(estimatedHours) || 0;

  const allTimeSlots = generateTimeSlots();
  const dayAvailability = isProviderAvailableOnDay(preferredDate);
  const timeSlots = allTimeSlots.map(slot => ({
    ...slot,
    available: isSlotAvailable(slot.value),
    booked: bookedSlots.some(s => s.time === slot.value)
  }));

  const preferredTimeLabel = preferredTime
    ? (timeSlots.find((t) => t.value === preferredTime)?.label || preferredTime)
    : "";

  const dateTimeSummary =
    preferredDate && preferredTime
      ? `${preferredDate} at ${preferredTimeLabel}${isHourly && hoursNum > 0 ? ` (${hoursNum} hour${hoursNum !== 1 ? 's' : ''})` : ''}`
      : "Not selected";
  const estimatedTotal = isHourly && hourlyRate != null ? Number((hoursNum * hourlyRate).toFixed(2)) : (hourlyRate != null ? Number(hourlyRate) : null);
  const priceLabel = priceNumber != null
    ? `NPR ${priceNumber}${isHourly ? '/hour' : ''}`
    : 'N/A';

  const submitBooking = async () => {
    if (!selectedServiceId) {
      setError("Please select a service");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the service you need");
      return;
    }

    if (!address || address.trim().length < 5) {
      setError("Please enter a valid service address");
      return;
    }

    if (!serviceCity.trim()) {
      setError("Please enter service city");
      return;
    }

    const phoneRegex = /^(97|98)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError("Enter a valid Nepal mobile number (e.g., 9812345678)");
      return;
    }

    if (!preferredDate || !preferredTime) {
      setError("Please select preferred date and time");
      return;
    }

    // Validate location when service radius is defined
    if (selectedService?.service_radius && (serviceLat == null || serviceLng == null)) {
      setError("Please locate the service address on the map to continue");
      return;
    }
    if (selectedService?.service_radius && distanceKm != null && distanceKm > selectedService.service_radius) {
      setError("Selected location is outside the provider's service radius");
      return;
    }

    const selectedDate = new Date(preferredDate);
    const day = selectedDate.getDay(); // 0=Sun
    if (Number.isNaN(day) || selectedDate < new Date(minDate)) {
      setError("Please pick a valid future date");
      return;
    }

    // Check if provider is available on selected day
    const dayCheck = isProviderAvailableOnDay(preferredDate);
    if (!dayCheck.available) {
      setError(dayCheck.message);
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const payload = {
        service: Number(selectedServiceId),
        preferred_date: preferredDate,
        preferred_time: preferredTime, // already HH:MM:SS
        service_address: address,
        service_city: serviceCity || provider?.city || "",
        service_district: serviceDistrict || provider?.district || "",
        description: description || "",
        special_instructions: specialInstructions.trim() || "",
        customer_phone: phone,
        customer_name: fullName,
        latitude: serviceLat,
        longitude: serviceLng,
        is_emergency: isEmergency,
      };

      const created = await bookingsService.createBooking(payload);

      // Optional: upload before-service images if provided
      if (created?.id && selectedFiles.length > 0) {
        try {
          setUploadError(null);
          await bookingsService.uploadBookingImages(created.id, 'before', selectedFiles, imageDescription);
        } catch (uploadErr) {
          console.error('Image upload failed', uploadErr);
          setUploadError(uploadErr?.error || uploadErr?.message || 'Image upload failed');
        }
      }

      // Show success modal instead of immediate redirect
      setCreatedBooking(created);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Booking submit failed", err);
      setError(err?.error || err?.message || "Failed to submit booking");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className=" bg-gray-50 p-6 flex justify-center">
      <div className="bg-white rounded-md shadow-md max-w-3xl w-full p-6 ">
        {/* Header with provider info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img
              src={provider.profile_picture || "https://randomuser.me/api/portraits/men/32.jpg"}
              alt={providerName}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold">Book {providerName}</h2>
              <p className="text-blue-600">
                {providerSpecialty} &bull; {priceLabel}
              </p>
              <RatingBadge
                providerId={provider.id}
                fallbackRating={provider.average_rating}
                fallbackCount={provider.review_count}
                compact
              />
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none"
            aria-label="Close booking form"
          >
            &times;
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 mb-4 text-sm font-medium text-gray-700">
          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          <span>Step {currentStep} of 4</span>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Booking form */}
        <form onSubmit={handleStepSubmit} className="space-y-6 text-gray-800">
          {currentStep === 1 && (
            <>
              {/* Service Picker (from provider services) */}
              <div>
                <label htmlFor="serviceType" className="block font-medium mb-1">
                  Service *
                </label>
                <select
                  id="serviceType"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                >
                  <option value="" disabled>
                    Select a service
                  </option>
                  {provider.services?.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.title} {srv.base_price ? `• NPR ${srv.base_price}` : ""}
                      {srv.price_type ? ` (${srv.price_type})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Estimate */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Price Estimate</h3>
                <div className="grid sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <p className="text-sm text-gray-600">Rate</p>
                    <p className="text-blue-700 font-semibold">{priceLabel}</p>
                    {minimumCharge > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Minimum charge: NPR {minimumCharge}</p>
                    )}
                  </div>
                  {isHourly && (
                    <div>
                      <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Hours
                      </label>
                      <input
                        id="estimatedHours"
                        type="number"
                        min={1}
                        max={12}
                        step={1}
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
                {isHourly && hourlyRate != null && (
                  <div className="mt-3 text-sm text-gray-800">
                    <p>
                      Estimated: {hoursNum} hour{hoursNum !== 1 ? 's' : ''} × NPR {hourlyRate} = 
                      <span className="font-semibold"> NPR {estimatedTotal}</span>
                      {minimumCharge > 0 && estimatedTotal < minimumCharge && (
                        <span className="text-gray-600"> (min NPR {minimumCharge})</span>
                      )}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Note: This is an estimate. The final price may differ based on the provider's quote and on-site assessment.
                </p>
              </div>

              {/* Emergency Service Checkbox */}
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-orange-900">🚨 Emergency Service Required</span>
                    <p className="text-xs text-gray-700 mt-1">
                      Check this if you need immediate or same-day service. 
                      {provider?.emergency_availability
                        ? 'This provider accepts emergency bookings.'
                        : 'Note: This provider may not accept emergency requests.'}
                    </p>
                    {isEmergency && !provider?.emergency_availability && (
                      <p className="text-xs text-orange-700 font-medium mt-2">
                        ⚠️ Provider emergency availability not confirmed. They may decline or charge extra.
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="preferredDate" className="block font-medium mb-1">
                    Preferred Date *
                  </label>
                  <input
                    id="preferredDate"
                    type="date"
                    required
                    min={minDate}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                  {preferredDate && !dayAvailability.available && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ✗ {dayAvailability.message}
                    </p>
                  )}
                  {preferredDate && dayAvailability.available && timeSlots.filter(s => s.available).length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {timeSlots.filter(s => s.available).length} slot(s) available
                    </p>
                  )}
                  {preferredDate && dayAvailability.available && timeSlots.filter(s => s.available).length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠ All time slots are booked for this date
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="preferredTime" className="block font-medium mb-1">
                    Preferred Time *
                    {loadingAvailability && (
                      <span className="ml-2 text-xs text-gray-500">(checking availability...)</span>
                    )}
                  </label>
                    <select
                      id="preferredTime"
                      required
                      disabled={!dayAvailability.available || loadingAvailability}
                      className={`w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        (!dayAvailability.available || loadingAvailability) ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                    >
                      <option value="" disabled>
                        {!dayAvailability.available ? 'Provider not available this day' : 'Select time'}
                      </option>
                      {timeSlots.map((slot) => (
                        <option 
                          key={slot.value} 
                          value={slot.value}
                          disabled={!slot.available}
                          style={{
                            color: slot.available ? 'inherit' : '#9ca3af',
                            fontWeight: slot.booked ? 'bold' : 'normal'
                          }}
                        >
                          {slot.label} {!slot.available && slot.booked ? '(Booked)' : !slot.available ? '(Unavailable)' : ''}
                        </option>
                      ))}
                    </select>
                    {preferredDate && timeSlots.filter(s => s.available).length === 0 && dayAvailability.available && (
                      <p className="text-xs text-red-600 mt-1">
                        No available time slots for this date. Provider may be fully booked or not working this day.
                      </p>
                    )}
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Contact Information */}
              <fieldset className=" pt-4">
                <legend className="font-semibold mb-4 text-gray-900 border-b border-gray-200">
                  Contact & Location
                </legend>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block font-medium mb-1">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block font-medium mb-1">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block font-medium mb-1">
                      Service Address *
                    </label>
                    <input
                      id="address"
                      type="text"
                      required
                      placeholder="Where should the service be performed"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="serviceCity" className="block font-medium mb-1">
                      Service City *
                    </label>
                    <input
                      id="serviceCity"
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={serviceCity}
                      onChange={(e) => setServiceCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="serviceDistrict" className="block font-medium mb-1">
                      Service District
                    </label>
                    <input
                      id="serviceDistrict"
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={serviceDistrict}
                      onChange={(e) => setServiceDistrict(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button
                        type="button"
                        className="px-3 py-2 border border-green-600 text-green-600 rounded-md text-xs font-semibold hover:bg-green-50"
                        onClick={async () => {
                          try {
                            setGeocodeLoading(true);
                            setGeocodeError(null);
                            const query = [address, serviceCity, serviceDistrict, 'Nepal'].filter(Boolean).join(', ');
                            const coords = await geocodeAddress(query);
                            if (!coords) {
                              setGeocodeError('Could not locate this address. Please refine the address.');
                              setServiceLat(null);
                              setServiceLng(null);
                              return;
                            }
                            setServiceLat(coords.lat);
                            setServiceLng(coords.lng);
                          } catch (err) {
                            console.error('Geocode failed', err);
                            setGeocodeError('Failed to locate address');
                          } finally {
                            setGeocodeLoading(false);
                          }
                        }}
                      >
                        {geocodeLoading ? 'Locating...' : 'Locate on Map'}
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 border border-purple-600 text-purple-600 rounded-md text-xs font-semibold hover:bg-purple-50"
                        onClick={() => {
                          if (!navigator.geolocation) {
                            setGeocodeError('Geolocation is not supported by this browser');
                            return;
                          }
                          setGeocodeLoading(true);
                          setGeocodeError(null);
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              const { latitude, longitude } = pos.coords;
                              setServiceLat(latitude);
                              setServiceLng(longitude);
                              setGeocodeLoading(false);
                            },
                            (err) => {
                              console.error('Geolocation error', err);
                              let errorMsg = 'Failed to get current location';
                              if (err.code === 1) errorMsg = 'Location access denied. Please enable location permissions.';
                              else if (err.code === 2) errorMsg = 'Location unavailable. Check your device settings.';
                              else if (err.code === 3) errorMsg = 'Location request timed out. Please try again.';
                              setGeocodeError(errorMsg);
                              setGeocodeLoading(false);
                            },
                            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
                          );
                        }}
                      >
                        Use Current Location
                      </button>
                    </div>
                    {geocodeError && (
                      <p className="text-xs text-red-600 mt-1">{geocodeError}</p>
                    )}
                    {(serviceLat != null && serviceLng != null) && (
                      <p className="text-xs text-gray-600 mt-1">GPS: {serviceLat}, {serviceLng}</p>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Distance & Radius */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Distance & Coverage</h3>
                <div className="text-sm text-gray-800 space-y-1">
                  <p>
                    Provider location: {providerLat != null && providerLng != null ? `${providerLat}, ${providerLng}` : 'Not located'}
                  </p>
                  <p>
                    Service location: {serviceLat != null && serviceLng != null ? `${serviceLat}, ${serviceLng}` : 'Not located'}
                  </p>
                  <p>
                    Distance: {distanceKm != null ? `${distanceKm} km` : '—'}
                  </p>
                </div>
                {selectedService?.service_radius && distanceKm != null && (
                  <p className={`mt-2 text-xs ${distanceKm <= selectedService.service_radius ? 'text-green-700' : 'text-red-700'}`}>
                    {distanceKm <= selectedService.service_radius
                      ? `Within service radius (${selectedService.service_radius} km)`
                      : `Outside service radius (${selectedService.service_radius} km). Provider may decline or add travel charges.`}
                  </p>
                )}
              </div>

              {/* Inline Map Picker */}
              <div className="bg-white border border-gray-200 rounded-md p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Map Picker</h3>
                <p className="text-xs text-gray-600 mb-2">Drag the marker, click on the map, or search below to set the service location.</p>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleMapSearch();
                      }
                    }}
                    placeholder="Search address or place (OSM)"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={handleMapSearch}
                    disabled={mapSearchLoading}
                    className={`px-4 py-2 rounded-md text-sm font-semibold border ${mapSearchLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white border-green-600 hover:bg-green-700'}`}
                  >
                    {mapSearchLoading ? 'Searching...' : 'Search & Set'}
                  </button>
                </div>
                {mapSearchError && (
                  <p className="text-xs text-red-600 mb-2">{mapSearchError}</p>
                )}
                <div ref={mapContainerRef} style={{ height: 240 }} className="rounded-md overflow-hidden border border-gray-200" />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-semibold text-gray-900">📋 Job Details</h3>
                <p className="text-sm text-gray-600 mt-1">Provide clear details about your service needs. This helps the provider arrive prepared and give you an accurate quote.</p>
              </div>

              {/* Service Description */}
              <div>
                <label htmlFor="description" className="block font-medium mb-1">
                  Service Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  maxLength={500}
                  placeholder="Please describe what you need help with... (e.g., 'Need to fix leaking kitchen sink' or 'Install new ceiling fan in bedroom')"
                  className={`w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 placeholder-gray-400 resize-none ${
                    description.trim() ? 'border-gray-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500'
                  }`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className={`text-xs ${description.trim() ? 'text-green-600' : 'text-red-500'}`}>
                    {description.trim() ? '✓ Description provided' : '⚠️ Required - Please describe your service needs'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {description.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label htmlFor="specialInstructions" className="block font-medium mb-1">
                  Special Instructions <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="specialInstructions"
                  rows={3}
                  maxLength={300}
                  placeholder='e.g., "Call before arriving", "Park on street", "Gate code: 1234","House no: 194"'
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 resize-none"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
                <p className="text-xs text-gray-500 text-right mt-1">
                  {specialInstructions.length}/300 characters
                </p>
              </div>

              {/* Optional: Upload before-service images (max 3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-medium">
                    Add photos (before service) <span className="text-gray-500 text-xs">(Optional)</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {selectedFiles.length}/3 images
                    </span>
                  </label>
                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFiles([]);
                        setPreviewUrls([]);
                        setUploadError('');
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                      disabled={submitLoading}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {uploadError && (
                  <div className="text-sm text-red-600">{uploadError}</div>
                )}
                <div
                  className={`border-2 border-dashed rounded-md p-4 text-sm text-gray-600 bg-gray-50 ${
                    submitLoading || selectedFiles.length >= 3 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:border-green-500 hover:bg-white'
                  }`}
                >
                  <label className={`flex flex-col items-center gap-2 ${selectedFiles.length >= 3 ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <span className="font-medium text-gray-800">
                      {selectedFiles.length >= 3 ? 'Maximum 3 images reached' : 'Drop images here or click to browse'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Accepted: JPG/PNG up to 5MB each • Max 3 images
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={submitLoading || selectedFiles.length >= 3}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const remainingSlots = 3 - selectedFiles.length;
                        
                        // Take only as many files as we have slots for
                        const filesToAdd = files.slice(0, remainingSlots);
                        const valid = filesToAdd.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
                        
                        if (valid.length !== filesToAdd.length) {
                          setUploadError('Only images up to 5MB are allowed.');
                        } else if (files.length > remainingSlots) {
                          setUploadError(`Only ${remainingSlots} more image(s) can be added (max 3 total).`);
                        } else {
                          setUploadError('');
                        }
                        
                        // Append to existing files instead of replacing
                        const newFiles = [...selectedFiles, ...valid];
                        const newUrls = [...previewUrls, ...valid.map((f) => URL.createObjectURL(f))];
                        setSelectedFiles(newFiles);
                        setPreviewUrls(newUrls);
                      }}
                    />
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder="Optional image description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  disabled={submitLoading}
                />
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt={`preview-${idx}`}
                          className="h-24 w-full object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextFiles = selectedFiles.filter((_, i) => i !== idx);
                            const nextUrls = previewUrls.filter((_, i) => i !== idx);
                            setSelectedFiles(nextFiles);
                            setPreviewUrls(nextUrls);
                            if (nextFiles.length === 0) setUploadError('');
                          }}
                          className="absolute top-1 right-1 bg-white/90 text-red-600 text-xs px-2 py-1 rounded shadow hidden group-hover:block"
                          disabled={submitLoading}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">You can select up to 3 images (5MB each). Type: before service</p>
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              {/* Booking Summary */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-2 text-sm text-gray-700">
                <h3 className="font-semibold text-gray-900 mb-2">Review & Confirm</h3>
                <div className="flex justify-between"><span>Service:</span><span>{selectedService?.title || "Not selected"}</span></div>
                <div className="flex justify-between"><span>Date &amp; Time:</span><span>{dateTimeSummary}</span></div>
                <div className="flex justify-between"><span>Location:</span><span>{address || '—'}</span></div>
                <div className="flex justify-between"><span>City/District:</span><span>{serviceCity || '—'} {serviceDistrict ? `(${serviceDistrict})` : ''}</span></div>
                <div className="flex justify-between"><span>Contact:</span><span>{fullName} / {phone}</span></div>
                <div className="flex justify-between"><span>Rate:</span><span className="text-blue-600 font-semibold">{priceLabel}</span></div>
                <div className="flex justify-between"><span>{isHourly ? 'Estimated Total:' : 'Total:'}</span><span className="font-semibold text-gray-900">{isHourly && hourlyRate != null ? `NPR ${estimatedTotal}${minimumCharge > 0 && estimatedTotal < minimumCharge ? ` (min NPR ${minimumCharge})` : ''}` : (hourlyRate != null ? `NPR ${hourlyRate}` : 'N/A')}</span></div>
                {specialInstructions && (
                  <div className="flex justify-between"><span>Instructions:</span><span className="text-right">{specialInstructions}</span></div>
                )}
                {previewUrls.length > 0 && (
                  <div className="flex justify-between"><span>Before photos:</span><span>{previewUrls.length} selected</span></div>
                )}
                {isEmergency && (
                  <p className="text-xs text-orange-700 font-semibold">🚨 Marked as emergency request</p>
                )}
                <p className="text-xs text-gray-500">Final price may differ based on the provider's quote and on-site assessment.</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-red-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-red-700 transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                className="flex-1 border border-gray-300 text-gray-800 rounded-md px-6 py-3 font-semibold hover:bg-gray-100 transition duration-200 cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={submitLoading}
              className={`flex-1 rounded-md px-6 py-3 font-semibold transition duration-200 cursor-pointer ${submitLoading ? "bg-green-300 text-white cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
            >
              {submitLoading ? "Submitting..." : currentStep === 4 ? "Confirm Booking" : "Next"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdBooking && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Booking Request Sent! 🎉
            </h2>

            {/* Booking ID */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-sm text-gray-600 text-center">
                Booking ID: <span className="font-semibold text-gray-900">#{createdBooking.id}</span>
              </p>
            </div>

            {/* Message */}
            <p className="text-gray-700 text-center mb-4">
              Your booking request has been sent to <span className="font-semibold">{providerName}</span>
            </p>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">What happens next?</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• The provider will review your request</li>
                    <li>• You'll receive a response within 24 hours</li>
                    <li>• You can track the status in "My Bookings"</li>
                    {isEmergency && <li className="font-semibold">• ⚡ Emergency request - faster response expected</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/my-bookings")}
                className="flex-1 bg-green-600 text-white rounded-md px-4 py-3 font-semibold hover:bg-green-700 transition duration-200"
              >
                View My Bookings
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedBooking(null);
                  // Reset form or navigate to services
                  navigate("/services");
                }}
                className="flex-1 border border-gray-300 text-gray-700 rounded-md px-4 py-3 font-semibold hover:bg-gray-50 transition duration-200"
              >
                Book Another Service
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/my-bookings");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
