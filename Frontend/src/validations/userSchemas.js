import * as yup from 'yup';

/**
 * Validation Schemas for User Forms
 * Centralized validation logic using Yup
 */

// User Profile Edit Schema
export const userProfileEditSchema = yup.object({
  first_name: yup
    .string()
    .trim()
    .max(50, 'First name is too long'),

  middle_name: yup
    .string()
    .trim()
    .max(50, 'Middle name is too long'),

  last_name: yup
    .string()
    .trim()
    .max(50, 'Last name is too long'),

  address: yup
    .string()
    .trim()
    .max(200, 'Address is too long'),

  city: yup
    .string()
    .trim()
    .max(100, 'City name is too long'),

  district: yup
    .string()
    .trim()
    .max(100, 'District name is too long'),

  postal_code: yup
    .string()
    .trim()
    .max(20, 'Postal code is too long'),

  bio: yup
    .string()
    .trim()
    .max(500, 'Bio is too long'),

  location: yup
    .string()
    .trim()
    .max(200, 'Location is too long'),

  profile_picture: yup
    .mixed()
    .nullable()
    .test('fileSize', 'Image must be less than 5MB', (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Please select a valid image file', (value) => {
      if (!value) return true;
      return value.type?.startsWith('image/');
    }),
});

// Booking Form Schema - Step 1: Service Selection
export const bookingStep1Schema = yup.object({
  selectedServiceIds: yup
    .array()
    .of(yup.string())
    .min(1, 'Please select at least one service'),
});

// Booking Form Schema - Step 2: Date & Time
export const bookingStep2Schema = yup.object({
  preferredDate: yup
    .string()
    .required('Please select a date'),

  preferredTime: yup
    .string()
    .required('Please select a time'),
});

// Booking Form Schema - Step 3: Contact & Location
export const bookingStep3Schema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required('Full name is required')
    .max(100, 'Full name is too long'),

  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^(97|98)\d{8}$/, 'Enter a valid Nepal mobile number (e.g., 9812345678)'),

  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),

  address: yup
    .string()
    .trim()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters'),

  serviceCity: yup
    .string()
    .trim()
    .required('City is required'),

  serviceDistrict: yup
    .string()
    .trim(),

  selectedLocationName: yup
    .string()
    .trim(),
});

// Booking Form Schema - Step 4: Service Details & Files
export const bookingStep4Schema = yup.object({
  description: yup
    .string()
    .trim()
    .required('Please describe the service you need')
    .min(10, 'Description must be at least 10 characters'),

  specialInstructions: yup
    .string()
    .trim()
    .max(500, 'Special instructions are too long'),

  imageDescription: yup
    .string()
    .trim()
    .max(200, 'Image description is too long'),

  isEmergency: yup.boolean(),

  selectedFiles: yup
    .array()
    .of(yup.mixed())
    .test('fileSize', 'Each file must be less than 10MB', (files) => {
      if (!Array.isArray(files)) return true;
      return files.every(f => !f || f.size <= 10 * 1024 * 1024);
    })
    .test('fileType', 'Only image and document files are allowed', (files) => {
      if (!Array.isArray(files)) return true;
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      return files.every(f => !f || allowedTypes.includes(f.type));
    })
    .max(5, 'Maximum 5 files allowed'),
});

// Booking Image Upload Schema (component-level)
export const bookingImageUploadSchema = yup.object({
  images: yup
    .array()
    .of(yup.mixed())
    .required('Please select at least one image')
    .min(1, 'Please select at least one image')
    .max(5, 'Maximum 5 images allowed')
    .test('fileSize', 'Each file must be less than 5MB', (files) => {
      if (!Array.isArray(files)) return true;
      return files.every(f => !f || f.size <= 5 * 1024 * 1024);
    })
    .test('fileType', 'Only image files are allowed', (files) => {
      if (!Array.isArray(files)) return true;
      return files.every(f => !f || f.type?.startsWith('image/'));
    }),

  description: yup
    .string()
    .trim()
    .max(200, 'Description must be less than 200 characters'),
});

// Provider response to customer review
export const providerResponseSchema = yup.object({
  response: yup
    .string()
    .trim()
    .required('Response is required')
    .min(3, 'Response must be at least 3 characters')
    .max(500, 'Response must be less than 500 characters'),
});

// Public Contact form
export const contactFormSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required('First name is required')
    .max(50, 'First name must be under 50 characters'),

  lastName: yup
    .string()
    .trim()
    .required('Last name is required')
    .max(50, 'Last name must be under 50 characters'),

  email: yup
    .string()
    .trim()
    .email('Please enter a valid email')
    .required('Email is required'),

  subject: yup
    .string()
    .trim()
    .required('Subject is required')
    .max(150, 'Subject must be under 150 characters'),

  message: yup
    .string()
    .trim()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be under 1000 characters'),
});

// Review Form Schema
export const reviewFormSchema = yup.object({
  rating: yup
    .number()
    .required('Please select a rating')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating must be 5 stars or less'),

  title: yup
    .string()
    .required('Review title is required')
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),

  comment: yup
    .string()
    .trim()
    .max(500, 'Comment must be less than 500 characters'),

  would_recommend: yup.boolean(),
});

// Decision Form Schema (Dispute completion only)
export const decisionFormSchema = yup.object({
  decisionType: yup
    .string()
    .required('Decision type is required')
    .oneOf(['approve', 'dispute'], 'Invalid decision type'),

  decisionNote: yup
    .string()
    .required('Please describe the issue')
    .trim()
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(500, 'Description must be less than 500 characters'),

  decisionFiles: yup
    .array()
    .of(yup.mixed())
    .required('At least 1 photo is required')
    .min(1, 'At least 1 photo is required to dispute')
    .test('fileSize', 'Each file must be less than 5MB', (files) => {
      if (!Array.isArray(files)) return true;
      return files.every(f => !f || f.size <= 5 * 1024 * 1024);
    })
    .test('fileType', 'Only image files are allowed', (files) => {
      if (!Array.isArray(files)) return true;
      return files.every(f => !f || f.type.startsWith('image/'));
    })
    .max(5, 'Maximum 5 files allowed'),
});
