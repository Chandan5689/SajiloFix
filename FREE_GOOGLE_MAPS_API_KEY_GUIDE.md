# 🆓 Free Google Maps API Key - Complete Step-by-Step Guide

## ✅ This is COMPLETELY FREE!

Google provides:
- ✅ **$200 monthly free credit** for Maps Platform
- ✅ **No credit card required initially** (you can add later if needed)
- ✅ **No cost for development/testing**
- ✅ Generous free tier (up to 25,000 map loads/day)

## 📋 Prerequisites

Before you start, make sure you have:
- [ ] A Google Account (Gmail or other Google service)
- [ ] Access to a web browser
- [ ] Approximately 10 minutes

**Don't have a Google Account?** Create one at https://accounts.google.com (free)

---

## 🚀 Step-by-Step Instructions

### STEP 1: Go to Google Cloud Console (1 minute)

1. Open your web browser
2. Visit: **https://console.cloud.google.com/**
3. You'll see a sign-in page if you're not already logged in
4. Click "Sign in" and enter your Google Account credentials
5. Accept the terms if prompted

### STEP 2: Create a New Project (2 minutes)

1. Look at the top of the page, you should see a **blue project selector** bar
2. Click on it (it might say "Select a project" or show a project name)

```
┌─────────────────────────────────────────┐
│ [Project selector bar with dropdown ▼] │
└─────────────────────────────────────────┘
```

3. In the popup that appears, click the **"NEW PROJECT"** button (top right of popup)

4. In the dialog that appears:
   - **Project name**: Enter `SajiloFix` (or any name you want)
   - **Organization**: Leave blank (default)
   - Click **"CREATE"**

5. Wait 30 seconds for the project to be created

6. The console will automatically switch to your new project

### STEP 3: Enable Google Maps APIs (3 minutes)

You need to enable 3 APIs. Repeat this process for each:

#### Enable Maps JavaScript API
1. In the top search bar, type: `Maps JavaScript API`
2. Click on the first result
3. Click the **ENABLE** button (blue button on the right)
4. Wait for it to enable (5-10 seconds)

#### Enable Places API
1. In the top search bar, type: `Places API`
2. Click on the first result
3. Click the **ENABLE** button
4. Wait for it to enable

#### Enable Geocoding API
1. In the top search bar, type: `Geocoding API`
2. Click on the first result
3. Click the **ENABLE** button
4. Wait for it to enable

**Visual Guide:**
```
Search Bar: [Maps JavaScript API ___________]
                    ↓
           [Search Results]
           Maps JavaScript API
                    ↓
         [Click the name]
                    ↓
      [ENABLE button appears]
                    ↓
           [Click ENABLE]
```

### STEP 4: Create API Key (3 minutes)

1. In the left sidebar, find **"Credentials"** (you might need to scroll)
2. Click on **"Credentials"**

3. Look for the blue **"+ CREATE CREDENTIALS"** button at the top
4. Click it
5. From the dropdown, select **"API Key"**

6. **Copy the API Key!**
   - A popup will appear with your API key
   - Click **"COPY"** button next to the key
   - Save it somewhere safe (Notepad, Word, or just copy it)
   - Click **"CLOSE"** when done

**Your API key will look like this:**
```
AIzaSy_xAbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### STEP 5: Restrict Your API Key (Optional but Recommended) (2 minutes)

This prevents others from using your key:

1. Go to **"Credentials"** in the left sidebar
2. Click on your API key (in the API Keys section)
3. Under **"Key restrictions"**, select **"HTTP referrers (web sites)"**
4. In the field below, enter your domains:
   - For development: `localhost:5173`
   - For production: `yourdomain.com`
   - Each on a new line
5. Click **"SAVE"**

**Example:**
```
Authorized HTTP referrers:
localhost:5173
127.0.0.1:5173
sajilo.com/*
```

### STEP 6: Add API Key to Your Code (1 minute)

1. Open: `Frontend/index.html`
2. Find this line:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
```

3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSy_xAbCdEfGhIjKlMnOpQrStUvWxYz1234567890&libraries=places"></script>
```

### STEP 7: Test It! (1 minute)

```bash
cd Frontend
npm run dev
```

Open: `http://localhost:5173/register`

Try the location feature:
- ✅ Click "Use Current Location"
- ✅ Click "Open Map"
- ✅ Type "Kathmandu" in search

If it works, you're done! 🎉

---

## 💰 Costs & Billing

### Free Tier
- **$200 monthly free credit** (automatically applied)
- Covers most usage for development
- No credit card required initially

### Pricing (if you exceed free tier)
- Maps: $7 per 1,000 map loads
- Places: $7 per 1,000 queries
- Geocoding: $5 per 1,000 requests

### For a small app like SajiloFix:
- **Estimated monthly usage**: 1,000-5,000 requests
- **Estimated cost**: **$0-5/month** (covered by free credit)
- **Realistic cost**: **Free for most of year**

### If you exceed free tier:
1. You can set billing alerts
2. You can set daily usage limits
3. You can restrict which APIs/methods are used

---

## 🎯 Visual Walkthrough

### Console Overview
```
┌─────────────────────────────────────────────────┐
│ Google Cloud Console                             │
├─────────────────────────────────────────────────┤
│ [Project: SajiloFix ▼]                          │
│                                                  │
│ Left Sidebar:              Main Content:        │
│ ├─ Dashboard              ┌──────────────────┐  │
│ ├─ APIs & Services        │ APIs Overview    │  │
│ │  ├─ Library        →    │ Maps: ENABLED ✓  │  │
│ │  └─ Credentials    →    │ Places: ENABLED✓ │  │
│ ├─ Credentials   <── ┤    │ Geocoding: ✓     │  │
│ ├─ Billing             │    └──────────────────┘  │
│ └─ Settings            │                          │
└─────────────────────────────────────────────────┘
```

### Creating Credentials
```
Credentials Page:
┌──────────────────────────────────────┐
│ + CREATE CREDENTIALS ▼               │
├──────────────────────────────────────┤
│ ┌─ Dropdown Menu                   │
│ │ ├─ API Key                  ←─── │ (Select this)
│ │ ├─ OAuth 2.0 Client ID           │
│ │ └─ Service Account               │
│ └─ End of Dropdown                 │
│                                     │
│ Result: Your API Key Generated ✓   │
└──────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### Security
- ⚠️ Never share your API key publicly
- ⚠️ Don't commit to GitHub without restriction
- ⚠️ Always restrict to your domain(s)
- ⚠️ Consider rotating keys monthly

### Best Practices
1. Use HTTP referrer restrictions
2. Enable only needed APIs
3. Set up billing alerts
4. Monitor usage in Console
5. Use different keys for dev/prod

### Troubleshooting

| Problem | Solution |
|---------|----------|
| "Key invalid" | Wait 5 mins after creating, then refresh |
| "Quota exceeded" | Check your free tier usage in console |
| Map not loading | Verify API key in index.html |
| "Origin not allowed" | Add domain to HTTP referrers |
| Still not working | Check browser console for errors (F12) |

---

## 📞 Getting Help

### If you're stuck:

1. **Project not creating?**
   - Make sure you're logged into your Google Account
   - Try a different browser
   - Check your internet connection

2. **Can't find APIs?**
   - Use the search bar at the top of console
   - Make sure you're in the right project

3. **API Key not working?**
   - Wait 5 minutes after creation
   - Verify you copied the full key
   - Check if key is restricted to localhost for development

4. **Still having issues?**
   - Check: https://cloud.google.com/docs/authentication/api-keys
   - Browse: https://stackoverflow.com/questions/tagged/google-maps-api

---

## ✅ Quick Checklist

Complete these in order:

- [ ] Open https://console.cloud.google.com/
- [ ] Log in with Google Account
- [ ] Create new project named "SajiloFix"
- [ ] Search and enable "Maps JavaScript API"
- [ ] Search and enable "Places API"
- [ ] Search and enable "Geocoding API"
- [ ] Go to Credentials
- [ ] Create API Key
- [ ] Copy the API Key
- [ ] Optional: Set HTTP referrer restrictions
- [ ] Open `Frontend/index.html`
- [ ] Replace `YOUR_GOOGLE_MAPS_API_KEY` with your key
- [ ] Save the file
- [ ] Run `npm run dev` in Frontend
- [ ] Test at localhost:5173/register
- [ ] ✅ Done!

---

## 🎯 Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Account/Login | 2 min | Quick |
| Create Project | 2 min | Quick |
| Enable APIs | 5 min | Easy |
| Create API Key | 3 min | Easy |
| Add to Code | 1 min | Simple |
| Test | 2 min | Done |
| **Total** | **~15 minutes** | **✅ Complete** |

---

## 🆓 Cost Summary

```
Setup Cost:        $0 ✅
Monthly Cost:      $0 ✅
API Key Cost:      $0 ✅
Free Credit:       $200 ✅

Total Cost: $0 Forever (for small usage)
```

---

## 🎉 You're Ready!

Follow the steps above and you'll have a working Google Maps API key in 15 minutes at zero cost!

### Next: After Getting Your Key
1. Update `Frontend/index.html`
2. Run `npm run dev`
3. Test at localhost:5173
4. See location feature work! 🗺️

---

## 📚 Helpful Resources

- **Google Cloud Documentation**: https://cloud.google.com/docs
- **Maps API Docs**: https://developers.google.com/maps/documentation
- **FAQ**: https://developers.google.com/maps/faq
- **Quotas & Billing**: https://cloud.google.com/docs/quota-usage

---

**Time to completion**: ~15 minutes
**Cost**: Free! ✅
**Difficulty**: Easy! ✅
**Ready to start?** Go to https://console.cloud.google.com/ 🚀
