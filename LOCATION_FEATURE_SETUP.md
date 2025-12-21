# Location Feature Setup Guide

## Overview
A comprehensive location selection feature has been added to the registration process with:
- Browser geolocation API integration
- Interactive Google Maps
- Real-time city detection and reverse geocoding
- Support for 15+ major Nepal cities
- Permission request handling

## Features

### 1. **Geolocation Button**
- Requests browser permission to access user's current location
- Shows "Use Current Location" button
- Automatically detects the nearest city
- Handles permission denials gracefully

### 2. **Interactive Map**
- Opens a modal with an embedded Google Map
- Users can click on the map to select locations
- Draggable marker for precise location selection
- Shows selected city automatically

### 3. **Search & Autocomplete**
- Type to search for cities
- Shows matching cities and districts
- Quick selection from dropdown

### 4. **Supported Cities**
The system includes 15 major cities across Nepal:
- Kathmandu
- Pokhara
- Lalitpur
- Bhaktapur
- Biratnagar
- Bharatpur
- Nepalgunj
- Janakpur
- Birgunj
- Hetauda
- Dhulikhel
- Dharan
- Ilam
- Damak
- Itahari

## Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API (for autocomplete)
   - Geocoding API (for reverse geocoding)
4. Create an API key:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

### Step 2: Configure API Key in Frontend

Update the Google Maps script in `index.html`:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places"></script>
```

Replace `YOUR_ACTUAL_API_KEY` with your actual API key.

### Step 3: Set API Key Restrictions (Recommended)

For security, restrict your API key:
1. In Google Cloud Console, go to Credentials
2. Click your API key
3. Under "Key restrictions", select "HTTP referrers"
4. Add your domain(s):
   - `localhost:5173` (for development)
   - `yourdomain.com` (for production)

### Step 4: Test the Feature

1. Run the frontend: `npm run dev`
2. Go to registration page
3. Test the three location methods:
   - **Current Location**: Click button, allow permission in browser
   - **Map**: Click "Open Map" button, click or drag to select
   - **Search**: Type city name to filter and select

## Browser Geolocation Permissions

The system requests geolocation permissions with:
- High accuracy enabled
- 10-second timeout
- No cached positions

Users will see a browser prompt asking for permission. If denied:
- Show clear error message
- Allow alternative methods (map or search)
- Instructions to enable in browser settings

### Permission Messages

| Scenario | Message |
|----------|---------|
| Permission Denied | "Location permission denied. Please enable it in your browser settings." |
| Unavailable | "Location information is unavailable." |
| Timeout | "The request to get user location timed out." |
| Outside Nepal | "Selected location is outside major cities in Nepal" |

## File Structure

```
Frontend/
├── src/
│   ├── components/
│   │   └── LocationSelector.jsx (New component)
│   └── pages/
│       └── Auth/
│           ├── ClerkRegister.jsx (Updated)
│           └── VerifyPhoneFlow.jsx (Updated)
├── index.html (Updated with Google Maps script)
└── package.json
```

## Component Props

### LocationSelector Component

```jsx
<LocationSelector 
  value={location}              // Current location value
  onChange={handleChange}       // Callback when location changes
  error={errorMessage}          // Error message to display
  disabled={false}              // Disable all interactions
/>
```

## Integration Points

### ClerkRegister.jsx
- Replaces the plain text input
- Integrated into Step 1 (Registration form)
- Updates `location` state on selection

### VerifyPhoneFlow.jsx
- Replaces the predefined city button list
- Provides flexible location selection
- Works for post-login phone verification flow

## Features Breakdown

### 1. Geolocation (Browser API)
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => { /* success */ },
  (error) => { /* error handling */ },
  { enableHighAccuracy: true, timeout: 10000 }
)
```

### 2. Reverse Geocoding
- Calculates distance from user location to each predefined city
- Matches to closest city within ~50km
- Handles cities outside coverage gracefully

### 3. Map Interaction
- Click anywhere to select location
- Drag marker for fine-tuning
- Real-time city detection on marker drag

### 4. Search Functionality
- Case-insensitive filtering
- Searches both city name and district
- Dropdown suggestions

## Error Handling

The component handles:
- ✓ Browser doesn't support geolocation
- ✓ User denies location permission
- ✓ Location data unavailable
- ✓ Request timeout
- ✓ Location outside supported cities
- ✓ Google Maps not loaded
- ✓ Invalid map container

## Privacy & Security

- Geolocation data is requested with explicit permission
- Users can deny permission at any time
- Location is sent to backend only after registration
- HTTPS recommended for production
- API key is restricted to your domain

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not showing | Check if Google Maps API key is correct and enabled |
| "Geolocation not supported" | Use older browser or enable APIs |
| Permission request not appearing | Check browser privacy settings |
| City not detected | Location might be outside supported cities |
| Map loads but no markers | Ensure map container div has proper dimensions |

## Future Enhancements

- [ ] Add more cities to the supported list
- [ ] Implement custom reverse geocoding API
- [ ] Add address autocomplete from Google Places
- [ ] Store precise latitude/longitude in backend
- [ ] Show service provider count in selected location
- [ ] Implement location-based search radius

## Testing Checklist

- [ ] Geolocation permission request works
- [ ] Map opens and renders correctly
- [ ] Can click on map to select location
- [ ] Can drag marker to change location
- [ ] City detection works for all 15 cities
- [ ] Search autocomplete filters correctly
- [ ] Error messages display properly
- [ ] Works on mobile browsers
- [ ] Works with HTTPS (for production)
- [ ] Graceful fallback when Google Maps unavailable
