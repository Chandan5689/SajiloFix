import React, { useState } from "react";
import { MdUpload, MdClose, MdImage } from "react-icons/md";
import bookingsService from "../services/bookingsService";

/**
 * BookingImageUpload Component
 * Allows users to upload images for their bookings
 * Supports multiple image types: problem_area, reference, before_work, after_work, completion
 */
export default function BookingImageUpload({ 
  bookingId, 
  imageType = "before",
  onUploadSuccess,
  onCancel,
  existingImages = []
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Image type labels
  const imageTypeLabels = {
    before: "Before Service Photos",
    during: "During Service Photos",
    after: "After Service Photos",
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Each image must be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setError(null);
    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove a selected file
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Upload images
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const uploadedImages = await bookingsService.uploadBookingImages(
        bookingId,
        imageType,
        selectedFiles,
        description
      );

      setSuccess(`Successfully uploaded ${uploadedImages.length} image(s)`);
      
      // Reset form
      setTimeout(() => {
        setSelectedFiles([]);
        setPreviewUrls([]);
        setDescription("");
        setSuccess(null);
        if (onUploadSuccess) {
          onUploadSuccess(uploadedImages);
        }
      }, 2000);

    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err.error || err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Upload {imageTypeLabels[imageType]}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <MdClose className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Current Images</p>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative">
                <img 
                  src={img.image_url} 
                  alt={img.image_type}
                  className="w-full h-24 object-cover rounded-md border border-gray-200"
                />
                {img.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{img.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Input */}
      <div className="mb-4">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <MdUpload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="mb-2 text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB each)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Selected Files Preview */}
      {previewUrls.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Selected Images ({selectedFiles.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md border border-gray-200"
                />
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  disabled={uploading}
                >
                  <MdClose className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md">
                  {(selectedFiles[index].size / 1024).toFixed(1)} KB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any notes about these images..."
          className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-green-600"
          rows="3"
          disabled={uploading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition"
            disabled={uploading}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Uploading...
            </span>
          ) : (
            `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
          )}
        </button>
      </div>
    </div>
  );
}
