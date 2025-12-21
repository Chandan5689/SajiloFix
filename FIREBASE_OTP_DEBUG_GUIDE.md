# Firebase OTP Debugging Guide

## Current Issue
Firebase phone verification is returning `400 Bad Request` with `invalid-verification-code` error when confirming OTP.

## Test Phone Numbers Configuration
These should be configured in Firebase Console:

| Phone Number | OTP Code |
|--------------|----------|
| 9812345678   | 321546   |
| 9856037190   | 123456   |
| 9802837190   | 569771   |

## How to Configure Test Numbers in Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project (sajilo-fix-76f80)
3. Navigate to **Authentication > Sign-in method**
4. Scroll down to **Phone numbers for testing**
5. Click **Add phone number**
6. Enter phone number with country code: `+9779802837190`
7. Enter verification code: `569771`
8. Click **Add**

## Verification Checklist

### Step 1: Verify Firebase Test Numbers
- [ ] Open Firebase Console
- [ ] Go to Authentication > Sign-in method
- [ ] Scroll to "Phone numbers for testing"
- [ ] Confirm all three test numbers are listed with +977 prefix
- [ ] Verify the codes match exactly

### Step 2: Check Frontend Logs
When testing, check browser console for these logs:

```
📞 Sending OTP to: +9779802837190
🧪 Is test number: true
⚠️ Test number detected. Use code: 569771
✅ OTP sent successfully
```

Then when verifying:
```
🔐 Verifying OTP: 569771
Test number: true
Verification ID type: object
🔐 Confirming with Firebase...
Phone number: 9802837190
OTP code: 569771
OTP length: 6
🔄 Calling verificationId.confirm()...
```

### Step 3: Common Errors and Solutions

#### Error: `auth/invalid-verification-code`
**Possible Causes:**
1. Wrong OTP code entered
2. Test number not properly configured in Firebase
3. Phone number format mismatch (+977 vs no prefix)
4. Verification session expired (usually after 5 minutes)

**Solutions:**
- Double-check the OTP matches Firebase Console configuration
- Ensure phone number in Firebase Console includes +977 prefix
- Try requesting a new OTP code
- Clear browser cache and try again

#### Error: `auth/session-expired`
**Cause:** Too much time passed between sending OTP and verifying

**Solution:**
- Request a new OTP and verify within 5 minutes

#### Error: `auth/too-many-requests`
**Cause:** Too many verification attempts

**Solution:**
- Wait 15-30 minutes before trying again
- Use a different test phone number temporarily

### Step 4: Manual Testing Steps

1. **Start Fresh:**
   ```bash
   # Clear browser cache or use incognito mode
   # Navigate to http://localhost:5173/register
   ```

2. **Register with Email:**
   - Enter email, password, name
   - Verify email through Clerk
   - You should be redirected to phone verification

3. **Send OTP:**
   - Enter test phone: `9802837190`
   - Click "Send Code"
   - Check console logs for success message
   - You should see OTP form appear

4. **Verify OTP:**
   - Enter code: `569771`
   - Click "Verify"
   - Check console logs for detailed error if it fails

### Step 5: Backend Verification

Check if the issue is Firebase or Django:

1. **If Firebase verification succeeds** (you see ✅ Firebase phone verification successful):
   - Issue is in Django backend
   - Check Backend terminal for errors
   - Verify CLERK_SECRET_KEY is set

2. **If Firebase verification fails** (you see ❌ Firebase verification failed):
   - Issue is in Firebase configuration
   - Follow steps in "Verify Firebase Test Numbers"

## Enhanced Error Logging

The code now logs:
- Verification ID type and object
- OTP length validation
- Clean OTP value (trimmed)
- Full Firebase error object in JSON format

Check console for these detailed logs to pinpoint the exact issue.

## Firebase Console Direct Link

Authentication Settings: https://console.firebase.google.com/project/sajilo-fix-76f80/authentication/providers

## Test After Configuration

After configuring test numbers:
1. Refresh your frontend application
2. Clear any existing auth state
3. Start a new registration flow
4. Test with each phone number systematically

## Alternative: Disable App Verification (Development Only)

If test numbers still don't work, you can temporarily disable app verification:

1. In Firebase Console > Authentication > Settings
2. Find "App Verification" section  
3. Enable "Disable app verification for debugging" (NOT recommended for production)

⚠️ **Warning:** This is a security risk. Only use during development with test numbers.
