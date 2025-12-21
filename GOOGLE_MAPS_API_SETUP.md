# Environment Variables Setup

## Frontend Setup

Create a `.env.local` file in the Frontend directory and add:

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## To Get Google Maps API Key

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key in Credentials
5. Add domain restrictions for security

## To Use in Frontend

### Update index.html

Once you have your API key, update the Google Maps script in `index.html`:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"></script>
```

### Alternative: Load from Vite Env (Recommended)

If you prefer to manage it through environment variables, update `index.html` to dynamically load:

```html
<script>
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  document.head.appendChild(script);
</script>
```

Then update LocationSelector.jsx to check for the API key before using maps.

## Quick Start

1. Copy your Google Maps API key
2. Replace `YOUR_ACTUAL_API_KEY` in `index.html`
3. Test location features in registration

## Security Notes

⚠️ **Important**: Never commit API keys to version control!

- Add `.env.local` and `.env*.local` to `.gitignore`
- Use environment-specific keys in production
- Restrict API key to your domain
- Monitor usage in Google Cloud Console
