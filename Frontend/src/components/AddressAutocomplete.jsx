import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaLocationArrow, FaTimes } from 'react-icons/fa';
import L from 'leaflet';

// Address autocomplete input with dropdown suggestions (same design as BookingPage)
// On selection, emits a structured payload: { formatted, city, district, postal_code, latitude, longitude }
function AddressAutocomplete({
  label = 'Location *',
  placeholder = 'Enter your address (e.g., city, street, landmark)',
  value,
  onChange,
  disabled = false,
  required = true,
  id = 'registrationAddress'
}) {
  const initialText = useMemo(() => {
    if (typeof value === 'object' && value?.formatted) return value.formatted;
    if (typeof value === 'string') return value;
    return '';
  }, [value]);

  const [input, setInput] = useState(initialText);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const skipSearchRef = useRef(false); // Flag to prevent debounce after geolocation or selection

  // Map + geolocation states
  const [showMap, setShowMap] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [currentCoords, setCurrentCoords] = useState(() => {
    if (typeof value === 'object' && value?.latitude && value?.longitude) {
      return { lat: value.latitude, lng: value.longitude };
    }
    return null;
  });

  useEffect(() => {
    // Keep input in sync if parent changes value externally
    if (initialText !== input) {
      setInput(initialText || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  // Fetch address suggestions for autocomplete (top 5) – matches BookingPage API and design
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

  // Build structured payload similar to LocationSelector
  const buildPayload = (displayName, addressObj, lat, lng) => {
    const addr = addressObj || {};
    return {
      formatted: displayName || [addr.road, addr.suburb, addr.city || addr.town || addr.village, addr.state, addr.postcode, addr.country].filter(Boolean).join(', '),
      city: addr.city || addr.town || addr.village || '',
      district: addr.state_district || addr.county || addr.state || '',
      postal_code: addr.postcode || '',
      latitude: lat,
      longitude: lng,
    };
  };

  // On selecting a suggestion, reverse-geocode to get addressdetails for structured payload
  const completeSelection = async (sugg) => {
    try {
      const revUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${sugg.lat}&lon=${sugg.lng}&addressdetails=1`;
      const resp = await fetch(revUrl, { headers: { Accept: 'application/json' } });
      const data = await resp.json();
      const payload = buildPayload(data?.display_name || sugg.label, data?.address, sugg.lat, sugg.lng);
      skipSearchRef.current = true; // Prevent re-search after setting input
      setInput(payload.formatted || sugg.label);
      setOpen(false);
      setSuggestions([]);
      setError(null);
      // Update map if open
      setCurrentCoords({ lat: payload.latitude, lng: payload.longitude });
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([payload.latitude, payload.longitude]);
        mapInstanceRef.current.setView([payload.latitude, payload.longitude], 14);
      }
      onChange && onChange(payload);
    } catch (e) {
      console.error('Reverse geocoding failed:', e);
      // Fall back to minimal payload based on suggestion
      const payload = buildPayload(sugg.label, {}, sugg.lat, sugg.lng);
      skipSearchRef.current = true; // Prevent re-search after setting input
      setInput(payload.formatted);
      setOpen(false);
      setSuggestions([]);
      setCurrentCoords({ lat: payload.latitude, lng: payload.longitude });
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([payload.latitude, payload.longitude]);
        mapInstanceRef.current.setView([payload.latitude, payload.longitude], 14);
      }
      onChange && onChange(payload);
    }
  };

  // Debounced suggestions as user types (only if user manually entered text, not after selection/geolocation)
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false; // Reset flag for next input
      return;
    }

    const query = input?.trim();
    if (!query || query.length < 3) {
      setSuggestions([]);
      setError(null);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const s = await fetchAddressSuggestions(query);
        if (cancelled) return;
        setSuggestions(s);
        setError(null);
        setOpen(s.length > 0);
      } catch (err) {
        if (cancelled) return;
        console.error('Suggestion fetch failed', err);
        setError('Could not fetch suggestions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input]);

  // Reverse geocoding helper (lat/lng → payload)
  const reverseToPayload = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
      const resp = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await resp.json();
      return buildPayload(data?.display_name, data?.address, lat, lng);
    } catch {
      return buildPayload(null, {}, lat, lng);
    }
  };

  // Simple forward search for map header (type → first result)
  const searchAddress = async (query) => {
    if (!query || query.length < 3) return null;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=np&q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (Array.isArray(data) && data.length) {
      const first = data[0];
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);
      const payload = await reverseToPayload(lat, lng);
      return payload;
    }
    return null;
  };

  // Use current location flow
  const getPosition = (options) => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const payload = await reverseToPayload(latitude, longitude);
          skipSearchRef.current = true; // Prevent re-search after setting input
          setInput(payload.formatted || '');
          setCurrentCoords({ lat: payload.latitude, lng: payload.longitude });
          setSuggestions([]); // Clear any existing suggestions
          setOpen(false); // Close dropdown
          if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([payload.latitude, payload.longitude]);
            mapInstanceRef.current.setView([payload.latitude, payload.longitude], 14);
          }
          onChange && onChange(payload);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error', err);
        let errorMsg = 'Failed to get current location';
        if (err.code === 1) errorMsg = 'Location access denied. Please enable location permissions.';
        else if (err.code === 2) errorMsg = 'Location unavailable. Check your device settings.';
        else if (err.code === 3) errorMsg = 'Location request timed out. Please try again (ensure GPS is on and stay still).';
        setError(errorMsg);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  // Initialize map when opening modal
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstanceRef.current) {
      const defaultCoords = currentCoords || { lat: 27.7172, lng: 85.3240 };
      try {
        // Fix Leaflet default marker icons
        // eslint-disable-next-line no-underscore-dangle
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current).setView([defaultCoords.lat, defaultCoords.lng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;

        if (markerRef.current) map.removeLayer(markerRef.current);
        markerRef.current = L.marker([defaultCoords.lat, defaultCoords.lng], { draggable: true }).addTo(map);

        markerRef.current.on('dragend', async () => {
          const latlng = markerRef.current.getLatLng();
          const payload = await reverseToPayload(latlng.lat, latlng.lng);
          skipSearchRef.current = true; // Prevent re-search after setting input
          setInput(payload.formatted || '');
          setCurrentCoords({ lat: payload.latitude, lng: payload.longitude });
          onChange && onChange(payload);
        });

        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          markerRef.current.setLatLng([lat, lng]);
          const payload = await reverseToPayload(lat, lng);
          skipSearchRef.current = true; // Prevent re-search after setting input
          setInput(payload.formatted || '');
          setCurrentCoords({ lat: payload.latitude, lng: payload.longitude });
          onChange && onChange(payload);
        });

        setTimeout(() => map.invalidateSize(), 100);
      } catch (err) {
        console.error('Map init error', err);
        setError('Could not initialize map');
      }
    }

    return () => {
      if (!showMap && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap]);

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {loading && (
        <p className="text-xs text-gray-500 mt-1">Fetching location suggestions...</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
      {open && suggestions.length > 0 && (
        <div className="mt-1 border border-gray-200 rounded-md shadow bg-white max-h-48 overflow-y-auto divide-y divide-gray-100 z-20 relative">
          {suggestions.map((s, idx) => (
            <div
              key={`${s.label}-${idx}`}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-green-50"
              onMouseDown={() => completeSelection(s)}
            >
              <p className="text-gray-900 font-semibold line-clamp-1">{s.label}</p>
              <p className="text-xs text-gray-500">{s.lat.toFixed(5)}, {s.lng.toFixed(5)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled || geoLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
        >
          <FaLocationArrow className={geoLoading ? 'animate-spin' : ''} />
          {geoLoading ? 'Getting Location...' : 'Use Current Location'}
        </button>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          disabled={disabled}
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
        >
          {showMap ? '✕ Close Map' : '🗺️ Open Map'}
        </button>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-96 flex flex-col">
            {/* Header with search */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex-1">📍 Select Your Location</h3>
              <input
                type="text"
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const payload = await searchAddress(mapSearch);
                    if (payload) {
                      skipSearchRef.current = true; // Prevent re-search after setting input
                      setInput(payload.formatted || '');
                      setCurrentCoords({ lat: payload.latitude, lng: payload.longitude });
                      if (mapInstanceRef.current && markerRef.current) {
                        markerRef.current.setLatLng([payload.latitude, payload.longitude]);
                        mapInstanceRef.current.setView([payload.latitude, payload.longitude], 14);
                      }
                      onChange && onChange(payload);
                    }
                  }
                }}
                placeholder="Search address, city, district..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                onClick={() => setShowMap(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-600" />
              </button>
            </div>

            {/* Map Container */}
            <div ref={mapRef} className="flex-1 rounded-b-lg overflow-hidden" style={{ minHeight: '300px' }} />

            {/* Instructions */}
            <div className="bg-blue-50 border-t border-gray-200 p-3 text-xs text-gray-700">
              <p>💡 Click on the map to select a location or drag the marker</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
