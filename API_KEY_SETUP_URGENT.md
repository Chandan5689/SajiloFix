# 🔴 URGENT: Next Step - Add Google Maps API Key

## ⏱️ Time Required: 5 MINUTES

### Step 1: Get Your API Key (3 mins)

1. Go to: https://console.cloud.google.com/
2. Click "Select a Project" → "New Project"
3. Enter name: `SajiloFix`
4. Click "Create"
5. Search bar → "Maps JavaScript API"
6. Click result → "Enable"
7. Repeat for "Places API" and "Geocoding API"
8. Left sidebar → "Credentials"
9. "Create Credentials" → "API Key"
10. Copy the key

### Step 2: Add to Code (1 min)

**File**: `Frontend/index.html`

**Find this line:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
```

**Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key from Step 1**

Example:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSy_xAbC123defGHIjklMNOpq_R456sTu&libraries=places"></script>
```

### Step 3: Test (1 min)

```bash
cd Frontend
npm run dev
```

Go to: http://localhost:5173/register

Try location methods:
- ✅ Click "Use Current Location"
- ✅ Click "Open Map"
- ✅ Type "Kathmandu"

## ✨ That's It!

Your location feature is now live!

---

## 📚 Full Guides

- **Quick Setup**: `LOCATION_QUICK_START.md`
- **API Setup**: `GOOGLE_MAPS_API_SETUP.md`
- **Complete Guide**: `LOCATION_FEATURE_SETUP.md`
- **Code Examples**: `LOCATION_CODE_EXAMPLES.md`

## 🆘 Issues?

### Map not showing?
- Check if API key is correct
- Check if Maps API is enabled in Google Cloud

### Geolocation not working?
- Check browser permissions
- Make sure HTTPS (or localhost)

### Help!
See: `LOCATION_FEATURE_SUMMARY.md` → Troubleshooting

---

**Time Remaining**: ~5 minutes until feature is live! 🚀
