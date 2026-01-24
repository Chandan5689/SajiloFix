import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { MdUpload, MdClose, MdImage } from "react-icons/md";
import ActionButton from "./ActionButton";
import bookingsService from "../services/bookingsService";
import { bookingImageUploadSchema } from "../validations/userSchemas";

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
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError: setFormError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(bookingImageUploadSchema),
    defaultValues: {
      images: [],
      description: "",
    },
    mode: "onBlur",
  });

  // Image type labels
  const imageTypeLabels = {
    before: "Before Service Photos",
    during: "During Service Photos",
    after: "After Service Photos",
    before_work: "Before Work Photos",
    after_work: "After Work Photos",
    problem_area: "Problem Area Photos",
    completion: "Completion Photos",
    reference: "Reference Photos",
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 5 - selectedFiles.length;
    const toAdd = files.slice(0, remainingSlots);

    const validFiles = toAdd.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setFormError("images", { type: "manual", message: "Only image files are allowed" });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError("images", { type: "manual", message: "Each image must be less than 5MB" });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const updatedFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(updatedFiles);
    setValue("images", updatedFiles, { shouldValidate: true });
    clearErrors("images");

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove a selected file
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setValue("images", updated, { shouldValidate: true });
      if (updated.length === 0) {
        setFormError("images", { type: "manual", message: "Please select at least one image" });
      }
      return updated;
    });
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (formData) => {
    if (!formData.images || formData.images.length === 0) {
      setFormError("images", { type: "manual", message: "Please select at least one image" });
      return;
    }

    try {
      setUploading(true);
      setServerError(null);

      const uploadedImages = await bookingsService.uploadBookingImages(
        bookingId,
        imageType,
        formData.images,
        formData.description
      );

      setSuccess(`Successfully uploaded ${uploadedImages.length} image(s)`);

      reset();
      setSelectedFiles([]);
      setPreviewUrls([]);

      if (onUploadSuccess) {
        onUploadSuccess(uploadedImages);
      }

      // Auto clear success message
      setTimeout(() => setSuccess(null), 1800);
    } catch (err) {
      console.error('Error uploading images:', err);
      setServerError(err?.error || err?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="bg-white rounded-lg p-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Upload {imageTypeLabels[imageType] || "Booking Photos"}
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
      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {serverError}
        </div>
      )}

      {errors.images && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.images.message}
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
            disabled={uploading || selectedFiles.length >= 5}
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
          {...register("description")}
          placeholder="Add any notes about these images..."
          className={`w-full p-3 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:outline-none focus:border-green-600`}
          rows="3"
          disabled={uploading}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition"
            disabled={uploading}
          >
            Cancel
          </button>
        )}
        <ActionButton
          type="submit"
          label={`Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          loadingLabel="Uploading..."
          isLoading={uploading}
          disabled={uploading || selectedFiles.length === 0}
          variant="primary"
          size="md"
          className="flex-1"
        />
      </div>
    </form>
  );
}
