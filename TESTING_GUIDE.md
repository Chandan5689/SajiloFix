# 🧪 Quick Testing Guide for Registration Security Fixes

## Prerequisites
- Backend running: `py manage.py runserver`
- Frontend running: `npm run dev`
- Migrations applied: Check that no migration errors in backend console

## Test Scenario 1: Happy Path (Complete Registration)

### Step 1: Start Registration
1. Navigate to `/register` in frontend
2. Click "Offer Services" option
3. Fill in:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@example.com`
   - Location: `Kathmandu`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
4. Click "Next"

### Step 2: Verify Email
1. You'll be on email verification step
2. Check backend console for the verification code (it's logged there since we're using test mode)
3. Or check the signUp state in browser console: `signUpData`
4. For Clerk test, the code appears in Clerk dashboard
5. Enter the code and click "Verify"

### Step 3: Phone Verification (THE KEY TEST)
1. You should now be on phone verification page
2. Enter phone: `9812345678`
3. Click "Send Verification Code"
4. You'll see message: "🧪 Test Number Detected - Use code: 321546"
5. Click "Verify & Complete Registration"
6. You should see: "✅ Phone verified! Session activated!"
7. You should be redirected to dashboard (`/`)

### Expected Result ✅
- User is fully logged in
- Can access `/api/auth/me/`
- Can see user profile in console
- Session is active

---

## Test Scenario 2: Security Check (Before Phone Verification)

### Try to Access API Without Completing Phone Verification

#### In Browser Console:
```javascript
// Open DevTools Console (F12)

// Try to get current user BEFORE phone verification
const token = await user.getToken();
fetch('http://localhost:8000/api/auth/me/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(console.log)

// Expected: 403 Forbidden or permission error
// Actual response: 
// {
//   "detail": "Complete your registration first. Please verify your phone number."
// }
```

#### In Network Tab:
1. Go to Network tab (F12)
2. Try to call: `/api/auth/registration-status/`
3. Status: 200 ✅ (doesn't require complete registration)
4. Response shows: `registration_completed: false`

---

## Test Scenario 3: Reload Safety (Key Security Feature)

### Test that page reload doesn't bypass phone verification

1. Start registration and go to phone verification page
2. Enter phone number: `9812345678`
3. Click "Send Verification Code"
4. **Press F5 to reload page**
5. Expected: You should still be on phone verification, same step
6. Enter OTP: `321546`
7. Click verify
8. After verification, reload again: You should be on dashboard (logged in)

### Expected ✅
- Before phone verification: Stays on phone verification page
- After phone verification: Stays logged in on dashboard

---

## Test Scenario 4: Direct Access Attempt

### Try to access PhoneVerification without sign-up data

#### Via URL (won't work directly):
1. The component has a guard that checks for signUpData
2. It will redirect to `/register` if accessed directly

#### Via Console:
```javascript
// Try to navigate to phone verification step manually
// This won't work because:
// 1. signUpData will be undefined
// 2. Component guard will redirect to /register
```

### Expected ✅
- Cannot bypass to phone verification
- Must complete email verification first

---

## Test Scenario 5: All Three Test Phone Numbers

```javascript
// Test Phone Numbers with OTPs
const testPhones = {
    '9812345678': '321546',
    '9856037190': '123456',
    '9802837190': '569771'
};

// Try each one in the phone verification form
// All should work the same way
```

### Expected ✅
- All test numbers show yellow "Test Mode" banner
- All test numbers accept the corresponding OTP
- All complete registration successfully

---

## Test Scenario 6: Invalid Phone Numbers

### Try entering invalid numbers:

1. `12345` - Should show: "Phone number must be 10 digits starting with 98"
2. `98123456` - Should show: "Phone number must be 10 digits starting with 98"
3. `9712345678` - Should work (valid Nepal number starting with 97)
4. `1234567890` - Should show: "Must start with 98 or 97"

### Expected ✅
- Validation happens on frontend
- User gets clear error messages

---

## Test Scenario 7: Wrong OTP Code

1. Phone: `9812345678`
2. Correct OTP: `321546`
3. Enter wrong code: `000000`
4. Click "Verify & Complete Registration"

### Expected ✅
- Error: `auth/invalid-verification-code`
- Message: "Invalid verification code. Please check and try again."
- User stays on verification page
- Can try again with correct code

---

## Test Scenario 8: Backend Database Check

### After completing registration, check database:

```python
# In Django shell
python manage.py shell

# Check user
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.latest('created_at')

# Should see:
# user.email = 'john@example.com'
# user.phone_number = '9812345678'
# user.phone_verified = True ✅
# user.registration_completed = True ✅
# user.user_type = 'find' (or 'offer')
# user.location = 'Kathmandu'

# Verify
print(f"Registration Complete: {user.registration_completed}")
print(f"Phone Verified: {user.phone_verified}")
print(f"Phone Number: {user.phone_number}")
```

---

## Test Scenario 9: Provider Registration Flow

### Test with "Offer Services":

1. Start registration
2. Select "🛠️ Offer Services"
3. Fill in additional fields:
   - Business Name: `John's Plumbing`
   - Years of Experience: `5`
   - Service Area: `Thamel, Kathmandu`
   - City: `Kathmandu`
   - Address: `123 Main St`
   - Specialities: Select one (e.g., "Plumbing")
4. Complete email verification
5. Complete phone verification
6. Should be redirected to: `/complete-provider-profile` (not `/`)

### Expected ✅
- User type saved as 'offer'
- Redirected to provider profile completion
- Can upload citizenship and certificates there

---

## Debugging Tips

### If Something Goes Wrong:

#### 1. Check Backend Console:
```
[FirebaseAuth] Firebase Admin SDK initialized...
Email verified
Phone verified and registration completed
```

#### 2. Check Frontend Console (F12):
```javascript
// Should see:
✅ PhoneVerification component properly initialized with: { userType, location }
📞 Sending OTP to: +9779812345678
🧪 Is test number: true
✅ OTP sent successfully
🔐 Verifying OTP: 321546
✅ Test number code verified
✅ Clerk token obtained
💾 Saving phone to database...
✅ Phone saved...
🎉 Registration complete!
```

#### 3. Check Network Requests (F12 → Network):
```
POST /api/auth/verify-phone/
Status: 200 ✅
Response: { message, user, registration_status }

POST /api/auth/update-user-type/
Status: 200 ✅
Response: { message, user }
```

#### 4. Check Database:
```python
# In Django admin or shell
# User should have:
# - registration_completed = True
# - phone_verified = True
# - phone_number = '9812345678'
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "User not authenticated" | Clerk session not active, refresh browser |
| "Invalid registration state" | signUpData not passed, restart registration |
| "reCAPTCHA error" | Refresh page and try again, or check reCAPTCHA keys |
| "403 Forbidden on /api/auth/me/" | Normal! Phone not verified yet, complete phone verification |
| Phone verification stuck | Check verificationId state, try resending OTP |
| Test OTP not working | Use exact code: `9812345678` → `321546` |

---

## Success Indicators ✅

### Registration Complete When You See:
1. ✅ Email verified (step 2 complete)
2. ✅ Phone verified (step 3 complete)  
3. ✅ Session activated (logged in)
4. ✅ Redirected to dashboard (`/`)
5. ✅ Can see user profile
6. ✅ Database shows `registration_completed = True`

### Security Working When:
1. ✅ Cannot access `/api/auth/me/` before phone verification
2. ✅ Cannot reload and skip phone verification
3. ✅ Cannot access dashboard without session
4. ✅ Invalid OTP rejected
5. ✅ Registration_completed set atomically

---

**Run these tests and let me know if you encounter any issues!**
