import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProviderDashboardLayout from '../../../layouts/ProviderDashboardLayout';
import { MdEdit, MdSave, MdCancel } from 'react-icons/md';
import api from '../../../api/axios';

export default function ProviderProfile() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    
    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({
        business_name: '',
        years_of_experience: '',
        service_area: '',
        city: '',
        address: '',
        bio: '',
    });
    
    const [specialities, setSpecialities] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [selectedSpecialities, setSelectedSpecialities] = useState([]);
    const [selectedSpecializations, setSelectedSpecializations] = useState([]);

    useEffect(() => {
        fetchProfile();
        fetchSpecialitiesAndSpecializations();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/me/');
            setProfileData(response.data);
            
            setFormData({
                business_name: response.data.business_name || '',
                years_of_experience: response.data.years_of_experience || '',
                service_area: response.data.service_area || '',
                city: response.data.city || '',
                address: response.data.address || '',
                bio: response.data.bio || '',
            });
            
            // Set profile picture preview from URL
            if (response.data.profile_picture_url) {
                setProfilePicturePreview(response.data.profile_picture_url);
            }
            
            // Set selected specialities and specializations
            setSelectedSpecialities(response.data.specialities?.map(s => s.id) || []);
            setSelectedSpecializations(response.data.specializations?.map(s => s.id) || []);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecialitiesAndSpecializations = async () => {
        try {
            const [specialitiesRes, specializationsRes] = await Promise.all([
                api.get('/auth/specialities/'),
                api.get('/auth/specializations/')
            ]);
            setSpecialities(specialitiesRes.data);
            setSpecializations(specializationsRes.data);
        } catch (err) {
            console.error('Error fetching specialities:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Only image files are allowed');
                return;
            }

            setProfilePictureFile(file);
            setError(null);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProfilePicture = () => {
        setProfilePictureFile(null);
        setProfilePicturePreview(null);
    };

    const handleSpecialityToggle = (id) => {
        setSelectedSpecialities(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSpecializationToggle = (id) => {
        setSelectedSpecializations(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const getFilteredSpecializations = () => {
        if (selectedSpecialities.length === 0) return [];
        return specializations.filter(spec =>
            selectedSpecialities.includes(spec.speciality)
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Create FormData for profile update (backend expects multipart/form-data)
            const profileFormData = new FormData();
            profileFormData.append('business_name', formData.business_name || '');
            profileFormData.append('years_of_experience', parseInt(formData.years_of_experience) || 0);
            profileFormData.append('service_area', formData.service_area || '');
            profileFormData.append('city', formData.city || '');
            profileFormData.append('address', formData.address || '');
            profileFormData.append('bio', formData.bio || '');

            // Add profile picture if selected
            if (profilePictureFile) {
                profileFormData.append('profile_picture', profilePictureFile);
            }

            // Update basic profile info
            await api.patch('/auth/me/update/', profileFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Update specialities and specializations (this endpoint accepts JSON)
            await api.post('/auth/update-user-type/', {
                user_type: 'offer',
                specialities: selectedSpecialities,
                specializations: selectedSpecializations,
            });

            setSuccessMessage('Profile updated successfully! Your changes are now available in My Services.');
            setIsEditing(false);
            setProfilePictureFile(null);
            fetchProfile(); // Refresh profile data
            
            // Auto-dismiss success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form to original values
        setFormData({
            business_name: profileData.business_name || '',
            years_of_experience: profileData.years_of_experience || '',
            service_area: profileData.service_area || '',
            city: profileData.city || '',
            address: profileData.address || '',
            bio: profileData.bio || '',
        });
        setSelectedSpecialities(profileData.specialities?.map(s => s.id) || []);
        setSelectedSpecializations(profileData.specializations?.map(s => s.id) || []);
        setProfilePictureFile(null);
        setProfilePicturePreview(profileData.profile_picture_url || null);
        setError(null);
    };

    if (loading) {
        return (
            <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </ProviderDashboardLayout>
        );
    }

    return (
        <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your profile and expertise</p>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-green-700 font-semibold mb-2">✓ {successMessage}</p>
                            <Link 
                                to="/provider/my-services" 
                                className="text-sm text-green-600 hover:text-green-800 underline"
                            >
                                Go to My Services →
                            </Link>
                        </div>
                        <button 
                            onClick={() => setSuccessMessage(null)}
                            className="text-green-700 hover:text-green-900"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Profile Content */}
            <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row gap-2 items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            {profilePicturePreview ? (
                                <img 
                                    src={profilePicturePreview} 
                                    alt="Profile" 
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl select-none">
                                    {formData.business_name ? formData.business_name.charAt(0).toUpperCase() : 'P'}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-lg">{formData.business_name || 'Your Business'}</p>
                            <p className="text-gray-600">{profileData?.email}</p>
                            <p className="text-gray-600">{profileData?.phone_number || "Phone not set"}</p>
                            <span className="mt-1 inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                                Service Provider
                            </span>
                        </div>
                    </div>
                    {!isEditing ? (
                        <button
                            type="button"
                            className="inline-flex items-center ml-10 gap-2 rounded border border-green-600 bg-white px-4 py-2 text-green-600 hover:bg-green-600 hover:text-white transition-all duration-200 font-semibold text-sm focus:outline-none cursor-pointer"
                            onClick={() => setIsEditing(true)}
                        >
                            <MdEdit size={16} />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600 cursor-pointer transition-all duration-200"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 cursor-pointer transition-all duration-200 disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Profile Picture Upload Section (Edit Only) */}
                {isEditing && (
                    <div className="bg-white p-6 rounded-lg shadow">
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
                                    id="profile_picture_input"
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
                            </div>
                        </div>
                    </div>
                )}

                {/* Basic Information */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Name
                            </label>
                            <input
                                type="text"
                                name="business_name"
                                value={formData.business_name}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full p-3 border border-gray-300 rounded-md ${isEditing ? 'focus:outline-none focus:border-green-600' : 'bg-gray-50'}`}
                                placeholder="Your Business Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Years of Experience
                            </label>
                            <input
                                type="number"
                                name="years_of_experience"
                                value={formData.years_of_experience}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                min="0"
                                className={`w-full p-3 border border-gray-300 rounded-md ${isEditing ? 'focus:outline-none focus:border-green-600' : 'bg-gray-50'}`}
                                placeholder="5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full p-3 border border-gray-300 rounded-md ${isEditing ? 'focus:outline-none focus:border-green-600' : 'bg-gray-50'}`}
                                placeholder="Kathmandu"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Area
                            </label>
                            <input
                                type="text"
                                name="service_area"
                                value={formData.service_area}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full p-3 border border-gray-300 rounded-md ${isEditing ? 'focus:outline-none focus:border-green-600' : 'bg-gray-50'}`}
                                placeholder="e.g., Kathmandu Valley"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full p-3 border border-gray-300 rounded-md ${isEditing ? 'focus:outline-none focus:border-green-600' : 'bg-gray-50'}`}
                                placeholder="Your complete address"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bio / Description
                            </label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                rows="4"
                                className={`w-full p-3 border border-gray-300 rounded-md ${isEditing ? 'focus:outline-none focus:border-green-600' : 'bg-gray-50'}`}
                                placeholder="Tell us about yourself and your services..."
                            />
                        </div>
                    </div>
                </div>

                {/* Specialities & Specializations */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Services & Expertise</h2>
                    
                    {isEditing && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Important:</strong> Add or remove specialities and specializations here. 
                                After saving, these changes will be reflected in your <em>My Services</em> section.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Main Specialities {isEditing && <span className="text-red-500">*</span>}
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {specialities.map(speciality => (
                                    <button
                                        key={speciality.id}
                                        type="button"
                                        onClick={() => isEditing && handleSpecialityToggle(speciality.id)}
                                        disabled={!isEditing}
                                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                                            selectedSpecialities.includes(speciality.id)
                                                ? 'border-green-600 bg-green-50 text-green-700'
                                                : 'border-gray-300 hover:border-gray-400'
                                        } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                        {speciality.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedSpecialities.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Specific Expertise
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    {getFilteredSpecializations().map(specialization => (
                                        <button
                                            key={specialization.id}
                                            type="button"
                                            onClick={() => isEditing && handleSpecializationToggle(specialization.id)}
                                            disabled={!isEditing}
                                            className={`p-2 text-sm rounded-lg border transition-all text-left ${
                                                selectedSpecializations.includes(specialization.id)
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 hover:border-gray-400 bg-white'
                                            } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                            {specialization.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Information (Read-only) */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={profileData?.full_name || ''}
                                disabled
                                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={profileData?.email || ''}
                                disabled
                                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={profileData?.phone_number || ''}
                                disabled
                                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Status
                            </label>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    profileData?.is_verified 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {profileData?.is_verified ? 'Verified' : 'Pending Verification'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Save/Cancel Buttons */}
                {isEditing && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600 cursor-pointer transition-all duration-200 disabled:opacity-50"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 cursor-pointer transition-all duration-200 disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ProviderDashboardLayout>
    );
}
