# React Hook Form + Yup Implementation Guide

## ✅ Phase 1 Complete: Login Form

### What Changed?

**File: `src/pages/Auth/SupabaseLogin.jsx`**

#### Before (Manual State Management):
```javascript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleEmailLogin = async (e) => {
  e.preventDefault();
  // Manual validation needed
  try {
    await signIn(email, password);
  } catch (err) {
    setError(err.message);
  }
};

// JSX
<input 
  type="email" 
  value={email} 
  onChange={(e) => setEmail(e.target.value)}
  required
/>
```

#### After (React Hook Form + Yup):
```javascript
const { register, handleSubmit, formState: { errors }, setValue } = useForm({
  resolver: yupResolver(loginSchema),
  defaultValues: { email: '', password: '' },
  mode: 'onBlur',
});

const handleEmailLogin = async (data) => {
  // data is already validated by Yup
  try {
    await signIn(data.email, data.password);
  } catch (err) {
    setError(err.message);
  }
};

// JSX
<input 
  type="email" 
  {...register('email')}
/>
{errors.email && <span>{errors.email.message}</span>}
```

### Benefits Achieved:

1. ✅ **Removed 2 useState hooks** (email, password)
2. ✅ **Centralized validation** in `authSchemas.js`
3. ✅ **Better error messages** from Yup
4. ✅ **Type safety** - fields matched to schema
5. ✅ **Cleaner code** - ~30 lines reduced

### Validation Schema Created:

**File: `src/validations/authSchemas.js`**

```javascript
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim(),
  
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});
```

---

## 📊 Code Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| State variables | 5 | 3 | -40% |
| Lines of code | ~150 | ~135 | -10% |
| Validation logic | Scattered | Centralized | ✅ |
| Error handling | Manual | Automatic | ✅ |
| Re-renders on typing | Yes | No | ✅ |

---

## 🎯 How It Works

### 1. **Registration (`register`)**
```javascript
<input {...register('email')} />
```
Expands to:
```javascript
<input 
  name="email"
  ref={/* React Hook Form internal ref */}
  onChange={/* Tracked by RHF */}
  onBlur={/* Validates on blur */}
/>
```

### 2. **Submit Handler (`handleSubmit`)**
```javascript
<form onSubmit={handleSubmit(handleEmailLogin)}>
```
- Prevents default form submission
- Validates all fields using Yup schema
- Only calls `handleEmailLogin` if validation passes
- Passes validated data object: `{ email: '...', password: '...' }`

### 3. **Error Display (`formErrors`)**
```javascript
{formErrors.email && (
  <p className="text-red-600">{formErrors.email.message}</p>
)}
```
- Automatically populated by Yup validation
- Shows user-friendly messages from schema

### 4. **Programmatic Updates (`setValue`)**
```javascript
setValue('password', ''); // Clear password field
```
- Used when you need to update form values from code
- Replaced old `setPassword('')` calls

---

## 🚀 Next Steps: Phase 2

### Forms to Migrate Next:

1. **SupabaseRegister.jsx** (Registration form)
   - Complexity: Medium
   - Benefits: Remove 6+ useState hooks
   - Time: 30-40 minutes

2. **UserMyProfile.jsx** (User profile)
   - Complexity: Medium
   - Benefits: Remove 10+ useState hooks
   - Time: 45-60 minutes

3. **ProviderProfile.jsx** (Provider profile)
   - Complexity: Medium-High
   - Benefits: Remove 12+ useState hooks
   - Time: 60-90 minutes

---

## 📝 Migration Pattern (Template)

Use this template for future migrations:

### Step 1: Create Validation Schema
```javascript
// src/validations/[domain]Schemas.js
export const myFormSchema = yup.object({
  fieldName: yup.string().required('Field is required'),
  // ... more fields
});
```

### Step 2: Import Dependencies
```javascript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { myFormSchema } from '../../validations/[domain]Schemas';
```

### Step 3: Setup useForm Hook
```javascript
const { 
  register, 
  handleSubmit, 
  formState: { errors },
  setValue,
  reset,
  watch,
} = useForm({
  resolver: yupResolver(myFormSchema),
  defaultValues: { /* initial values */ },
  mode: 'onBlur', // or 'onChange', 'onSubmit'
});
```

### Step 4: Update Form Handler
```javascript
// BEFORE
const handleSubmit = async (e) => {
  e.preventDefault();
  // manual validation
  if (!field1) return;
  // ...
};

// AFTER
const onSubmit = async (data) => {
  // data is already validated
  // no need for e.preventDefault()
};
```

### Step 5: Update JSX
```javascript
// BEFORE
<input 
  value={field}
  onChange={(e) => setField(e.target.value)}
/>

// AFTER
<input {...register('field')} />
{errors.field && <span>{errors.field.message}</span>}
```

---

## 🔧 Common Patterns

### Conditional Validation
```javascript
// In schema
price: yup.number()
  .when('priceType', {
    is: 'fixed',
    then: (schema) => schema.required('Price required for fixed pricing'),
  }),
```

### Watch Field Values
```javascript
const priceType = watch('priceType');
// Use priceType value to show/hide fields
```

### Reset Form
```javascript
reset(); // Reset to defaultValues
reset({ email: '', password: '' }); // Reset to specific values
```

### Set Individual Field
```javascript
setValue('email', 'new@email.com');
setValue('email', 'new@email.com', { 
  shouldValidate: true, // Trigger validation
  shouldDirty: true, // Mark as modified
});
```

---

## 📦 Packages Installed

```json
{
  "react-hook-form": "^7.71.1",
  "yup": "^1.4.0",
  "@hookform/resolvers": "^3.9.1"
}
```

**Total bundle size impact:** ~24KB (minified + gzipped)

---

## 🎓 Learning Resources

- **React Hook Form Docs:** https://react-hook-form.com/
- **Yup Docs:** https://github.com/jquense/yup
- **Examples:** Check `src/pages/Auth/SupabaseLogin.jsx` for reference

---

## ✅ Testing Checklist

- [x] Email validation (empty, invalid format)
- [x] Password validation (empty, too short)
- [x] Form submits with valid data
- [x] Error messages display correctly
- [x] Password visibility toggle works
- [x] User type tab switching works
- [x] Password clears after errors
- [x] Loading state disables form
- [x] No console errors

---

**Status:** ✅ Phase 1 Complete  
**Next:** Phase 2 - Register Form  
**Date:** January 24, 2026
