# Location Feature - Code Examples & Common Tasks

## 📚 Usage Examples

### Example 1: Basic Implementation (What You Already Have)

```jsx
// ClerkRegister.jsx
import LocationSelector from '../../components/LocationSelector';

function ClerkRegister() {
  const [location, setLocation] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  return (
    <LocationSelector 
      value={location}
      onChange={(value) => {
        setLocation(value);
        if (fieldErrors.location) {
          setFieldErrors({...fieldErrors, location: ''});
        }
      }}
      error={fieldErrors.location}
      disabled={loading}
    />
  );
}
```

### Example 2: Accessing Location in Parent Component

```jsx
function MyRegistrationForm() {
  const [selectedCity, setSelectedCity] = useState('');

  const handleLocationChange = (city) => {
    console.log('User selected:', city);
    setSelectedCity(city);
    // Do something with the city
  };

  return (
    <LocationSelector 
      value={selectedCity}
      onChange={handleLocationChange}
      error=""
    />
  );
}
```

### Example 3: Validating Location

```jsx
function RegistrationForm() {
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState({});

  const validateLocation = (loc) => {
    if (!loc || loc.trim() === '') {
      setErrors(prev => ({
        ...prev,
        location: 'Location is required'
      }));
      return false;
    }
    
    setErrors(prev => ({
      ...prev,
      location: ''
    }));
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateLocation(location)) {
      return;
    }

    // Proceed with registration
    console.log('Location validated:', location);
  };

  return (
    <form onSubmit={handleSubmit}>
      <LocationSelector 
        value={location}
        onChange={setLocation}
        error={errors.location}
      />
      <button type="submit">Continue</button>
    </form>
  );
}
```

### Example 4: Conditional Rendering Based on Location

```jsx
function LocationBasedFeature() {
  const [location, setLocation] = useState('');

  return (
    <div>
      <LocationSelector 
        value={location}
        onChange={setLocation}
      />

      {location === 'Kathmandu' && (
        <div>Special offer for Kathmandu!</div>
      )}

      {location === 'Pokhara' && (
        <div>Popular services in Pokhara</div>
      )}

      {location && (
        <div>Services available in {location}</div>
      )}
    </div>
  );
}
```

## 🔧 Common Customizations

### Customize 1: Add More Cities

**File**: `LocationSelector.jsx` (Lines 16-32)

```jsx
// Add to NEPAL_CITIES array:
const NEPAL_CITIES = [
  // ... existing cities ...
  { name: 'YourNewCity', lat: 27.XXXX, lng: 85.XXXX, district: 'DistrictName' },
];
```

**Get coordinates from**: [Google Maps](https://maps.google.com/)
- Right-click on location → See coordinates at bottom

### Customize 2: Change Default Map Location

**File**: `LocationSelector.jsx` (Line 151)

```jsx
// Change from Kathmandu to your preferred city:
const defaultCoords = currentCoords || { lat: 28.2096, lng: 83.9856 }; // Pokhara
```

### Customize 3: Adjust Geolocation Accuracy

**File**: `LocationSelector.jsx` (Line 99)

```jsx
navigator.geolocation.getCurrentPosition(
  onSuccess,
  onError,
  {
    enableHighAccuracy: true,   // ← Set to false for faster but less accurate
    timeout: 10000,              // ← Increase to 15000 for longer wait
    maximumAge: 0,              // ← Set to 5000 to use cached if available
  }
);
```

### Customize 4: Change Matching Distance Threshold

**File**: `LocationSelector.jsx` (Line 57)

```jsx
// Current: within ~50km (0.5 degrees)
if (minDistance < 0.5) { // ← Adjust this value
  setSelectedCity(closestCity.name);
} else {
  setLocationError('Location outside supported area');
}
```

### Customize 5: Customize Error Messages

**File**: `LocationSelector.jsx` (Lines 205-210)

```jsx
// Modify these messages:
setLocationError('Location permission denied. Please enable it in your browser settings.');
setLocationError('Location information is unavailable.');
setLocationError('The request to get user location timed out.');
setLocationError('Selected location is outside major cities in Nepal');
```

### Customize 6: Change Map Modal Size

**File**: `LocationSelector.jsx` (Line 275)

```jsx
{/* Adjust the modal size */}
<div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-96 flex flex-col">
  {/* Change max-w-2xl to max-w-3xl, max-w-4xl, etc. */}
  {/* Change h-96 to h-80, h-screen, etc. */}
</div>
```

## 🎨 Styling Customizations

### Change Button Colors

```jsx
// In LocationSelector.jsx, find button styling:

// "Use Current Location" button
<button className="... bg-blue-600 hover:bg-blue-700 ...">

// "Open Map" button
<button className="... bg-green-600 hover:bg-green-700 ...">

// Change blue-600/700 and green-600/700 to your colors
```

### Change Input Styling

```jsx
// Find input element styling:
<input className="... border-gray-300 focus:ring-blue-500 ..." />

// Modify Tailwind classes:
// border-gray-300 → border-red-300
// focus:ring-blue-500 → focus:ring-purple-500
```

## 🔌 Integration Examples

### Example 1: With Backend API Call

```jsx
async function handleRegistration() {
  try {
    // LocationSelector updates state
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        firstName: firstName,
        lastName: lastName,
        location: selectedLocation,  // From LocationSelector
        password: password,
      }),
    });

    if (response.ok) {
      console.log('Registration successful!');
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
}
```

### Example 2: With Form Validation Library

```jsx
import { useForm, Controller } from 'react-hook-form';
import LocationSelector from './LocationSelector';

function RegistrationForm() {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      location: '',
    },
  });

  const onSubmit = (data) => {
    console.log('Form data:', data);
    // data.location will contain the selected city
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="location"
        control={control}
        rules={{ required: 'Location is required' }}
        render={({ field }) => (
          <LocationSelector 
            value={field.value}
            onChange={field.onChange}
            error={errors.location?.message}
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Example 3: With Redux

```jsx
import { useDispatch, useSelector } from 'react-redux';

function RegistrationStep() {
  const dispatch = useDispatch();
  const location = useSelector(state => state.registration.location);

  const handleLocationChange = (city) => {
    dispatch({
      type: 'SET_LOCATION',
      payload: city,
    });
  };

  return (
    <LocationSelector 
      value={location}
      onChange={handleLocationChange}
    />
  );
}
```

### Example 4: With Context API

```jsx
import { useContext } from 'react';
import { RegistrationContext } from './RegistrationContext';

function LocationStep() {
  const { location, setLocation } = useContext(RegistrationContext);

  return (
    <LocationSelector 
      value={location}
      onChange={setLocation}
    />
  );
}
```

## 🧪 Testing Examples

### Unit Test Example (Jest + React Testing Library)

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationSelector from './LocationSelector';

describe('LocationSelector', () => {
  test('renders location input field', () => {
    render(<LocationSelector value="" onChange={() => {}} error="" />);
    const input = screen.getByPlaceholderText('Select or search for your location');
    expect(input).toBeInTheDocument();
  });

  test('calls onChange when location is selected', async () => {
    const mockChange = jest.fn();
    render(
      <LocationSelector 
        value="" 
        onChange={mockChange} 
        error="" 
      />
    );
    
    const input = screen.getByPlaceholderText('Select or search for your location');
    fireEvent.change(input, { target: { value: 'Kathmandu' } });
    
    await waitFor(() => {
      expect(mockChange).toHaveBeenCalled();
    });
  });

  test('displays error message when provided', () => {
    render(
      <LocationSelector 
        value="" 
        onChange={() => {}} 
        error="Location is required" 
      />
    );
    
    expect(screen.getByText('Location is required')).toBeInTheDocument();
  });

  test('shows success message when location is selected', async () => {
    const { rerender } = render(
      <LocationSelector 
        value="" 
        onChange={() => {}} 
        error="" 
      />
    );
    
    rerender(
      <LocationSelector 
        value="Kathmandu" 
        onChange={() => {}} 
        error="" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('✓ Selected: Kathmandu')).toBeInTheDocument();
    });
  });
});
```

### Integration Test Example

```javascript
describe('Registration with Location Selection', () => {
  test('complete registration flow with location', async () => {
    render(<ClerkRegister />);
    
    // Select user type
    fireEvent.click(screen.getByText('🔍 Find Services'));
    
    // Fill basic info
    fireEvent.change(screen.getByPlaceholderText('John'), { 
      target: { value: 'John' } 
    });
    // ... fill other fields ...
    
    // Select location
    const locationInput = screen.getByPlaceholderText('Select or search for your location');
    fireEvent.change(locationInput, { target: { value: 'Kathmandu' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Continue to Email Verification'));
    
    // Verify location was saved
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Kathmandu',
        })
      );
    });
  });
});
```

## 📊 Debugging Tips

### Log Location Changes

```jsx
const handleLocationChange = (city) => {
  console.log('📍 Location changed to:', city);
  console.log('Type:', typeof city);
  console.log('Length:', city.length);
  setLocation(city);
};
```

### Check Component Props

```jsx
function LocationSelector({ value, onChange, error, disabled = false }) {
  console.log('🔍 LocationSelector Props:', {
    value,
    onChange: onChange.toString(),
    error,
    disabled,
  });
  
  // ... rest of component
}
```

### Monitor Geolocation

```jsx
const handleUseCurrentLocation = async () => {
  console.log('🛰️ Starting geolocation...');
  console.log('Permissions API available:', !!navigator.permissions);
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log('✅ Position obtained:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toLocaleString(),
      });
    },
    (error) => {
      console.log('❌ Geolocation error:', {
        code: error.code,
        message: error.message,
      });
    }
  );
};
```

## 🚀 Performance Optimization

### Lazy Load Google Maps

```jsx
useEffect(() => {
  if (showMap && !mapInstanceRef.current && window.google?.maps) {
    console.log('⏳ Initializing map...');
    // Load map only when needed
    initializeMap();
  }
}, [showMap]);
```

### Debounce Search Input

```jsx
import { useMemo } from 'react';

const handleSearchChange = useMemo(() => {
  let timeout;
  
  return (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const input = e.target.value;
      const filtered = NEPAL_CITIES.filter(city =>
        city.name.toLowerCase().includes(input.toLowerCase())
      );
      setSuggestedLocations(filtered);
    }, 300); // Wait 300ms before filtering
  };
}, []);
```

## 📱 Mobile-Specific Code

### Detect Mobile Device

```jsx
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

useEffect(() => {
  if (isMobile) {
    console.log('📱 Mobile device detected');
    // Adjust for mobile
  }
}, []);
```

### Handle HTTPS Requirement

```jsx
const canUseGeolocation = () => {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    // Check if HTTPS or localhost
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      return true;
    }
    console.warn('⚠️ Geolocation requires HTTPS');
    return false;
  }
  return false;
};
```

---

**These examples provide a solid foundation for integrating and customizing the location feature in your application!**
