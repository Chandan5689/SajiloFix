# 📹 Visual Step-by-Step Guide - Google Maps API Key (FREE)

## 🎬 Follow Along!

This guide has visual representations of each screen and where to click.

---

## SCREEN 1: Google Account Login

**URL**: https://console.cloud.google.com/

**What you see:**
```
╔═══════════════════════════════════════╗
║   Google Cloud Console                ║
║                                       ║
║   Sign in with your Google Account    ║
║                                       ║
║   [Email field_______________]        ║
║   [Next button]                       ║
║                                       ║
║   OR                                  ║
║                                       ║
║   [Create Google Account]             ║
╚═══════════════════════════════════════╝
```

**What to do:**
1. Enter your Gmail email address
2. Click "Next"
3. Enter your password
4. Click "Next"
5. Accept any security prompts (2FA if enabled)

**You should see:**
```
Dashboard with left sidebar
```

---

## SCREEN 2: Select/Create Project

**Location on page:**
```
┌─────────────────────────────────┐
│ [My First Project ▼]    ←── CLICK HERE
│ (or "Select a project")         │
└─────────────────────────────────┘
```

**What happens when you click:**
```
╔═════════════════════════════════╗
║ Projects Dialog                 ║
║                                 ║
║ Your Projects:                  ║
║ ├─ My First Project             ║
║ └─ (list of any existing)       ║
║                                 ║
║ [NEW PROJECT] ← CLICK THIS      ║
║  (blue button, top right)       ║
╚═════════════════════════════════╝
```

**Fill in the form:**
```
╔═════════════════════════════════╗
║ Create a New Project            ║
║                                 ║
║ Project name*                   ║
║ [SajiloFix_____________]        ║
║                                 ║
║ (Other fields are optional)     ║
║                                 ║
║ [CREATE]                        ║
╚═════════════════════════════════╝
```

**Wait for:**
- Green checkmark and success message
- Project automatically loads

**Result screen:**
```
╔═════════════════════════════════╗
║ [SajiloFix ▼]                   ║
║                                 ║
║ Google Cloud Console            ║
║ (Now showing SajiloFix project) ║
╚═════════════════════════════════╝
```

---

## SCREEN 3: Enable APIs (Repeat 3 Times)

**Find the Search Bar:**
```
┌─────────────────────────────────────┐
│ [Search bar: Type API name]         │
│                                     │
│ This is at the very top of console  │
└─────────────────────────────────────┘
```

### API 1: Maps JavaScript API

**Search:**
```
Step 1: Click search box
Step 2: Type: Maps JavaScript API
Step 3: Press Enter or click result
```

**You see:**
```
╔═════════════════════════════════════════╗
║ Maps JavaScript API                     ║
║                                         ║
║ This API enables JavaScript libraries    ║
║ to use Google Maps in web applications.  ║
║                                         ║
║                                         ║
║ [ENABLE] ← BLUE BUTTON, CLICK THIS      ║
╚═════════════════════════════════════════╝
```

**Result:**
```
Button changes to:
[MANAGE] (gray, shows it's enabled)
```

### API 2: Places API

**Repeat same process:**
```
Search: "Places API"
Click result
Click ENABLE
Wait for it to show MANAGE
```

### API 3: Geocoding API

**Repeat same process:**
```
Search: "Geocoding API"
Click result
Click ENABLE
Wait for it to show MANAGE
```

**After all 3:**
```
You should see 3 enabled APIs
✓ Maps JavaScript API
✓ Places API
✓ Geocoding API
```

---

## SCREEN 4: Navigate to Credentials

**Left Sidebar - Find "Credentials":**
```
╔════════════════════════════╗
║ Google Cloud              ║
├────────────────────────────┤
║ ⌂ Dashboard               ║
║ 📚 APIs & Services        ║
║   ├─ Library              ║
║   └─ Credentials    ← CLICK
║ 💰 Billing                ║
║ ⚙️  Settings               ║
╚════════════════════════════╝
```

**Click on "Credentials"**

**You see:**
```
╔═════════════════════════════════╗
║ Credentials Page                ║
║                                 ║
║ [+ CREATE CREDENTIALS ▼]        ║
║                                 ║
║ API Keys section:               ║
║ (empty if first time)           ║
║                                 ║
║ OAuth 2.0 Client IDs section:   ║
║ (empty)                         ║
║                                 ║
║ Service Accounts section:       ║
║ (empty)                         ║
╚═════════════════════════════════╝
```

---

## SCREEN 5: Create API Key

**Click the button:**
```
┌─────────────────────────────────┐
│ [+ CREATE CREDENTIALS ▼]        │
│ ↓ (click the dropdown)          │
└─────────────────────────────────┘
```

**Dropdown menu appears:**
```
╔═════════════════════════════════╗
║ ├─ API Key          ← SELECT    ║
║ ├─ OAuth 2.0 Client ID          ║
║ └─ Service Account              ║
╚═════════════════════════════════╝
```

**Click "API Key"**

**You get:**
```
╔═════════════════════════════════════╗
║ API key created                     ║
║                                     ║
║ Keep this key secure               ║
║                                     ║
║ Your API Key:                       ║
║ ┌───────────────────────────────┐  ║
║ │AIzaSy_xAbCdEfGhIjKlMnOpQrSt  │  ║
║ │UvWxYz1234567890               │  ║
║ └───────────────────────────────┘  ║
║                                     ║
║ [COPY] ← CLICK TO COPY             ║
║                                     ║
║ ⚠️  Do not share this key          ║
╚═════════════════════════════════════╝
```

**What to do:**
```
1. Click [COPY] button
2. Paste it somewhere safe:
   - Text file
   - Notepad
   - Password manager
3. Click [CLOSE]
```

---

## SCREEN 6: (Optional) Restrict API Key

**Back on Credentials page:**
```
╔══════════════════════════════════╗
║ API Keys                         ║
║                                  ║
║ AIzaSy_xAbCdEfGhIjKlMnOpQrSt... ║
║     ↑                            ║
║   Click on the key name          ║
╚══════════════════════════════════╝
```

**Key Details Page:**
```
╔════════════════════════════════╗
║ AIzaSy_xAbCdEfGhIjKlMnOpQrSt  ║
║                                ║
║ Restrictions:                  ║
║ ┌─────────────────────────────┐
║ │ □ None (default)            │
║ │ ○ HTTP referrers            │  ← SELECT
║ │ □ IP addresses              │
║ └─────────────────────────────┘
║                                ║
║ HTTP Referrers (for website):  ║
║ [localhost:5173              ] ║
║ [127.0.0.1:5173              ] ║
║ [yourdomain.com/*            ] ║
║                                ║
║ [SAVE]                         ║
╚════════════════════════════════╝
```

---

## SCREEN 7: Update Your Code

**File to edit: `Frontend/index.html`**

**Current content:**
```html
<head>
  ...
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
</head>
```

**After adding YOUR key:**
```html
<head>
  ...
  <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSy_xAbCdEfGhIjKlMnOpQrStUvWxYz1234567890&libraries=places"></script>
</head>
```

---

## SCREEN 8: Test It!

**Terminal commands:**
```bash
cd Frontend
npm run dev
```

**You see:**
```
VITE v7.2.0  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  Press h to show help
```

**Open browser:**
```
Visit: http://localhost:5173/register
```

**You see:**
```
╔═════════════════════════════════════════╗
║ Registration Form                       ║
║                                         ║
║ User Type Selection                     ║
║ [🔍 Find Services] [🛠️ Offer Services]║
║                                         ║
║ First Name: [_______________]           ║
║ Last Name:  [_______________]           ║
║                                         ║
║ Email:      [_______________]           ║
║                                         ║
║ 📍 Location: [______________]           ║
║   [📍 Use Current Location]             ║
║   [🗺️ Open Map]                        ║
║                                         ║
║ Password:   [_______________]           ║
║                                         ║
║ Confirm:    [_______________]           ║
║                                         ║
║ [Continue to Email Verification]       ║
╚═════════════════════════════════════════╝
```

**Test the location feature:**
```
1. Click [📍 Use Current Location]
   → Browser asks for permission
   → "Allow" → City appears ✓

2. Click [🗺️ Open Map]
   → Map appears
   → Click on it → City updates ✓

3. In Location field, type:
   → "Kathmandu"
   → Suggestions appear
   → Click to select ✓
```

**If everything works:**
```
✅ API Key is valid!
✅ Maps are loading!
✅ You're done! 🎉
```

---

## 🎯 Quick Visual Reference

### Google Cloud Console Layout
```
┌──────────────────────────────────────────────────────┐
│ Google Cloud Console                                 │
├──────────────────────────────────────────────────────┤
│ [Select a Project ▼]  ← PROJECT SELECTOR            │
│  Search bar: [_____________________] ← SEARCH APIS  │
├─────────────┬──────────────────────────────────────┤
│ Left Menu:  │ Main Content Area                    │
│ ├─ Dashboard  │ ┌─────────────────────────────┐   │
│ ├─ APIs       │ │ Current Page Content        │   │
│ ├─ Credentials│ │ (Changes based on selection)│   │
│ ├─ Billing    │ └─────────────────────────────┘   │
│ └─ Settings   │                                    │
└─────────────┴──────────────────────────────────────┘
```

### Key Locations to Remember
```
1. Project Selector: Top left
2. Search Bar: Top center
3. Left Menu: Far left (API links)
4. CREATE CREDENTIALS: Top of Credentials page
5. API Keys List: Middle of Credentials page
```

---

## ⚠️ Common Mistakes (Avoid These!)

```
❌ WRONG: Looking for "API" in left menu
✅ RIGHT: Use the search bar to find specific APIs

❌ WRONG: Creating OAuth 2.0 instead of API Key
✅ RIGHT: Select "API Key" from dropdown

❌ WRONG: Forgetting to enable all 3 APIs
✅ RIGHT: Enable Maps, Places, and Geocoding

❌ WRONG: Sharing API key online
✅ RIGHT: Restrict to your domain

❌ WRONG: Adding key before clicking copy
✅ RIGHT: Click COPY button first
```

---

## ✅ Verification Checklist

After completing all steps:

- [ ] Google Account logged in
- [ ] Project "SajiloFix" created
- [ ] Maps JavaScript API enabled
- [ ] Places API enabled
- [ ] Geocoding API enabled
- [ ] API Key generated and copied
- [ ] API Key added to index.html
- [ ] npm run dev executed
- [ ] Localhost:5173 opens
- [ ] Location feature visible
- [ ] GPS button works
- [ ] Map button works
- [ ] Search works
- [ ] ✅ SUCCESS!

---

## 🎬 Time Breakdown

```
Step 1 (Login):              2 min
Step 2 (Create Project):     2 min
Step 3 (Enable APIs):        5 min
Step 4 (Navigate):           1 min
Step 5 (Create API Key):     2 min
Step 6 (Add to Code):        1 min
Step 7 (Test):               2 min
────────────────────────
Total:                      15 min
```

---

## 🆘 Troubleshooting Visual Guide

### Problem: "Can't find APIs"
```
❌ Trying to scroll left menu
✅ Use search bar at TOP of page
   [Search APIs... ___________________]
```

### Problem: "ENABLE button not showing"
```
❌ Looking in wrong place
✅ Make sure you clicked the API result
   Not just the search result
```

### Problem: "API Key not working"
```
❌ Using old key
✅ Wait 5 minutes after creation
✅ Refresh browser (F5)
✅ Clear cache (Ctrl+Shift+Delete)
```

### Problem: "Map not showing in app"
```
❌ Key pasted wrong
✅ Check index.html for typos
✅ Verify key is between quotes
✅ No extra spaces
```

---

## 🎉 You Did It!

Following this visual guide, you now have:
- ✅ Free Google Maps API key
- ✅ Working location feature
- ✅ Fully functional registration

**Total cost**: $0
**Time invested**: ~15 minutes
**Result**: Complete location system! 🗺️

---

**Ready to start?** Go to https://console.cloud.google.com/ 🚀
