import React, { useState, useEffect } from "react";
import { FiEdit2 } from "react-icons/fi";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import DashboardLayout from "../../../layouts/DashboardLayout";
import userService from "../../../services/userService";
import { useUserProfile } from "../../../context/UserProfileContext";
import { userProfileEditSchema } from "../../../validations/userSchemas";

export default function UserMyProfile() {
    const [activeMenuKey, setActiveMenuKey] = useState("my-profile");
    const [activeTab, setActiveTab] = useState("Personal Info");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { userProfile: userData } = useUserProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
        clearErrors,
    } = useForm({
        resolver: yupResolver(userProfileEditSchema),
        defaultValues: {
            first_name: "",
            middle_name: "",
            last_name: "",
            address: "",
            city: "",
            district: "",
            postal_code: "",
            bio: "",
            location: "",
            profile_picture: null,
        },
        mode: 'onBlur',
    });

    const profilePictureFile = watch('profile_picture');

    useEffect(() => {
        register('profile_picture');
    }, [register]);

    useEffect(() => {
        if (profilePictureFile) {
            const reader = new FileReader();
            reader.onloadend = () => setProfilePicturePreview(reader.result);
            reader.readAsDataURL(profilePictureFile);
        }
    }, [profilePictureFile]);

    // Fetch user profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.getProfile();
            setUserProfile(data);
            
            // Map API response to form fields
            reset({
                first_name: data.first_name || "",
                middle_name: data.middle_name || "",
                last_name: data.last_name || "",
                address: data.address || "",
                city: data.city || "",
                district: data.district || "",
                postal_code: data.postal_code || "",
                bio: data.bio || "",
                location: data.location || "",
                profile_picture: null,
            });
            
            // Set initial preview if profile picture exists
            if (data.profile_picture_url) {
                setProfilePicturePreview(data.profile_picture_url);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError(err.error || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    // Handle file input for profile picture
    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        setValue('profile_picture', file || null, { shouldValidate: true });
        clearErrors('profile_picture');
    };

    // Handle Edit button click
    const handleEditClick = () => {
        setIsEditing(true);
    };

    // Handle Cancel button click
    const handleCancel = () => {
        reset({
            first_name: userProfile?.first_name || "",
            middle_name: userProfile?.middle_name || "",
            last_name: userProfile?.last_name || "",
            address: userProfile?.address || "",
            city: userProfile?.city || "",
            district: userProfile?.district || "",
            postal_code: userProfile?.postal_code || "",
            bio: userProfile?.bio || "",
            location: userProfile?.location || "",
            profile_picture: null,
        });
        setProfilePicturePreview(userProfile?.profile_picture_url || null);
        setIsEditing(false);
    };

    // Handle Save Changes
    const onSubmit = async (data) => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            
            // Create FormData for multipart submission
            const updateData = new FormData();
            updateData.append('first_name', data.first_name || '');
            updateData.append('middle_name', data.middle_name || '');
            updateData.append('last_name', data.last_name || '');
            updateData.append('address', data.address || '');
            updateData.append('city', data.city || '');
            updateData.append('district', data.district || '');
            updateData.append('postal_code', data.postal_code || '');
            updateData.append('bio', data.bio || '');
            updateData.append('location', data.location || '');
            
            // Include profile picture if selected
            if (data.profile_picture) {
                updateData.append('profile_picture', data.profile_picture);
            }
            
            const updated = await userService.updateProfile(updateData);
            setUserProfile(updated);
            
            // Update preview with new profile picture URL
            if (updated.profile_picture_url) {
                setProfilePicturePreview(updated.profile_picture_url);
            }
            
            setSuccess("Profile updated successfully!");
            setIsEditing(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Error saving profile:", err);
            setError(err.error || err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // Get initials for avatar
    const getInitials = () => {
        const first = watch('first_name')?.charAt(0) || "";
        const last = watch('last_name')?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    };

    // Get full name
    const getFullName = () => {
        const first = watch('first_name');
        const middle = watch('middle_name');
        const last = watch('last_name');
        const parts = [first, middle, last];
        return parts.filter(p => p).join(' ').trim() || "User";
    };

    // Tabs array
    const tabs = ["Personal Info", "Security", "Preferences"];
    return (
        <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey} userData={userData}>
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
                <p className="mt-1 text-gray-600">
                    Manage your account settings and preferences
                </p>
            </header>

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {success}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading profile...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Profile Card */}
                    <div className="bg-white rounded-lg shadow-lg mt-8 p-6 flex flex-col sm:flex-row gap-2 items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                {profilePicturePreview ? (
                                    <img 
                                        src={profilePicturePreview} 
                                        alt="Profile" 
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl select-none">
                                        {getInitials()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{getFullName()}</p>
                                <p className="text-gray-600">{userProfile?.email}</p>
                                <p className="text-gray-600">{userProfile?.phone_number || "Phone not set"}</p>
                                <span className="mt-1 inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                                    Verified Customer
                                </span>
                            </div>
                        </div>
                        {!isEditing ? (
                            <button
                                type="button"
                                className="inline-flex items-center ml-10 gap-2 rounded border border-green-600 bg-white px-4 py-2 text-green-600 hover:bg-green-600 hover:text-white transition-all duration-200 font-semibold text-sm focus:outline-none cursor-pointer"
                                onClick={handleEditClick}
                            >
                                <FiEdit2 size={16} />
                                Edit Profile
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600 cursor-pointer transition-all duration-200"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="mt-8 flex sm:max-w-96 space-x-4 mb-2 bg-gray-200 rounded-lg">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 m-1 py-2 flex justify text-sm font-medium rounded transition cursor-pointer ${activeTab === tab
                                    ? "bg-white text-green-600"
                                    : "text-gray-700 hover:text-gray-900"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Personal Information Form */}
                    {activeTab === "Personal Info" && (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="bg-white rounded-b-lg shadow px-6 py-8 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {/* Profile Picture Upload - full width */}
                            {isEditing && (
                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 font-medium mb-3">
                                        Profile Picture
                                    </label>
                                    <div className="flex gap-6">
                                        {/* Preview */}
                                        <div className="shrink-0">
                                            {profilePicturePreview ? (
                                                <img 
                                                    src={profilePicturePreview} 
                                                    alt="Profile Preview" 
                                                    className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                                    No image
                                                </div>
                                            )}
                                        </div>
                                        {/* Upload input */}
                                        <div className="grow">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleProfilePictureChange}
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-md file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-green-600 file:text-white
                                                    hover:file:bg-green-700
                                                    cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">
                                                JPG, PNG or GIF (max. 5MB)
                                            </p>
                                            {errors.profile_picture && (
                                                <p className="text-red-500 text-xs mt-1">{errors.profile_picture.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {[
                                { label: "First Name", name: "first_name", type: "text" },
                                { label: "Middle Name (Optional)", name: "middle_name", type: "text" },
                                { label: "Last Name", name: "last_name", type: "text" },
                                { label: "Address", name: "address", type: "text" },
                                { label: "City", name: "city", type: "text" },
                                { label: "District", name: "district", type: "text" },
                                { label: "Postal Code", name: "postal_code", type: "text" },
                            ].map(({ label, name, type }) => (
                                <div key={name}>
                                    <label
                                        htmlFor={name}
                                        className="block text-gray-700 font-medium mb-1"
                                    >
                                        {label}
                                    </label>
                                    <input
                                        id={name}
                                        type={type}
                                        {...register(name)}
                                        disabled={!isEditing}
                                        className={`w-full rounded border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 ${
                                            isEditing
                                                ? `border-${errors[name] ? 'red' : 'gray'}-300 focus:ring-green-500`
                                                : "border-transparent bg-gray-100 cursor-not-allowed"
                                            } ${errors[name] ? 'border-red-500' : ''}`}
                                    />
                                    {errors[name] && (
                                        <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
                                    )}
                                </div>
                            ))}

                            {/* Location - full width */}
                            <div className="md:col-span-2">
                                <label htmlFor="location" className="block text-gray-700 font-medium mb-1">
                                    Location
                                </label>
                                <input
                                    id="location"
                                    {...register('location')}
                                    disabled={!isEditing}
                                    className={`w-full rounded border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 ${
                                        isEditing
                                            ? `border-${errors.location ? 'red' : 'gray'}-300 focus:ring-green-500`
                                            : "border-transparent bg-gray-100 cursor-not-allowed"
                                        } ${errors.location ? 'border-red-500' : ''}`}
                                />
                                {errors.location && (
                                    <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
                                )}
                            </div>

                            {/* Bio Textarea - full width */}
                            <div className="md:col-span-2">
                                <label htmlFor="bio" className="block text-gray-700 font-medium mb-1">
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    {...register('bio')}
                                    disabled={!isEditing}
                                    rows={4}
                                    placeholder="Tell us about yourself"
                                    className={`w-full rounded border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 resize-none ${
                                        isEditing
                                            ? `border-${errors.bio ? 'red' : 'gray'}-300 focus:ring-green-500`
                                            : "border-transparent bg-gray-100 cursor-not-allowed"
                                        } ${errors.bio ? 'border-red-500' : ''}`}
                                />
                                {errors.bio && (
                                    <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>
                                )}
                            </div>

                            {/* Save/Cancel Buttons */}
                            {isEditing && (
                                <div className="md:col-span-2 flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600 cursor-pointer transition-all duration-200 disabled:opacity-50"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 cursor-pointer transition-all duration-200 disabled:opacity-50"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {activeTab !== "Personal Info" && (
                        <div className="bg-white p-8 rounded-lg shadow mt-4 text-gray-700">
                            <p>{activeTab} page content goes here.</p>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
