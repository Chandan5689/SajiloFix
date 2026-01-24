import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation as useLocationHook } from 'react-router-dom';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { Upload, FileText, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import AddressAutocomplete from '../../components/AddressAutocomplete';

function CompleteProviderProfile() {
    const { user, getToken } = useSupabaseAuth();
    const { refreshProfile } = useUserProfile();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [specialities, setSpecialities] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [certificates, setCertificates] = useState([]);

    // Citizenship previews
    const [citizenshipFrontPreview, setCitizenshipFrontPreview] = useState(null);
    const [citizenshipBackPreview, setCitizenshipBackPreview] = useState(null);

    // Get location from navigation state (passed from registration step)
    const locationState = useLocationHook();
    const locationFromRegistration = locationState?.state?.location;

    const [formData, setFormData] = useState({
        business_name: '',
        years_of_experience: '',
        service_area: '',
        location: locationFromRegistration || '',
        bio: '',
        citizenship_number: '',
        citizenship_front: null,
        citizenship_back: null,
        specialities: [],
        specializations: []
    });

    useEffect(() => {
        fetchSpecialities();
    }, []);

    const fetchSpecialities = async () => {
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
        
        // For citizenship number, only allow digits
        if (name === 'citizenship_number') {
            const numericValue = value.replace(/\D/g, '').slice(0, 11);
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        
        if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: '' });
        }
    };

    const handleSpecialityToggle = (id) => {
        setFormData(prev => ({
            ...prev,
            specialities: prev.specialities.includes(id)
                ? prev.specialities.filter(s => s !== id)
                : [...prev.specialities, id]
        }));
        if (fieldErrors.specialities) {
            setFieldErrors({ ...fieldErrors, specialities: '' });
        }
    };

    const handleSpecializationToggle = (id) => {
        setFormData(prev => ({
            ...prev,
            specializations: prev.specializations.includes(id)
                ? prev.specializations.filter(s => s !== id)
                : [...prev.specializations, id]
        }));
        if (fieldErrors.specializations) {
            setFieldErrors({ ...fieldErrors, specializations: '' });
        }
    };

    const handleCitizenshipFrontChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setFieldErrors({ ...fieldErrors, citizenship_front: 'File size must be less than 5MB' });
                return;
            }
            if (!file.type.startsWith('image/')) {
                setFieldErrors({ ...fieldErrors, citizenship_front: 'Only image files are allowed' });
                return;
            }
            setFormData({ ...formData, citizenship_front: file });
            const reader = new FileReader();
            reader.onloadend = () => setCitizenshipFrontPreview(reader.result);
            reader.readAsDataURL(file);
            if (fieldErrors.citizenship_front) {
                setFieldErrors({ ...fieldErrors, citizenship_front: '' });
            }
        }
    };

    const handleCitizenshipBackChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setFieldErrors({ ...fieldErrors, citizenship_back: 'File size must be less than 5MB' });
                return;
            }
            if (!file.type.startsWith('image/')) {
                setFieldErrors({ ...fieldErrors, citizenship_back: 'Only image files are allowed' });
                return;
            }
            setFormData({ ...formData, citizenship_back: file });
            const reader = new FileReader();
            reader.onloadend = () => setCitizenshipBackPreview(reader.result);
            reader.readAsDataURL(file);
            if (fieldErrors.citizenship_back) {
                setFieldErrors({ ...fieldErrors, citizenship_back: '' });
            }
        }
    };

    const handleCertificateUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                errors.push(`${file.name} is too large (max 10MB)`);
                return;
            }
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name} has invalid format`);
                return;
            }
            validFiles.push(file);
        });

        if (errors.length > 0) {
            setFieldErrors({ ...fieldErrors, certificates: errors.join(', ') });
            return;
        }

        const newCertificates = validFiles.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            file: file,
            size: file.size
        }));

        setCertificates([...certificates, ...newCertificates]);
        e.target.value = '';
    };

    const handleRemoveCertificate = (id) => {
        setCertificates(certificates.filter(cert => cert.id !== id));
    };

    const validateForm = () => {
        const errors = {};

        // Required fields
        if (!formData.years_of_experience || formData.years_of_experience < 0) {
            errors.years_of_experience = 'Years of experience is required';
        }
        if (!formData.service_area.trim()) {
            errors.service_area = 'Service area is required';
        }
        const locationText = typeof formData.location === 'string' ? formData.location : (formData.location?.formatted || '');
        if (!locationText.trim()) {
            errors.location = 'Service location is required';
        }
        if (formData.specialities.length === 0) {
            errors.specialities = 'Please select at least one speciality';
        }
        if (formData.specialities.length > 0 && formData.specializations.length === 0) {
            errors.specializations = 'Please select at least one specialization for your selected specialities';
        }
        // Check that each selected speciality has at least one specialization
        if (formData.specialities.length > 0 && formData.specializations.length > 0) {
            const selectedSpecIds = new Set(formData.specializations.map(id => {
                const spec = specializations.find(s => s.id === id);
                return spec?.speciality;
            }));
            const missingSpeciality = formData.specialities.find(id => !selectedSpecIds.has(id));
            if (missingSpeciality) {
                const missing = specialities.find(s => s.id === missingSpeciality);
                errors.specializations = `Please select at least one specialization for ${missing?.name || 'each speciality'}`;
            }
        }
        if (!formData.citizenship_front) {
            errors.citizenship_front = 'Citizenship front image is required';
        }
        if (!formData.citizenship_back) {
            errors.citizenship_back = 'Citizenship back image is required';
        }
        if (!formData.citizenship_number.trim()) {
            errors.citizenship_number = 'Citizenship number is required';
        } else if (!/^\d{11}$/.test(formData.citizenship_number)) {
            errors.citizenship_number = 'Citizenship number must be exactly 11 digits';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            const token = await getToken();

            // Step 1: Update user type and basic info
            const locationData = typeof formData.location === 'string' 
                ? { formatted: formData.location } 
                : formData.location;

            // Prepare location payload with all fields for backend
            const locationPayload = {
                location: locationData?.formatted || '',
                address: locationData?.formatted || '',
                city: locationData?.city || '',
                district: locationData?.district || '',
                postal_code: locationData?.postal_code || '',
                latitude: locationData?.latitude || null,
                longitude: locationData?.longitude || null,
            };

            await api.post(
                '/auth/update-user-type/',
                {
                    user_type: 'offer',
                    business_name: formData.business_name,
                    years_of_experience: parseInt(formData.years_of_experience),
                    service_area: formData.service_area,
                    ...locationPayload,
                    bio: formData.bio,
                    specialities: formData.specialities,
                    specializations: formData.specializations
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Step 2: Upload citizenship documents
            const citizenshipFormData = new FormData();
            citizenshipFormData.append('citizenship_front', formData.citizenship_front);
            citizenshipFormData.append('citizenship_back', formData.citizenship_back);
            citizenshipFormData.append('citizenship_number', formData.citizenship_number);

            await api.post(
                '/auth/upload-citizenship/',
                citizenshipFormData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Step 3: Upload certificates (if any)
            if (certificates.length > 0) {
                const certificatesFormData = new FormData();
                certificates.forEach(cert => {
                    certificatesFormData.append('certificates', cert.file);
                });

                await api.post(
                    '/auth/upload-certificates/',
                    certificatesFormData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
            }

            // Refresh the user profile context before navigating
            await refreshProfile();
            navigate('/provider/dashboard');
        } catch (err) {
            console.error('Error completing profile:', err);
            setError(err.response?.data?.error || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredSpecializations = () => {
        if (formData.specialities.length === 0) return [];
        return specializations.filter(spec =>
            formData.specialities.includes(spec.speciality)
        );
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🛠️</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Complete Your Provider Profile
                    </h2>
                    <p className="text-gray-600">
                        Tell us about your services and verify your identity
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Business Information Section */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
                            Business Information
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Name <span className="text-gray-400">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="business_name"
                                    value={formData.business_name}
                                    onChange={handleInputChange}
                                    placeholder="Your Business Name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Years of Experience *
                                </label>
                                <input
                                    type="number"
                                    name="years_of_experience"
                                    value={formData.years_of_experience}
                                    onChange={handleInputChange}
                                    min="0"
                                    placeholder="5"
                                    className={`w-full px-4 py-3 border ${fieldErrors.years_of_experience ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-green-500`}
                                    required
                                />
                                {fieldErrors.years_of_experience && (
                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.years_of_experience}</p>
                                )}
                            </div>

                            <div>
                                <AddressAutocomplete
                                    label="Service Location *"
                                    value={formData.location}
                                    onChange={(val) => {
                                        setFormData({ ...formData, location: val });
                                        if (fieldErrors.location) {
                                            setFieldErrors({ ...fieldErrors, location: '' });
                                        }
                                    }}
                                    disabled={loading}
                                    required
                                />
                                {fieldErrors.location && (
                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Service Area (km) *
                                </label>
                                <input
                                    type="number"
                                    name="service_area"
                                    value={formData.service_area}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 20"
                                    min="0"
                                    className={`w-full px-4 py-3 border ${fieldErrors.service_area ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-green-500`}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter kilometers only (e.g., 10, 20)</p>
                                {fieldErrors.service_area && (
                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.service_area}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bio / Description <span className="text-gray-400">(Optional)</span>
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Tell us about yourself and your services..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Specialities Section */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
                            Services & Expertise
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Tip:</strong> Add the specialities and specific specializations you are truly expert in. You can set prices and other service details later from your dashboard under <em>My Services</em>.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Main Specialities * (Select at least one)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {specialities.map(speciality => (
                                        <button
                                            key={speciality.id}
                                            type="button"
                                            onClick={() => handleSpecialityToggle(speciality.id)}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${formData.specialities.includes(speciality.id)
                                                    ? 'border-green-600 bg-green-50 text-green-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {speciality.name}
                                        </button>
                                    ))}
                                </div>
                                {fieldErrors.specialities && (
                                    <p className="text-red-500 text-sm mt-2">{fieldErrors.specialities}</p>
                                )}
                            </div>

                            {formData.specialities.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specific Expertise * (Select at least one for each speciality)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        {getFilteredSpecializations().map(specialization => (
                                            <button
                                                key={specialization.id}
                                                type="button"
                                                onClick={() => handleSpecializationToggle(specialization.id)}
                                                className={`p-2 text-sm rounded-lg border transition-all text-left ${formData.specializations.includes(specialization.id)
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-gray-300 hover:border-gray-400 bg-white'
                                                    }`}
                                            >
                                                {specialization.name}
                                            </button>
                                        ))}
                                    </div>
                                    {fieldErrors.specializations && (
                                        <p className="text-red-500 text-sm mt-2">{fieldErrors.specializations}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Citizenship/ID Verification Section */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
                            Identity Verification *
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Citizenship Number * (11 digits)
                                </label>
                                <input
                                    type="text"
                                    name="citizenship_number"
                                    value={formData.citizenship_number}
                                    onChange={handleInputChange}
                                    placeholder="Enter 11-digit citizenship number"
                                    maxLength={11}
                                    inputMode="numeric"
                                    pattern="\d{11}"
                                    className={`w-full px-4 py-3 border ${fieldErrors.citizenship_number ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-green-500`}
                                    required
                                />
                                {fieldErrors.citizenship_number && (
                                    <p className="text-red-500 text-xs mt-1">{fieldErrors.citizenship_number}</p>
                                )}
                                {!fieldErrors.citizenship_number && formData.citizenship_number && (
                                    <p className="text-gray-500 text-xs mt-1">{formData.citizenship_number.length}/11 digits</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Front Side */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Front Side *
                                    </label>
                                    <div className={`border-2 border-dashed ${fieldErrors.citizenship_front ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg p-4 text-center`}>
                                        {citizenshipFrontPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={citizenshipFrontPreview}
                                                    alt="Citizenship Front"
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, citizenship_front: null });
                                                        setCitizenshipFrontPreview(null);
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                                <label
                                                    htmlFor="citizenship_front"
                                                    className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                >
                                                    Upload Front Side
                                                </label>
                                                <input
                                                    type="file"
                                                    id="citizenship_front"
                                                    accept="image/*"
                                                    onChange={handleCitizenshipFrontChange}
                                                    className="hidden"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                    {fieldErrors.citizenship_front && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.citizenship_front}</p>
                                    )}
                                </div>

                                {/* Back Side */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Back Side *
                                    </label>
                                    <div className={`border-2 border-dashed ${fieldErrors.citizenship_back ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg p-4 text-center`}>
                                        {citizenshipBackPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={citizenshipBackPreview}
                                                    alt="Citizenship Back"
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, citizenship_back: null });
                                                        setCitizenshipBackPreview(null);
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                                <label
                                                    htmlFor="citizenship_back"
                                                    className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                >
                                                    Upload Back Side
                                                </label>
                                                <input
                                                    type="file"
                                                    id="citizenship_back"
                                                    accept="image/*"
                                                    onChange={handleCitizenshipBackChange}
                                                    className="hidden"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                    {fieldErrors.citizenship_back && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.citizenship_back}</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> Your identity documents will be securely stored and verified by our team. This helps maintain trust and safety on our platform.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Certificates Section (Optional) */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-gray-100 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">4</span>
                            Certificates & Documents <span className="text-gray-400 text-base ml-2">(Optional)</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                <label
                                    htmlFor="certificates"
                                    className="cursor-pointer bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors inline-block font-medium"
                                >
                                    Upload Certificates
                                </label>
                                <input
                                    type="file"
                                    id="certificates"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={handleCertificateUpload}
                                    className="hidden"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
                                </p>
                            </div>

                            {fieldErrors.certificates && (
                                <p className="text-red-500 text-sm">{fieldErrors.certificates}</p>
                            )}

                            {certificates.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Uploaded Certificates ({certificates.length})
                                    </p>
                                    {certificates.map(cert => (
                                        <div
                                            key={cert.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-8 w-8 text-blue-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {(cert.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCertificate(cert.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="border-t pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors text-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Completing Profile...
                                </span>
                            ) : (
                                'Complete Profile & Get Started'
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-3">
                            By completing your profile, you agree to our{' '}
                            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default CompleteProviderProfile;