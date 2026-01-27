import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zqmdgdzlfofzmdshfrnw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbWRnZHpsZm9mem1kc2hmcm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyODA5ODIsImV4cCI6MjA1Mjg1Njk4Mn0.lhMnFWoKRY_LXIqJdgJ_oJpGV_yVEJo_nzuY4E1Ry1s';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a unique filename with timestamp and random string
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for the file (e.g., 'profile', 'citizenship')
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName, prefix = 'file') => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${prefix}_${timestamp}_${randomStr}.${extension}`;
};

/**
 * Upload profile picture to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string|number} userId - User ID for organizing files
 * @returns {Promise<{url: string, path: string}>} - Public URL and storage path
 */
export const uploadProfilePicture = async (file, userId) => {
  if (!file) throw new Error('No file provided');

  const filename = generateUniqueFilename(file.name, `profile_${userId}`);
  const filePath = `${filename}`;

  const { data, error } = await supabase.storage
    .from('profile_pictures')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error('Profile picture upload error:', error);
    throw new Error(error.message || 'Failed to upload profile picture');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('profile_pictures')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
};

/**
 * Upload citizenship document to Supabase Storage
 * @param {File} file - Document file to upload
 * @param {string|number} userId - User ID for organizing files
 * @param {string} side - 'front' or 'back'
 * @returns {Promise<{url: string, path: string}>} - Public URL and storage path
 */
export const uploadCitizenshipDocument = async (file, userId, side = 'front') => {
  if (!file) throw new Error('No file provided');

  const filename = generateUniqueFilename(file.name, `citizenship_${userId}_${side}`);
  const filePath = `user_${userId}/${filename}`;

  const { data, error } = await supabase.storage
    .from('citizenship')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Citizenship document upload error:', error);
    throw new Error(error.message || 'Failed to upload citizenship document');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('citizenship')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
};

/**
 * Upload certificate to Supabase Storage
 * @param {File} file - Certificate file to upload
 * @param {string|number} userId - User ID for organizing files
 * @param {string} certificateName - Name/title of the certificate
 * @returns {Promise<{url: string, path: string}>} - Public URL and storage path
 */
export const uploadCertificate = async (file, userId, certificateName = 'certificate') => {
  if (!file) throw new Error('No file provided');

  const sanitizedName = certificateName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = generateUniqueFilename(file.name, `cert_${userId}_${sanitizedName}`);
  const filePath = `user_${userId}/${filename}`;

  const { data, error } = await supabase.storage
    .from('certificates')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Certificate upload error:', error);
    throw new Error(error.message || 'Failed to upload certificate');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('certificates')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
};

/**
 * Upload booking image to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string|number} bookingId - Booking ID for organizing files
 * @param {string} type - 'before' or 'after'
 * @returns {Promise<{url: string, path: string}>} - Public URL and storage path
 */
export const uploadBookingImage = async (file, bookingId, type = 'before') => {
  if (!file) throw new Error('No file provided');

  const filename = generateUniqueFilename(file.name, `${type}`);
  const filePath = `booking_${bookingId}/${filename}`;

  const { data, error } = await supabase.storage
    .from('bookings')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Booking image upload error:', error);
    throw new Error(error.message || 'Failed to upload booking image');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('bookings')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
};

/**
 * Delete file from Supabase Storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in the bucket
 * @returns {Promise<void>}
 */
export const deleteFile = async (bucket, path) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('File deletion error:', error);
    throw new Error(error.message || 'Failed to delete file');
  }
};

export default {
  uploadProfilePicture,
  uploadCitizenshipDocument,
  uploadCertificate,
  uploadBookingImage,
  deleteFile,
};
