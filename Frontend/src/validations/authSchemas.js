import * as yup from 'yup';

/**
 * Validation Schemas for Authentication Forms
 * Centralized validation logic using Yup
 */

// Login Form Schema
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim(),
  
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

// Registration Form Schema - Step 1 (Basic Info)
export const registrationSchema = yup.object({
  // User Type
  userType: yup
    .string()
    .required('Please select account type')
    .oneOf(['find', 'offer'], 'Invalid account type'),
  
  // Profile Picture (optional)
  profilePicture: yup
    .mixed()
    .nullable()
    .test('fileSize', 'Image must be less than 5MB', (value) => {
      if (!value) return true; // Optional field
      return value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Please select a valid image file', (value) => {
      if (!value) return true; // Optional field
      return value.type?.startsWith('image/');
    }),
  
  // Personal Information
  firstName: yup
    .string()
    .required('First name is required')
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(30, 'First name is too long'),
  
  middleName: yup
    .string()
    .trim()
    .max(30, 'Middle name is too long'),
  
  lastName: yup
    .string()
    .required('Last name is required')
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(30, 'Last name is too long'),
  
  // Location - can be string or object
  location: yup
    .mixed()
    .required('Location is required')
    .test('location-valid', 'Location is required', (value) => {
      if (!value) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'object') return !!value.formatted;
      return false;
    }),
  
  // Phone Number
  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(/^(98|97)\d{8}$/, 'Phone must be 10 digits starting with 98 or 97')
    .length(10, 'Phone number must be exactly 10 digits'),
  
  // Email
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim(),
  
  // Password with strong requirements
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .matches(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .matches(/(?=.*\d)/, 'Password must contain at least one number')
    .matches(/(?=.*[@$!%*?&#])/, 'Password must contain at least one special character'),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
  
  // Service Area (only for providers)
  serviceArea: yup
    .string()
    .when('userType', {
      is: 'offer',
      then: (schema) => schema.trim(),
      otherwise: (schema) => schema.nullable(),
    }),
});

// Forgot Password Schema
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .trim(),
});

// Reset Password Schema
export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

// OTP Verification Schema
export const otpSchema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'OTP must be 6 digits')
    .length(6, 'OTP must be exactly 6 digits'),
});

// Email Verification Schema (for registration step 2)
export const emailVerificationSchema = yup.object({
  emailCode: yup
    .string()
    .required('Verification code is required')
    .matches(/^\d{6}$/, 'Code must be 6 digits')
    .length(6, 'Code must be exactly 6 digits'),
});
