# ⚡ QUICK REFERENCE - Google Maps API Key (5-Minute Version)

## 🚀 TL;DR (Too Long; Didn't Read)

**Cost**: FREE forever ✅
**Time**: 15 minutes ⏱️

---

## 🎯 The 7 Steps

### Step 1️⃣ Go Here
https://console.cloud.google.com/
- Sign in with Gmail
- You'll see a dashboard

### Step 2️⃣ Create Project
1. Click blue project selector (top left)
2. Click "NEW PROJECT"
3. Enter name: `SajiloFix`
4. Click "CREATE"
5. Wait 30 seconds

### Step 3️⃣ Enable 3 APIs
Repeat this 3 times:
1. Search: `Maps JavaScript API`
2. Click result
3. Click ENABLE
4. Wait...
5. (Repeat for `Places API` and `Geocoding API`)

### Step 4️⃣ Go to Credentials
1. Left sidebar → "Credentials"

### Step 5️⃣ Create API Key
1. Click `+ CREATE CREDENTIALS` (blue button)
2. Select `API Key`
3. 📋 **COPY YOUR KEY** (looks like: `AIzaSy_...`)
4. Save it somewhere safe

### Step 6️⃣ Add to Your Code
**File**: `Frontend/index.html`

**Find:**
```html
key=YOUR_GOOGLE_MAPS_API_KEY
```

**Replace with your key:**
```html
key=AIzaSy_xAbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### Step 7️⃣ Test
```bash
cd Frontend
npm run dev
```
Visit: http://localhost:5173/register
✅ Test location feature

---

## 📊 Quick Checklist

- [ ] Login to console.cloud.google.com
- [ ] Create "SajiloFix" project
- [ ] Enable Maps JavaScript API
- [ ] Enable Places API
- [ ] Enable Geocoding API
- [ ] Create API Key
- [ ] Copy the key
- [ ] Update index.html
- [ ] Run npm run dev
- [ ] Test at localhost:5173
- ✅ DONE!

---

## 💰 Cost Breakdown

```
Setup:          FREE
Monthly:        FREE (includes $200 credit)
Forever:        FREE (for small usage)

Actually: $0 🎉
```

---

## 🆘 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| Can't find APIs | Use search bar at top |
| ENABLE button missing | Click API name first |
| Key not working | Wait 5 mins, refresh browser |
| Map not showing | Check key in index.html |
| Page shows error | Open DevTools (F12) |

---

## 📍 Where to Find Things

```
Project Selector: TOP LEFT
Search Bar:       TOP CENTER
Left Menu:        FAR LEFT
Credentials:      LEFT MENU
CREATE button:    TOP OF CREDENTIALS PAGE
API Key List:     MIDDLE OF PAGE
```

---

## ⏰ Time Estimate

```
Login:         2 min
Create Project: 2 min
Enable APIs:   5 min  (slowest step)
Create Key:    3 min
Add to Code:   1 min
Test:          2 min
─────────────────────
Total:        15 min
```

---

## ✨ Your API Key Will Look Like

```
AIzaSy_xAbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```
(Each one is unique to your account)

---

## 🎁 What You Get

✅ Free Maps API
✅ Location selection working
✅ GPS geolocation enabled
✅ Interactive map modal
✅ City search feature
✅ All for $0

---

## 📞 Need Help?

- **Detailed steps**: See `FREE_GOOGLE_MAPS_API_KEY_GUIDE.md`
- **Visual guide**: See `GOOGLE_MAPS_API_VISUAL_GUIDE.md`
- **Video reference**: Google's official docs at https://developers.google.com/maps

---

## 🚦 Status After Each Step

```
After Step 1: You're in Google Cloud ✓
After Step 2: Project exists ✓
After Step 3: APIs are enabled ✓
After Step 4: In Credentials page ✓
After Step 5: API Key created ✓
After Step 6: Code updated ✓
After Step 7: Feature working ✓ DONE!
```

---

## 🎯 Remember

- 🔐 Keep API key secret
- 🛡️ Restrict to localhost:5173 for dev
- 📝 Save the key somewhere safe
- ✅ All setup is FREE
- ⚡ Takes only 15 minutes

---

## 🚀 Ready?

1. Open: https://console.cloud.google.com/
2. Follow the 7 steps above
3. You're done! 🎉

**Next**: Update `Frontend/index.html` with your key

---

**Bookmark this file for quick reference!** 📌
