import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaLocationArrow, FaTimes } from 'react-icons/fa';
import L from 'leaflet';

function LocationSelector({ value, onChange, error, disabled = false }) {
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [currentCoords, setCurrentCoords] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    // Build structured location payload
    const buildLocationPayload = (addressObj, lat, lng) => {
        const addr = addressObj || {};
        const payload = {
            formatted: addr.display_name || [addr.road, addr.suburb, addr.city || addr.town || addr.village, addr.state, addr.postcode, addr.country].filter(Boolean).join(', '),
            street: addr.road || '',
            city: addr.city || addr.town || addr.village || '',
            district: addr.state_district || addr.county || addr.state || '',
            postal_code: addr.postcode || '',
            latitude: lat,
            longitude: lng,
        };
        return payload;
    };

    // Reverse geocoding via Nominatim (no API key)
    const getReverseGeocode = async (lat, lng) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
            const resp = await fetch(url, {
                headers: {
                    // Nominatim requires identifying application via referer/user-agent; browser sets referer automatically
                }
            });
            const data = await resp.json();
            if (data && data.address) {
                const payload = buildLocationPayload({ ...data.address, display_name: data.display_name }, lat, lng);
                setSelectedAddress(payload);
                setCurrentCoords({ lat, lng });
                return payload;
            } else {
                setLocationError('Could not resolve address for selected location');
                return null;
            }
        } catch (err) {
            console.error('Reverse geocoding error:', err);
            setLocationError('Could not identify address at this location');
            return null;
        }
    };

    // Request browser geolocation
    // Helper to get position via Promises
    const getPosition = (options) => new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

    const handleUseCurrentLocation = async () => {
        setLocationLoading(true);
        setLocationError('');

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            setLocationLoading(false);
            return;
        }

        try {
            // Try high accuracy first (10s)
            const posHigh = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
            const { latitude, longitude } = posHigh.coords;
            const payload = await getReverseGeocode(latitude, longitude);
            if (payload) {
                setSelectedAddress(payload);
                onChange && onChange(payload);
                setShowMap(false);
            }
        } catch (err1) {
            console.warn('High-accuracy geolocation failed or timed out, retrying with lower accuracy:', err1);
            try {
                // Fallback: lower accuracy, longer timeout, allow cached positions (up to 10 min)
                const posLow = await getPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 });
                const { latitude, longitude } = posLow.coords;
                const payload = await getReverseGeocode(latitude, longitude);
                if (payload) {
                    setSelectedAddress(payload);
                    onChange && onChange(payload);
                    setShowMap(false);
                }
            } catch (err2) {
                console.error('Geolocation fallback error:', err2);
                setLocationError('Could not determine your location. Please use the map or search.');
            }
        }
        setLocationLoading(false);
    };

    // Forward geocoding via Nominatim
    const searchAddress = async (query) => {
        if (!query || query.length < 3) {
            return;
        }
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&countrycodes=np`;
            const resp = await fetch(url);
            const results = await resp.json();
            if (results && results.length > 0) {
                const item = results[0];
                const addr = item.address || {};
                const payload = buildLocationPayload({ ...addr, display_name: item.display_name }, parseFloat(item.lat), parseFloat(item.lon));
                setSelectedAddress(payload);
                setCurrentCoords({ lat: payload.latitude, lng: payload.longitude });
                
                // Update map if it's open
                if (mapInstanceRef.current && markerRef.current) {
                    markerRef.current.setLatLng([payload.latitude, payload.longitude]);
                    mapInstanceRef.current.setView([payload.latitude, payload.longitude], 14);
                }
                
                onChange && onChange(payload);
                // DON'T clear search input - keep it visible for user
            }
        } catch (err) {
            console.error('Forward geocoding error:', err);
        }
    };

    const handleSearchChange = (e) => {
        const input = e.target.value;
        setSearchInput(input);
        
        if (!input || input.trim().length === 0) {
            return;
        }
        
        // Trigger search immediately when user types (debounce handled by Nominatim timeout)
        if (input.length >= 3) {
            searchAddress(input);
        }
    };

    const clearInput = () => {
        setSearchInput('');
        setSelectedAddress(null);
        setCurrentCoords(null);
        onChange && onChange('');
    };

    const closeMap = () => {
        setShowMap(false);
        setSearchInput(''); // Clear search when closing modal
    };

    // Initialize map when showMap changes
    useEffect(() => {
        if (showMap && mapRef.current && !mapInstanceRef.current) {
            const defaultCoords = currentCoords || { lat: 27.7172, lng: 85.3240 }; // Kathmandu default
            
            try {
                // Fix Leaflet default marker icons
                delete L.Icon.Default.prototype._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });

                // Initialize Leaflet map
                const map = L.map(mapRef.current).setView(
                    [defaultCoords.lat, defaultCoords.lng],
                    12
                );

                // Add OpenStreetMap tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(map);

                mapInstanceRef.current = map;

                // Remove existing marker if any
                if (markerRef.current) {
                    map.removeLayer(markerRef.current);
                }

                // Add marker
                markerRef.current = L.marker([defaultCoords.lat, defaultCoords.lng], {
                    draggable: true,
                    title: 'Selected Location',
                }).addTo(map);

                // Handle marker drag end
                markerRef.current.on('dragend', async () => {
                    const latlng = markerRef.current.getLatLng();
                    const payload = await getReverseGeocode(latlng.lat, latlng.lng);
                    if (payload) {
                        setSelectedAddress(payload);
                        onChange && onChange(payload);
                    }
                });

                // Handle map click
                map.on('click', async (e) => {
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
                    
                    markerRef.current.setLatLng([lat, lng]);
                    const payload = await getReverseGeocode(lat, lng);
                    if (payload) {
                        setSelectedAddress(payload);
                        onChange && onChange(payload);
                    }
                });

                // Ensure map resizes properly
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            } catch (err) {
                console.error('Map initialization error:', err);
                setLocationError('Could not initialize map. Please try again.');
            }
        }

        return () => {
            // Cleanup map instance when modal closes
            if (!showMap && mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, [showMap]);

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                📍 Location *
            </label>

            {/* Location Display and Buttons */}
            <div className="space-y-3">
                {/* Address Input - Display Only */}
                <div className="relative">
                    <input
                        type="text"
                        value={selectedAddress?.formatted || (typeof value === 'object' ? value?.formatted : (value || ''))}
                        readOnly
                        placeholder="Click 'Open Map' to select location"
                        className={`w-full px-4 py-3 pl-10 border ${
                            error ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 cursor-pointer`}
                        disabled={disabled}
                    />
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    {selectedAddress?.formatted && (
                        <button
                            type="button"
                            onClick={clearInput}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                            aria-label="Clear"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={disabled || locationLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
                    >
                        <FaLocationArrow className={locationLoading ? 'animate-spin' : ''} />
                        {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                    </button>
                    <button
                        type="button"
                        onClick={() => showMap ? closeMap() : setShowMap(true)}
                        disabled={disabled}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
                    >
                        {showMap ? '✕ Close Map' : '🗺️ Open Map'}
                    </button>
                </div>

                {/* Error Message */}
                {(error || locationError) && (
                    <p className="text-red-500 text-xs mt-2">
                        {error || locationError}
                    </p>
                )}

                {/* Success Message */}
                {selectedAddress?.formatted && !error && (
                    <div className="text-green-600 text-xs mt-2">
                        <p className="flex items-center gap-1">✓ Selected: {selectedAddress.formatted}</p>
                        <div className="text-gray-600 mt-1">
                            {selectedAddress.city && <span>City: {selectedAddress.city} • </span>}
                            {selectedAddress.district && <span>District: {selectedAddress.district} • </span>}
                            {selectedAddress.postal_code && <span>Postal: {selectedAddress.postal_code}</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* Map Modal */}
            {showMap && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-96 flex flex-col">
                        {/* Header with search */}
                        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex-1">
                                📍 Select Your Location
                            </h3>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={handleSearchChange}
                                placeholder="Search address, city, district..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                            <button
                                onClick={() => closeMap()}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FaTimes className="text-gray-600" />
                            </button>
                        </div>

                        {/* Map Container */}
                        <div 
                            ref={mapRef}
                            className="flex-1 rounded-b-lg overflow-hidden"
                            style={{ minHeight: '300px' }}
                        />

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

export default LocationSelector;
