import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RatingBadge from "../../components/RatingBadge";
import BookingConflictWarning from "../../components/BookingConflictWarning";
import { useUserProfile } from "../../context/UserProfileContext";
import api from "../../api/axios";
import bookingsService from "../../services/bookingsService";

const getNepalNowParts = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const lookup = {};
  parts.forEach((p) => {
    if (p.type !== 'literal') lookup[p.type] = p.value;
  });

  return {
    date: `${lookup.year}-${lookup.month}-${lookup.day}`,
    time: `${lookup.hour}:${lookup.minute}:${lookup.second}`,
  };
};

const isPastNepalDateTime = (dateStr, timeStr, nepalNow) => {
  if (!dateStr || !timeStr || !nepalNow?.date || !nepalNow?.time) return false;
  if (dateStr < nepalNow.date) return true;
  if (dateStr > nepalNow.date) return false;
  const toSeconds = (t) => {
    const [h, m, s = '0'] = t.split(':').map((n) => parseInt(n, 10) || 0);
    return h * 3600 + m * 60 + s;
  };
  return toSeconds(timeStr) <= toSeconds(nepalNow.time);
};

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useUserProfile();

  // State variables
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true); // initial page load for provider details
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
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
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSuggestLoading, setAddressSuggestLoading] = useState(false);
  const [addressSuggestError, setAddressSuggestError] = useState(null);
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState(''); // Store human-readable address from reverse geocode
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);
  const toggleServiceSelection = (serviceId) => {
    setSelectedServiceIds((prev) => {
      const idStr = String(serviceId);
      return prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr];
    });
  };
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const serviceMarkerRef = useRef(null);
  const serviceRadiusCircleRef = useRef(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [nepalNow, setNepalNow] = useState(getNepalNowParts());
  const minDate = nepalNow.date;

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

  // Refresh Nepal current date/time every minute for accurate gating
  useEffect(() => {
    const tick = () => setNepalNow(getNepalNowParts());
    tick();
    const intervalId = setInterval(tick, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Pre-fill contact and location fields from user profile (one-time, non-destructive)
  useEffect(() => {
    if (!userProfile || prefilledFromProfile) return;

    const derivedFullName = userProfile.full_name
      || [userProfile.first_name, userProfile.middle_name, userProfile.last_name].filter(Boolean).join(' ').trim();
    const derivedPhone = userProfile.phone || userProfile.phone_number;
    const derivedEmail = userProfile.email;
    const derivedAddress = userProfile.address || userProfile.location;
    const derivedCity = userProfile.city;
    const derivedDistrict = userProfile.district;
    const derivedLat = userProfile.latitude;
    const derivedLng = userProfile.longitude;

    if (!fullName && derivedFullName) setFullName(derivedFullName);
    if (!phone && derivedPhone) setPhone(derivedPhone);
    if (!email && derivedEmail) setEmail(derivedEmail);
    if (!address && derivedAddress) setAddress(derivedAddress);
    if (!serviceCity && derivedCity) setServiceCity(derivedCity);
    if (!serviceDistrict && derivedDistrict) setServiceDistrict(derivedDistrict);
    if (serviceLat === null && derivedLat != null) setServiceLat(derivedLat);
    if (serviceLng === null && derivedLng != null) setServiceLng(derivedLng);
    if (!selectedLocationName && derivedAddress) setSelectedLocationName(derivedAddress);

    setPrefilledFromProfile(true);
  }, [userProfile, prefilledFromProfile, fullName, phone, email, address, serviceCity, serviceDistrict, serviceLat, serviceLng, selectedLocationName]);

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

  // Check for booking conflicts when date or time changes
  useEffect(() => {
    let isMounted = true;
    const checkConflicts = async () => {
      if (!provider || !preferredDate) {
        setConflictData(null);
        return;
      }
      
      try {
        setCheckingConflict(true);
        const result = await bookingsService.checkBookingConflict(
          provider.id,
          preferredDate,
          preferredTime || null,
          selectedServiceIds[0] || null
        );
        
        if (isMounted) {
          setConflictData(result);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error checking booking conflict:', err);
        // Don't show error for conflict check - it's informational
      } finally {
        if (isMounted) {
          setCheckingConflict(false);
        }
      }
    };

    checkConflicts();
    return () => { isMounted = false; };
  }, [provider, preferredDate, preferredTime, selectedServiceIds]);

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

  // Simple geocoding via OpenStreetMap Nominatim (address → lat/lng)
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
      return { 
        lat: parseFloat(first.lat), 
        lng: parseFloat(first.lon),
        display_name: first.display_name || null
      };
    }
    return null;
  };

  // Reverse geocoding via OpenStreetMap Nominatim (lat/lng → address)
  const reverseGeocodeLocation = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to reverse geocode');
      const data = await res.json();
      return data?.display_name || null;
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return null;
    }
  };

  // Fetch address suggestions for autocomplete (top 5)
  const fetchAddressSuggestions = async (query) => {
    if (!query || query.trim().length < 3) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=np&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    const data = await res.json();
    return Array.isArray(data)
      ? data.map((item) => ({
          label: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }))
      : [];
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

  // Apply a selected location to state, marker, and map
  const applySelectedLocation = (lat, lng, label = null) => {
    setServiceLat(lat);
    setServiceLng(lng);
    if (label) {
      setSelectedLocationName(label);
      setAddress(label);
    }
    setAddressDropdownOpen(false);
    setAddressSuggestions([]);
    setAddressSuggestError(null);
    if (serviceMarkerRef.current) {
      serviceMarkerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
    }
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
      applySelectedLocation(coords.lat, coords.lng, coords.display_name);
      setMapSearchQuery(''); // Clear search after setting location
    } catch (err) {
      console.error('Map search failed', err);
      setMapSearchError('Failed to search location');
    } finally {
      setMapSearchLoading(false);
    }
  };

  const handleSelectAddressSuggestion = (item) => {
    if (!item) return;
    applySelectedLocation(item.lat, item.lng, item.label);
    setAddressSuggestions([]);
    setAddressDropdownOpen(false);
  };

  // Debounced address suggestions as user types in the service address field
  useEffect(() => {
    const query = address?.trim();
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setAddressSuggestError(null);
      setAddressDropdownOpen(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setAddressSuggestLoading(true);
        const suggestions = await fetchAddressSuggestions(query);
        if (cancelled) return;
        setAddressSuggestions(suggestions);
        setAddressSuggestError(null);
        setAddressDropdownOpen(suggestions.length > 0);
      } catch (err) {
        if (cancelled) return;
        console.error('Suggestion fetch failed', err);
        setAddressSuggestError('Could not fetch suggestions');
      } finally {
        if (!cancelled) setAddressSuggestLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address]);

  const validateStep = (step) => {
    // Clear previous error
    setError(null);
    if (step === 1) {
      if (!selectedServiceIds.length) {
        setError("Please select at least one service");
        return false;
      }
      if (!preferredDate || !preferredTime) {
        setError("Please select preferred date and time");
        return false;
      }
      if (preferredDate < minDate) {
        setError("Please select today or a future date (Nepal time)");
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
      if (selectedServices.some((s) => s.service_radius) && (serviceLat == null || serviceLng == null)) {
        setError("Please locate the service address on the map to continue");
        return false;
      }
      const radiusExceeded = selectedServices.some((s) => s.service_radius && distanceKm != null && distanceKm > s.service_radius);
      if (radiusExceeded) {
        setError("Selected location is outside the provider's service radius for one or more services");
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
    selectedServiceIds,
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

    // Helper to update location and reverse geocode
    const updateLocationAndReverseGeocode = async (lat, lng) => {
      setServiceLat(lat);
      setServiceLng(lng);
      // Reverse geocode to get address name
      const addressName = await reverseGeocodeLocation(lat, lng);
      if (addressName) {
        setSelectedLocationName(addressName);
        // Only update address field if it's empty or user hasn't manually edited it
        if (!address || address.trim() === '') {
          setAddress(addressName);
        }
      }
    };

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      updateLocationAndReverseGeocode(pos.lat, pos.lng);
    });

    // Click to set marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateLocationAndReverseGeocode(lat, lng);
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

  // Update marker tooltip with the latest selected address label
  useEffect(() => {
    const marker = serviceMarkerRef.current;
    if (!marker) return;
    marker.unbindTooltip();
    const label = selectedLocationName || 'Selected location';
    marker.bindTooltip(label, { direction: 'top', offset: [0, -10] });
  }, [selectedLocationName]);

  // Derived service/provider values (safe defaults so hooks above remain stable)
  const providerServices = provider?.services || [];
  const providerName = provider?.full_name || 
    [provider?.first_name, provider?.middle_name, provider?.last_name].filter(Boolean).join(' ').trim() || 
    'Service Provider';
  const providerSpecialties = provider?.specializations?.length > 0 
    ? provider.specializations.join(', ')
    : 'Service Provider';
  const selectedServices = providerServices.filter((s) => selectedServiceIds.includes(String(s.id)));
  const primaryService = selectedServices[0] || null;
  const getServiceDurationHours = (service) => {
    if (!service) return 0;
    if (service.estimated_duration_min && service.estimated_duration_max) {
      return (Number(service.estimated_duration_min) + Number(service.estimated_duration_max)) / 2;
    }
    if (service.estimated_duration_min) {
      return Number(service.estimated_duration_min);
    }
    if (service.estimated_duration) {
      return Number(service.estimated_duration);
    }
    return 0;
  };
  const anyHourly = selectedServices.some((s) => s.price_type === 'hourly');
  const hourlyBreakdown = selectedServices
    .filter((s) => s.price_type === 'hourly')
    .map((s) => {
      const duration = getServiceDurationHours(s) || 1; // default to 1h when provider duration missing
      const rate = Number(s.base_price || 0);
      return {
        id: s.id,
        name: s.specialization_name || s.specialization?.name || s.title,
        duration,
        rate,
        cost: duration * rate,
      };
    });
  const hourlyCostTotal = hourlyBreakdown.reduce((sum, item) => sum + item.cost, 0);
  const fixedBreakdown = selectedServices
    .filter((s) => s.price_type !== 'hourly')
    .map((s) => ({
      id: s.id,
      name: s.specialization_name || s.specialization?.name || s.title,
      cost: Number(s.base_price || 0),
    }));
  const fixedTotal = selectedServices
    .filter((s) => s.price_type !== 'hourly')
    .reduce((sum, s) => sum + Number(s.base_price || 0), 0);
  const minimumChargeTotal = selectedServices.reduce((sum, s) => sum + Number(s.minimum_charge || 0), 0);
  const estimatedTotal = hourlyCostTotal + fixedTotal;
  const priceLabel = selectedServices.length === 0
    ? 'Select at least one service'
    : anyHourly
      ? `NPR ${estimatedTotal || 0} (est)`
      : `NPR ${estimatedTotal || 0}`;

  // Draw/refresh service radius circle on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (serviceRadiusCircleRef.current) {
      map.removeLayer(serviceRadiusCircleRef.current);
      serviceRadiusCircleRef.current = null;
    }
    if (serviceLat != null && serviceLng != null && primaryService?.service_radius) {
      const circle = L.circle([serviceLat, serviceLng], {
        radius: Number(primaryService.service_radius) * 1000,
        color: '#16a34a',
        fillColor: '#bbf7d0',
        fillOpacity: 0.2,
        weight: 1,
      }).addTo(map);
      serviceRadiusCircleRef.current = circle;
    }
  }, [serviceLat, serviceLng, primaryService?.service_radius]);

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
    if (isPastNepalDateTime(preferredDate, slotValue, nepalNow)) {
      return false;
    }

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

  // Handle selecting an alternative time slot
  const handleSelectAlternativeTime = (time) => {
    setPreferredTime(time);
    setError(null);
  };

  // Handle selecting an alternative date
  const handleSelectAlternativeDate = (date) => {
    setPreferredDate(date);
    setPreferredTime(''); // Reset time when date changes
    setError(null);
  };

  const allTimeSlots = generateTimeSlots();
  const dayAvailability = isProviderAvailableOnDay(preferredDate);
  const timeSlots = allTimeSlots.map(slot => ({
    ...slot,
    available: isSlotAvailable(slot.value),
    booked: bookedSlots.some(s => s.time === slot.value)
  }));
  const availableSlotsCount = timeSlots.filter((s) => s.available).length;

  const preferredTimeLabel = preferredTime
    ? (timeSlots.find((t) => t.value === preferredTime)?.label || preferredTime)
    : "";

  const isPastNepalSlot = isPastNepalDateTime(preferredDate, preferredTime, nepalNow);

  const dateTimeSummary =
    preferredDate && preferredTime
      ? `${preferredDate} at ${preferredTimeLabel}`
      : "Not selected";

  // Booking summary math for multi-service
  const effectiveBase = selectedServices.length > 0 ? estimatedTotal : null;
  const vatRate = 0.13;
  const vatAmount = null; // kept null for display (future use)
  const totalAmount = effectiveBase;
  const appointmentDateLabel = preferredDate || '—';
  const appointmentTimeLabel = preferredTimeLabel || '—';
  const totalEstimatedDuration = selectedServices.reduce((sum, s) => {
    const baseDuration = getServiceDurationHours(s);
    const resolvedDuration = baseDuration || (s.price_type === 'hourly' ? 1 : 0);
    return sum + resolvedDuration;
  }, 0);
  const appointmentDuration = totalEstimatedDuration > 0
    ? `${Number(totalEstimatedDuration.toFixed(1))} hour${Number(totalEstimatedDuration.toFixed(1)) !== 1 ? 's' : ''}`
    : '—';
  const summaryServiceName = selectedServices.length > 0
    ? selectedServices.map((s) => s.specialization_name || s.specialization?.name || s.title).join(', ')
    : providerSpecialties;
  const formatNpr = (val) => (val != null ? `NPR ${Number(val).toLocaleString('en-US')}` : '—');

  const submitBooking = async () => {
    if (!selectedServices.length) {
      setError("Please select at least one service");
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

    if (isPastNepalDateTime(preferredDate, preferredTime, nepalNow)) {
      setError(`Selected time is in the past for Nepal time (${nepalNow.time}). Please pick a future slot.`);
      return;
    }

    // Validate location when service radius is defined
    if (selectedServices.some((s) => s.service_radius) && (serviceLat == null || serviceLng == null)) {
      setError("Please locate the service address on the map to continue");
      return;
    }
    const radiusExceeded = selectedServices.some((s) => s.service_radius && distanceKm != null && distanceKm > s.service_radius);
    if (radiusExceeded) {
      setError("Selected location is outside the provider's service radius for one or more services");
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
        service: Number(selectedServiceIds[0]),
        services: selectedServiceIds.map((id) => Number(id)),
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
    <div className="bg-gray-50 min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="bg-white rounded-2xl shadow-lg w-full p-6 lg:p-7">
          {/* Header with provider info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img
                src={provider.profile_picture || "https://randomuser.me/api/portraits/men/32.jpg"}
                alt={providerName}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-gray-900">Book {providerName}</h2>
                <p className="text-blue-600 font-semibold">
                  {providerSpecialties}
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
              {/* Service Picker (multi-select) */}
              <div>
                <label className="block font-medium mb-2">
                  Select Services * (you can choose multiple)
                </label>
                <div className="space-y-2">
                  {provider.services?.map((srv) => {
                    const serviceSpecialization = srv.specialization_name || srv.specialization?.name || provider.specializations?.[0] || 'Service';
                    const priceDisplay = srv.base_price ? `NPR ${srv.base_price}` : 'Contact for price';
                    const priceTypeLabel = srv.price_type === 'hourly' ? '/hour' : 'fixed';
                    const checked = selectedServiceIds.includes(String(srv.id));
                    return (
                      <label
                        key={srv.id}
                        className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer transition hover:border-green-500 ${checked ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded"
                          checked={checked}
                          onChange={() => toggleServiceSelection(srv.id)}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{serviceSpecialization}</p>
                          <p className="text-sm text-gray-700">{srv.title}</p>
                          <p className="text-sm text-blue-700 font-semibold mt-1">
                            {priceDisplay} {srv.price_type ? `(${priceTypeLabel})` : ''}
                          </p>
                          {srv.estimated_duration_min && (
                            <p className="text-xs text-purple-700 mt-1">
                              ⏱️ Est. Duration: {srv.estimated_duration_max && srv.estimated_duration_max !== srv.estimated_duration_min
                                ? `${srv.estimated_duration_min}-${srv.estimated_duration_max} hours`
                                : `${srv.estimated_duration_min} ${srv.estimated_duration_min === 1 ? 'hour' : 'hours'}`
                              }
                            </p>
                          )}
                          {srv.minimum_charge > 0 && (
                            <p className="text-xs text-gray-500">Minimum charge: NPR {srv.minimum_charge}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedServices.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md space-y-1 text-sm text-gray-800">
                    <p className="font-semibold">Selected Services:</p>
                    {selectedServices.map((svc) => (
                      <div key={svc.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <span>{svc.specialization_name || svc.specialization?.name || svc.title}</span>
                          {svc.estimated_duration_min && (
                            <span className="text-xs text-purple-700 ml-2">
                              ({svc.estimated_duration_max && svc.estimated_duration_max !== svc.estimated_duration_min
                                ? `${svc.estimated_duration_min}-${svc.estimated_duration_max}h`
                                : `${svc.estimated_duration_min}h`
                              })
                            </span>
                          )}
                        </div>
                        <span className="text-blue-700 font-semibold">{svc.base_price ? `NPR ${svc.base_price}` : 'Contact'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Estimate (aggregated) */}
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-white text-base shadow-md">₨</span>
                    Price Estimate
                  </h3>
                  {selectedServices.length > 0 && (
                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Based on provider durations</span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <p className="text-sm text-gray-600">Rate</p>
                    <p className="text-blue-700 font-semibold">{priceLabel}</p>
                    {minimumChargeTotal > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Minimum charge total: NPR {Number(minimumChargeTotal).toLocaleString('en-US')}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Provider Estimated Duration</p>
                    {selectedServices.length ? (
                      <div className="space-y-1 text-sm text-gray-800">
                        {selectedServices.map((svc) => {
                          const duration = getServiceDurationHours(svc) || (svc.price_type === 'hourly' ? 1 : 0);
                          const roundedDuration = duration ? Number(duration.toFixed(1)) : null;
                          const isHourly = svc.price_type === 'hourly';
                          return (
                            <div key={svc.id} className="flex justify-between gap-3">
                              <span className="truncate flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm ${isHourly ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white' : 'bg-linear-to-r from-slate-400 to-slate-500 text-white'}`}>{isHourly ? '⏱ Hourly' : '📋 Fixed'}</span>
                                {svc.specialization_name || svc.specialization?.name || svc.title}
                              </span>
                              <span className="font-semibold text-gray-800">{roundedDuration ? `${roundedDuration}h` : '—'}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Select services to see estimated duration.</p>
                    )}
                  </div>
                </div>

                {selectedServices.length > 0 && (
                  <div className="mt-3 text-sm text-gray-800 space-y-3">
                    {hourlyBreakdown.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-700 uppercase tracking-wide">
                          <span className="flex items-center gap-1"><span>⏱</span> Hourly Services</span>
                          <span>Line Total</span>
                        </div>
                        <div className="divide-y divide-gray-100 rounded-lg border-2 border-blue-200 bg-white shadow-sm overflow-hidden">
                          {hourlyBreakdown.map((item) => (
                            <div key={item.id} className="flex justify-between gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors">
                              <span className="text-gray-800 font-medium">{item.name} <span className="text-blue-600">•</span> <span className="text-blue-700 font-semibold">{Number(item.duration.toFixed(1))}h</span> × NPR {Number(item.rate).toLocaleString('en-US')}</span>
                              <span className="font-bold text-blue-700">NPR {Number(item.cost).toLocaleString('en-US')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between px-2 py-1 bg-blue-100 rounded-md font-bold text-gray-900">
                          <span>Hourly Subtotal</span>
                          <span className="text-blue-700">NPR {Number(hourlyCostTotal).toLocaleString('en-US')}</span>
                        </div>
                      </div>
                    )}

                    {fixedBreakdown.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
                          <span className="flex items-center gap-1"><span>📋</span> Fixed-price Services</span>
                          <span>Line Total</span>
                        </div>
                        <div className="divide-y divide-gray-100 rounded-lg border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
                          {fixedBreakdown.map((item) => (
                            <div key={item.id} className="flex justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                              <span className="text-gray-800 font-medium">{item.name}</span>
                              <span className="font-bold text-slate-700">NPR {Number(item.cost).toLocaleString('en-US')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between px-2 py-1 bg-slate-100 rounded-md font-bold text-gray-900">
                          <span>Fixed Subtotal</span>
                          <span className="text-slate-700">NPR {Number(fixedTotal).toLocaleString('en-US')}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-gray-300">
                      <span className="text-base font-bold text-gray-900">{anyHourly ? '💰 Estimated Total' : '💰 Total'}</span>
                      <span className="text-2xl font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">NPR {Number(estimatedTotal).toLocaleString('en-US')}</span>
                    </div>
                    {minimumChargeTotal > 0 && estimatedTotal < minimumChargeTotal && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-linear-to-r from-amber-100 to-amber-50 border-2 border-amber-300 rounded-lg px-3 py-2 shadow-sm">
                        <span className="text-base">⚠️</span>
                        <span>Minimum charge may apply: NPR {Number(minimumChargeTotal).toLocaleString('en-US')}</span>
                      </div>
                    )}
                    {totalEstimatedDuration > 0 && (
                      <p className="flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5"><span>⏱️</span> Total estimated duration: {Number(totalEstimatedDuration.toFixed(1))} hour{Number(totalEstimatedDuration.toFixed(1)) !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 mt-3">
                  <span className="text-blue-500 text-sm">ℹ️</span>
                  <p>This is an estimate. The final price may differ based on the provider's quote and on-site assessment.</p>
                </div>
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

              {/* Booking Conflict Detection Warning */}
              {preferredDate && preferredTime && availableSlotsCount > 0 && (
                <BookingConflictWarning
                  conflictData={conflictData}
                  onSelectAlternativeTime={handleSelectAlternativeTime}
                  onSelectAlternativeDate={handleSelectAlternativeDate}
                  isPastSlot={isPastNepalSlot}
                />
              )}
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Pre-filled Info Banner */}
              {userProfile && (userProfile.full_name || userProfile.email || userProfile.phone || userProfile.address) && (
                <div className="flex items-start gap-2 text-sm bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg px-4 py-3 mb-4 shadow-sm">
                  <span className="text-green-600 text-lg">✓</span>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Your saved information has been pre-filled</p>
                    <p className="text-xs text-green-700 mt-0.5">You can edit any field below if you need to update or change the information for this booking.</p>
                  </div>
                </div>
              )}

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
                  <div className="relative">
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
                      onFocus={() => setAddressDropdownOpen(addressSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setAddressDropdownOpen(false), 150)}
                    />
                    {addressSuggestLoading && (
                      <p className="text-xs text-gray-500 mt-1">Fetching location suggestions...</p>
                    )}
                    {addressSuggestError && (
                      <p className="text-xs text-red-600 mt-1">{addressSuggestError}</p>
                    )}
                    {addressDropdownOpen && addressSuggestions.length > 0 && (
                      <div className="mt-1 border border-gray-200 rounded-md shadow bg-white max-h-48 overflow-y-auto divide-y divide-gray-100 z-20 relative">
                        {addressSuggestions.map((s, idx) => (
                          <div
                            key={`${s.label}-${idx}`}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-green-50"
                            onMouseDown={() => handleSelectAddressSuggestion(s)}
                          >
                            <p className="text-gray-900 font-semibold line-clamp-1">{s.label}</p>
                            <p className="text-xs text-gray-500">{s.lat.toFixed(5)}, {s.lng.toFixed(5)}</p>
                          </div>
                        ))}
                      </div>
                    )}
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
                            applySelectedLocation(coords.lat, coords.lng, coords.display_name || address);
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
                              applySelectedLocation(latitude, longitude, selectedLocationName || address);
                              reverseGeocodeLocation(latitude, longitude).then((name) => {
                                if (name) {
                                  setSelectedLocationName(name);
                                  setAddress((prev) => (prev && prev.trim().length > 0 ? prev : name));
                                }
                              });
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
                <h3 className="font-semibold text-gray-900 mb-3">📍 Selected Location Details</h3>
                <div className="space-y-3">
                  {/* Service Location */}
                  <div className="bg-white border border-green-200 rounded p-3">
                    <p className="text-xs text-gray-600 font-semibold mb-1">SERVICE LOCATION</p>
                    {selectedLocationName || address ? (
                      <p className="text-sm font-semibold text-gray-900 mb-1">{selectedLocationName || address}</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Not selected</p>
                    )}
                    {serviceLat != null && serviceLng != null && (
                      <p className="text-xs text-gray-600">
                        Coordinates: <span className="font-mono">{serviceLat.toFixed(6)}, {serviceLng.toFixed(6)}</span>
                      </p>
                    )}
                    {(serviceLat == null || serviceLng == null) && (
                      <p className="text-xs text-orange-600">Click on the map or search to set location</p>
                    )}
                  </div>

                  {/* Provider Location */}
                  <div className="bg-white border border-blue-200 rounded p-3">
                    <p className="text-xs text-gray-600 font-semibold mb-1">PROVIDER LOCATION</p>
                    {providerLat != null && providerLng != null && (
                      <p className="text-xs text-gray-600">
                        <span className="font-mono">{providerLat.toFixed(6)}, {providerLng.toFixed(6)}</span>
                      </p>
                    )}
                  </div>

                  {/* Distance */}
                  {serviceLat != null && serviceLng != null && distanceKm != null && (
                    <div className="bg-white border border-purple-200 rounded p-3">
                      <p className="text-xs text-gray-600 font-semibold mb-1">CALCULATED DISTANCE</p>
                      <p className="text-lg font-bold text-purple-700">{distanceKm} km</p>
                      {primaryService?.service_radius && (
                        <p className={`text-xs mt-2 font-semibold ${distanceKm <= primaryService.service_radius ? 'text-green-700' : 'text-red-700'}`}>
                          {distanceKm <= primaryService.service_radius
                            ? `✓ Within service radius (${primaryService.service_radius} km)`
                            : `✗ Outside service radius (${primaryService.service_radius} km). Provider may add travel charges.`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
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
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md text-sm font-semibold border bg-white text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      const map = mapInstanceRef.current;
                      if (!map) return;
                      const target = (serviceLat != null && serviceLng != null)
                        ? [serviceLat, serviceLng]
                        : (providerLat != null && providerLng != null ? [providerLat, providerLng] : [27.7172, 85.3240]);
                      map.setView(target, 15, { animate: true });
                      if (serviceMarkerRef.current && serviceLat != null && serviceLng != null) {
                        serviceMarkerRef.current.setLatLng(target);
                      }
                    }}
                  >
                    Zoom to location
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
              <div className="bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 space-y-3 text-sm text-gray-700 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-green-600">✓</span> Review & Confirm
                </h3>
                <div className="flex justify-between"><span>Services:</span><span>{summaryServiceName}</span></div>
                {selectedServices.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {selectedServices.map((s) => {
                      const isHourly = s.price_type === 'hourly';
                      const d = getServiceDurationHours(s) || (isHourly ? 1 : 0);
                      const rd = d ? Number(d.toFixed(1)) : null;
                      return (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm ${isHourly ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white' : 'bg-linear-to-r from-slate-400 to-slate-500 text-white'}`}>{isHourly ? '⏱' : '📋'}</span>
                            {s.specialization_name || s.specialization?.name || s.title}
                          </span>
                          <span className="font-semibold text-gray-700">{rd ? `${rd}h` : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-between"><span>Date &amp; Time:</span><span>{dateTimeSummary}</span></div>
                <div className="flex justify-between"><span>Duration (provider est.):</span><span>{appointmentDuration}</span></div>
                <div className="flex justify-between"><span>Location:</span><span>{address || '—'}</span></div>
                <div className="flex justify-between"><span>City/District:</span><span>{serviceCity || '—'} {serviceDistrict ? `(${serviceDistrict})` : ''}</span></div>
                <div className="flex justify-between"><span>Contact Name:</span><span>{fullName || '—'}</span></div>
                <div className="flex justify-between"><span>Contact Phone:</span><span>{phone || '—'}</span></div>
                <div className="flex justify-between"><span>Rate:</span><span className="text-blue-600 font-semibold">{priceLabel}</span></div>
                <div className="flex justify-between"><span>{anyHourly ? 'Estimated Total:' : 'Total:'}</span><span className="font-semibold text-gray-900">{selectedServices.length ? `NPR ${Number(estimatedTotal).toLocaleString('en-US')}${minimumChargeTotal > 0 && estimatedTotal < minimumChargeTotal ? ` (min NPR ${Number(minimumChargeTotal).toLocaleString('en-US')})` : ''}` : 'N/A'}</span></div>
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

      <aside className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 lg:p-6 h-fit sticky top-6">
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg px-4 py-3 mb-4 -mx-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span> Booking Summary
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Service</p>
            <p className="text-base font-semibold text-gray-900">{summaryServiceName}</p>
            {selectedServices.length > 0 && (
              <div className="mt-2 space-y-1">
                {selectedServices.map((s) => {
                  const isHourly = s.price_type === 'hourly';
                  const d = getServiceDurationHours(s) || (isHourly ? 1 : 0);
                  const rd = d ? Number(d.toFixed(1)) : null;
                  return (
                    <div key={s.id} className="flex items-center justify-between text-xs text-gray-700">
                      <span className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm ${isHourly ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white' : 'bg-linear-to-r from-slate-400 to-slate-500 text-white'}`}>{isHourly ? '⏱' : '📋'}</span>
                        {s.specialization_name || s.specialization?.name || s.title}
                      </span>
                      <span className="font-semibold text-gray-700">{rd ? `${rd}h` : '—'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-y border-gray-200 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Base Price</span>
              <span className="font-semibold text-gray-900">{formatNpr(effectiveBase)}</span>
            </div>
          </div>

          <div className="bg-linear-to-br from-blue-100 to-indigo-100 rounded-lg p-3 border-2 border-blue-300 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">💰 Estimated Amount</span>
              <span className="text-2xl font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{totalAmount != null ? `NPR ${Number(totalAmount).toLocaleString('en-US')}` : '—'}</span>
            </div>
          </div>

          <div className="bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 space-y-2 shadow-sm">
            <p className="text-sm font-semibold text-blue-900">Appointment Details</p>
            <div className="space-y-1 text-sm text-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold">{appointmentDateLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-semibold">{appointmentTimeLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration (provider est.)</span>
                <span className="font-semibold">{appointmentDuration}</span>
              </div>
            </div>
          </div>

          {/* <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-green-600">🛡️</span>
              <span>Service Guarantee Included</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🛠️</span>
              <span>Professional Equipment Provided</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-600">⏱️</span>
              <span>On-time Arrival Guaranteed</span>
            </div>
          </div> */}
        </div>
      </aside>
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
