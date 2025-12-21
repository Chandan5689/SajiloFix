# Location Feature - Architecture & Flow Diagrams

## 🏗️ Component Architecture

```
App
├── Router
│   ├── /register (ClerkRegister)
│   │   ├── Step 1: User Info
│   │   │   └── LocationSelector ← NEW
│   │   ├── Step 2: Email Verification
│   │   └── Step 3: Phone Verification
│   │
│   └── /verify-phone (VerifyPhoneFlow)
│       ├── User Type Selection
│       └── Location Selection
│           └── LocationSelector ← UPDATED
│
└── PhoneVerification
    └── Completes after location set
```

## 📊 LocationSelector Component Structure

```
LocationSelector Component
│
├── State Management
│   ├── locationLoading (boolean)
│   ├── locationError (string)
│   ├── showMap (boolean)
│   ├── currentCoords ({ lat, lng })
│   ├── selectedCity (string)
│   ├── searchInput (string)
│   └── suggestedLocations (array)
│
├── UI Sections
│   ├── Location Input
│   │   └── Shows: Map Icon + Current/Selected Location
│   │
│   ├── Quick Action Buttons
│   │   ├── 📍 Use Current Location
│   │   │   └── Triggers: navigator.geolocation.getCurrentPosition()
│   │   │
│   │   └── 🗺️ Open Map
│   │       └── Shows: MapModal
│   │
│   ├── Search Suggestions Dropdown
│   │   └── Shows: Filtered Cities
│   │
│   └── Map Modal (when showMap = true)
│       ├── Map Container
│       │   └── Google Maps Instance
│       ├── Marker
│       │   └── Draggable: true
│       └── Interactions
│           ├── Click: Set marker location
│           └── Drag: Update location
│
└── Data Sources
    └── NEPAL_CITIES (15 predefined cities)
```

## 🔄 Data Flow Diagrams

### Flow 1: Geolocation (Current Location)

```
┌─────────────────────────────────────────┐
│ User clicks "Use Current Location"      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ browser.geolocation.getCurrentPosition()│
└────────────┬────────────────────────────┘
             │
             ├─── On Success ──────────────┐
             │                            │
             ▼                            ▼
       ┌──────────────┐        ┌──────────────────────┐
       │ Get lat, lng │        │ Handle Error/Timeout │
       └────────┬─────┘        └──────────┬───────────┘
                │                         │
                ▼                         ▼
       ┌──────────────────┐      ┌──────────────────┐
       │ getReverseGeocode│      │ Show Error Msg   │
       │ Find closest city│      │ Set locationError│
       └────────┬─────────┘      └──────────────────┘
                │
                ├─── Within 50km ─────────┐
                │                        │
                ▼                        ▼
        ┌──────────────┐         ┌──────────────────┐
        │ Match found! │         │ Outside Nepal    │
        │ Set city     │         │ Show error       │
        │ Call onChange│         │ Allow other ways │
        └──────────────┘         └──────────────────┘
                │
                ▼
        ┌──────────────┐
        │ closeMap()   │
        │ Stop loading │
        └──────────────┘
                │
                ▼
        ┌──────────────────────┐
        │ User sees:           │
        │ ✓ Selected: Kathmandu│
        └──────────────────────┘
```

### Flow 2: Map Selection

```
┌──────────────────────────┐
│ User clicks "Open Map"   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ setShowMap(true)         │
│ Open Map Modal           │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ useEffect - Initialize   │
│ Google Maps Instance     │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Load Map with Default Coords     │
│ Place Marker at Default Location │
└────────────┬─────────────────────┘
             │
             ├─── User Interaction ─────────────────┐
             │                                      │
             ▼                                      ▼
    ┌─────────────────┐                  ┌─────────────────┐
    │ User Clicks     │                  │ User Drags      │
    │ on Map          │                  │ Marker          │
    └────────┬────────┘                  └────────┬────────┘
             │                                    │
             ├───────────────┬────────────────────┘
             │               │
             ▼               ▼
    ┌──────────────────────────────┐
    │ Update Marker Position       │
    │ Get new lat, lng             │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ getReverseGeocode            │
    │ Find closest city            │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Set selectedCity             │
    │ Call onChange with city      │
    └──────────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ User closes map              │
    │ setShowMap(false)            │
    └──────────────────────────────┘
```

### Flow 3: Search & Filter

```
┌──────────────────────────┐
│ User types in input      │
│ e.g., "kathmandu"        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ handleSearchChange()     │
│ searchInput updated      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Filter NEPAL_CITIES array        │
│ Case-insensitive match:          │
│ - City name contains input OR   │
│ - District contains input        │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ setSuggestedLocations(filtered)  │
│ Show dropdown below input        │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────┐
│ User clicks suggestion   │
│ e.g., "Kathmandu"        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ handleSelectCity()               │
│ setSelectedCity(cityName)        │
│ setCurrentCoords(lat, lng)       │
│ Call onChange(cityName)          │
│ Clear search input               │
│ Hide suggestions                 │
└──────────────────────────────────┘
                │
                ▼
        ┌──────────────────────┐
        │ User sees:           │
        │ ✓ Selected: Kathmandu│
        └──────────────────────┘
```

## 🔄 Integration with Registration Flow

```
Registration Flow (ClerkRegister.jsx)
│
├── Step 1: Email Signup
│   │
│   ├─ User Type: "Find Services" or "Offer Services"
│   │
│   ├─ Personal Info
│   │   ├─ First Name
│   │   ├─ Last Name
│   │   └─ Email
│   │
│   ├─ Location Selection ← LocationSelector Component
│   │   ├─ Use Current Location
│   │   ├─ Open Interactive Map
│   │   └─ Search by City Name
│   │
│   ├─ Password
│   │   ├─ Password (8+ chars)
│   │   └─ Confirm Password
│   │
│   └─ [Continue to Email Verification]
│
├── Step 2: Email Verification
│   │
│   ├─ User receives email with code
│   ├─ Enters 6-digit code
│   └─ [Verify Email & Continue]
│
└── Step 3: Phone Verification
    │
    ├─ User enters phone number
    ├─ Receives OTP
    ├─ Enters OTP
    ├─ Backend saves all info (including location)
    └─ [Redirect to Dashboard]
```

## 🌍 Reverse Geocoding Algorithm

```
Input: GPS Coordinates (lat, lng)
│
▼
FOR EACH city IN NEPAL_CITIES:
│
├─ Calculate distance using Pythagorean theorem:
│ distance = √((city.lat - user.lat)² + (city.lng - user.lng)²)
│
├─ Track minimum distance and closest city
│
▼
Output: closestCity

IF distance < 0.5 degrees (~50km):
│   ✓ Return: closestCity name
│   └─ Update location and trigger onChange()
ELSE:
    ✗ Show error: "Outside major cities"
    └─ Allow user to try other methods
```

## 📊 State Transitions

```
Initial State:
{
  locationLoading: false,
  locationError: '',
  showMap: false,
  currentCoords: null,
  selectedCity: '',
  searchInput: '',
  suggestedLocations: []
}

                    ▼

User clicks "Use Current Location":
{
  locationLoading: true,  ← Shows spinner
  locationError: '',
  showMap: false,
  currentCoords: null,
  selectedCity: '',
  searchInput: '',
  suggestedLocations: []
}

                    ▼

Success - City Detected:
{
  locationLoading: false,
  locationError: '',
  showMap: false,          ← Close map if open
  currentCoords: {lat, lng},
  selectedCity: 'Kathmandu',  ← Store selection
  searchInput: '',
  suggestedLocations: []
}

                    ▼

User types in search:
{
  locationLoading: false,
  locationError: '',
  showMap: false,
  currentCoords: {lat, lng},
  selectedCity: 'Kathmandu',
  searchInput: 'pok',      ← Partial input
  suggestedLocations: [{name: 'Pokhara', ...}]  ← Filtered results
}
```

## 🎯 Error Handling Flowchart

```
Action: Get User Location
│
▼
Is geolocation supported?
├─ NO → "Geolocation not supported"
│       └─ Suggest: Use map or search
│
└─ YES
    │
    ▼
    Request location permission
    │
    ├─ User Denies
    │  └─ "Location permission denied"
    │     "Enable in browser settings"
    │     └─ Suggest: Use map or search
    │
    └─ User Allows
        │
        ▼
        Wait for GPS signal (timeout: 10s)
        │
        ├─ Timeout/Error
        │  └─ "Request timed out"
        │     └─ Suggest: Retry or use map
        │
        └─ Success
            │
            ▼
            Get coordinates (lat, lng)
            │
            ▼
            Find nearest city
            │
            ├─ Within 50km
            │  └─ ✓ Select that city
            │
            └─ Outside range
               └─ "Location outside major cities"
                  └─ Suggest: Use map or search
```

## 📱 Responsive Breakpoints

```
Mobile (< 768px):
├─ Full width location input
├─ Stacked buttons
├─ Map modal takes 90vw width
└─ Search suggestions full width

Tablet (768px - 1024px):
├─ 90% width
├─ Buttons side-by-side
├─ Map modal 600px width
└─ Search 80% width

Desktop (> 1024px):
├─ Fixed max-width (400px)
├─ Buttons side-by-side
├─ Map modal 700px width
└─ Search 100% width
```

## 🔗 Database Integration

```
Frontend (LocationSelector)
│
├─ Collects: location (city name)
│
▼
PhoneVerification Component
│
├─ Sends to backend: {
│     phone_number: "+977XXXXXXXXXX",
│     firebase_uid: "user123",
│     user_type: "find",
│     location: "Kathmandu"
│   }
│
▼
Backend (Django)
│
├─ Endpoint: POST /auth/verify-phone/
├─ Endpoint: POST /auth/update-user-type/
│
▼
Database (PostgreSQL)
│
└─ Stores in users table:
   {
     location: "Kathmandu",
     user_type: "find",
     phone_verified: true,
     ...
   }
```

This architecture ensures:
- ✅ Modular component design
- ✅ Reusable across registration flows
- ✅ Clear error handling
- ✅ Graceful degradation
- ✅ Responsive design
- ✅ Proper data flow to backend
