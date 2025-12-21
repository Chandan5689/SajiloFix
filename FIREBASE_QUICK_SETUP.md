# 🔥 FIREBASE TEST NUMBERS - QUICK SETUP GUIDE

## ⚡ Quick Steps (5 minutes)

### 1. Open Firebase Console
URL: https://console.firebase.google.com/project/sajilo-fix-76f80/authentication/providers

### 2. Navigate to Phone Provider
- Click on **"Phone"** in the list of sign-in providers
- If not enabled, enable it first

### 3. Scroll to Test Numbers Section
- Find section: **"Phone numbers for testing"**
- Click **"Add phone number"** button

### 4. Add Each Test Number

**Number 1:**
- Phone number: `+9779802837190`
- Test code: `569771`
- Click "Add"

**Number 2:**
- Phone number: `+9779856037190`
- Test code: `123456`
- Click "Add"

**Number 3:**
- Phone number: `+9779812345678`
- Test code: `321546`
- Click "Add"

### 5. Verify Configuration
You should see all 3 numbers listed like this:
```
+9779802837190  →  569771
+9779856037190  →  123456
+9779812345678  →  321546
```

## ⚠️ Common Mistakes to Avoid

❌ **Wrong Format:** `9802837190` (missing +977)
✅ **Correct Format:** `+9779802837190`

❌ **Wrong Format:** `+977 9802837190` (space after +977)
✅ **Correct Format:** `+9779802837190`

❌ **Wrong Format:** `+977-9802837190` (dash after +977)
✅ **Correct Format:** `+9779802837190`

## 🧪 Test After Setup

1. Go to http://localhost:5173/register
2. Complete email registration and verification
3. Enter phone number: `9802837190` (without +977 in the form)
4. Click "Send Code"
5. Check browser console - should see:
   ```
   ⚠️ Test number detected. Use code: 569771
   ```
6. Enter code: `569771`
7. Click "Verify Phone"
8. Should see: `✅ Firebase phone verification successful`

## 🔍 Verification Checklist

Before testing your app:
- [ ] Firebase Console is open
- [ ] Phone sign-in method is enabled
- [ ] All 3 test numbers are added
- [ ] Each number has the correct code
- [ ] Format is exactly: +977XXXXXXXXXX (no spaces, no dashes)
- [ ] Click "Save" if there's a save button

## 📸 Screenshot Reference

Your Firebase Console should look like this:

```
┌─────────────────────────────────────────────────┐
│ Phone numbers for testing                      │
├─────────────────────────────────────────────────┤
│ Phone number          Test code                │
│ +9779802837190       569771         [×]        │
│ +9779856037190       123456         [×]        │
│ +9779812345678       321546         [×]        │
│                                                 │
│ [Add phone number]                              │
└─────────────────────────────────────────────────┘
```

## 🆘 If It Still Doesn't Work

### Double-Check These:

1. **Firebase Project:** Make sure you're in the correct project (sajilo-fix-76f80)

2. **Phone Provider Enabled:** The "Phone" sign-in method must be enabled (toggle should be ON)

3. **Exact Format:** The phone number MUST start with + and have no spaces

4. **Code is 6 Digits:** Each test code should be exactly 6 digits

5. **Browser Cache:** Clear browser cache or use incognito window

6. **Console Logs:** Check browser console for actual error from Firebase

### Still Failing?

The error message in console will tell you exactly what's wrong:

- `auth/invalid-phone-number` → Phone format is wrong in code
- `auth/invalid-verification-code` → Test number not configured or wrong code
- `auth/captcha-check-failed` → reCAPTCHA issue (refresh page)
- `auth/too-many-requests` → Wait 15-30 minutes

## 🎯 Why This is Necessary

Firebase phone authentication normally sends real SMS messages which:
- Cost money (pay per SMS)
- Require billing account setup
- Have rate limits

Test numbers allow you to:
- ✅ Test phone verification for FREE
- ✅ No SMS costs
- ✅ Instant verification
- ✅ No rate limits on test numbers
- ✅ Predictable codes for automated testing

## 🔗 Official Documentation

Firebase Test Phone Numbers:
https://firebase.google.com/docs/auth/web/phone-auth#test-with-fictional-phone-numbers

## ⏱️ Time Estimate

- Adding 3 test numbers: **2-3 minutes**
- Finding the right page: **1-2 minutes**
- Testing the flow: **3-5 minutes**

**Total: ~10 minutes maximum**

---

**After configuration, restart your frontend dev server and test again!**
