import * as yup from 'yup';

const allowedCertificateTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const providerProfileSchema = yup.object({
  businessName: yup.string().trim().max(100, 'Business name is too long'),

  yearsOfExperience: yup
    .number()
    .typeError('Years of experience is required')
    .integer('Years of experience must be a whole number')
    .min(0, 'Years of experience must be 0 or more')
    .required('Years of experience is required'),

  serviceArea: yup
    .number()
    .typeError('Service area is required')
    .min(0, 'Service area must be 0 or more')
    .required('Service area is required'),

  location: yup
    .mixed()
    .required('Service location is required')
    .test('location-valid', 'Service location is required', (value) => {
      if (!value) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'object') return !!value.formatted;
      return false;
    }),

  bio: yup.string().trim().max(500, 'Bio is too long'),

  specialities: yup
    .array()
    .of(yup.number().typeError('Invalid speciality'))
    .min(1, 'Select at least one speciality'),

  specializations: yup
    .array()
    .of(yup.number().typeError('Invalid specialization'))
    .when('specialities', {
      is: (val) => Array.isArray(val) && val.length > 0,
      then: (schema) => schema.min(1, 'Select at least one specialization'),
      otherwise: (schema) => schema,
    }),

  citizenshipNumber: yup
    .string()
    .required('Citizenship number is required')
    .matches(/^\d{11}$/, 'Citizenship number must be exactly 11 digits'),

  citizenshipFront: yup
    .mixed()
    .required('Front side image is required')
    .test('fileSize', 'Front image must be less than 5MB', (value) => {
      if (!value) return false;
      return value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Front image must be an image file', (value) => {
      if (!value) return false;
      return value.type?.startsWith('image/');
    }),

  citizenshipBack: yup
    .mixed()
    .required('Back side image is required')
    .test('fileSize', 'Back image must be less than 5MB', (value) => {
      if (!value) return false;
      return value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', 'Back image must be an image file', (value) => {
      if (!value) return false;
      return value.type?.startsWith('image/');
    }),

  certificates: yup
    .array()
    .of(
      yup
        .object({
          id: yup.mixed().required(),
          name: yup.string().required(),
          size: yup.number().required(),
          file: yup.mixed().required(),
        })
        .test('fileSize', 'Each certificate must be less than 10MB', (value) => {
          if (!value?.file) return true;
          return value.file.size <= 10 * 1024 * 1024;
        })
        .test('fileType', 'Certificate must be PDF, DOC, DOCX, JPG, or PNG', (value) => {
          if (!value?.file) return true;
          return allowedCertificateTypes.includes(value.file.type);
        })
    )
    .optional()
    .default([]),
});

// Provider Profile Edit Schema (for editing existing profile)
export const providerProfileEditSchema = yup.object({
  businessName: yup.string().trim().max(100, 'Business name is too long'),

  yearsOfExperience: yup
    .number()
    .typeError('Years of experience must be a number')
    .integer('Years of experience must be a whole number')
    .min(0, 'Years of experience must be 0 or more')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),

  serviceArea: yup
    .number()
    .typeError('Service area must be a number')
    .min(0, 'Service area must be 0 or more')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),

  city: yup.string().trim().max(100, 'City name is too long'),

  address: yup.string().trim().max(200, 'Address is too long'),

  bio: yup.string().trim().max(500, 'Bio is too long'),

  profilePicture: yup
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

  specialities: yup
    .array()
    .of(yup.number().typeError('Invalid speciality'))
    .min(1, 'Select at least one speciality'),

  specializations: yup
    .array()
    .of(yup.number().typeError('Invalid specialization'))
    .when('specialities', {
      is: (val) => Array.isArray(val) && val.length > 0,
      then: (schema) => schema.min(1, 'Select at least one specialization'),
      otherwise: (schema) => schema,
    }),
});

// Service Form Schema (for creating/editing services)
export const serviceFormSchema = yup.object({
  title: yup
    .string()
    .trim()
    .max(150, 'Service title is too long'),

  description: yup
    .string()
    .trim()
    .max(1000, 'Description is too long'),

  specialization: yup
    .number()
    .typeError('Specialization is required')
    .required('Specialization is required'),

  base_price: yup
    .number()
    .typeError('Base price is required')
    .positive('Base price must be greater than 0')
    .required('Base price is required'),

  price_type: yup
    .string()
    .oneOf(['fixed', 'hourly', 'negotiable'], 'Invalid price type')
    .required('Price type is required'),

  estimated_duration_min: yup
    .number()
    .typeError('Minimum duration is required')
    .positive('Minimum duration must be greater than 0')
    .required('Minimum duration is required'),

  estimated_duration_max: yup
    .number()
    .typeError('Maximum duration must be a number')
    .positive('Maximum duration must be greater than 0')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value)
    .test('max-greater-than-min', 'Maximum duration must be greater than minimum', function() {
      const { estimated_duration_min, estimated_duration_max } = this.parent;
      if (!estimated_duration_max) return true;
      return estimated_duration_max >= estimated_duration_min;
    }),

  service_radius: yup
    .number()
    .typeError('Service radius must be a number')
    .min(0, 'Service radius must be 0 or more')
    .nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value),

  emergency_service: yup.boolean(),

  is_active: yup.boolean(),
});
