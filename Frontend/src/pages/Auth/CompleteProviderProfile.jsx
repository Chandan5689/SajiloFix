import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation as useLocationHook } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Upload, FileText, Trash2, X } from 'lucide-react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useUserProfile } from '../../context/UserProfileContext';
import api from '../../api/axios';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { providerProfileSchema } from '../../validations/providerSchemas';
import { uploadCitizenshipDocument, uploadCertificate } from '../../utils/supabaseStorage';

const allowedCertificateTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function CompleteProviderProfile() {
    const { getToken } = useSupabaseAuth();
    const { refreshProfile } = useUserProfile();
    const navigate = useNavigate();
    const locationState = useLocationHook();
    const locationFromRegistration = locationState?.state?.location;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [specialities, setSpecialities] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [citizenshipFrontPreview, setCitizenshipFrontPreview] = useState(null);
    const [citizenshipBackPreview, setCitizenshipBackPreview] = useState(null);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        clearErrors,
        setError: setFormError,
    } = useForm({
        resolver: yupResolver(providerProfileSchema),
        defaultValues: {
            businessName: '',
            yearsOfExperience: '',
            serviceArea: '',
            location: locationFromRegistration || '',
            bio: '',
            citizenshipNumber: '',
            citizenshipFront: null,
            citizenshipBack: null,
            specialities: [],
            specializations: [],
            certificates: [],
        },
        mode: 'onBlur',
    });

    const selectedSpecialities = watch('specialities') || [];
    const selectedSpecializations = watch('specializations') || [];
    const certificates = watch('certificates') || [];
    const citizenshipFrontFile = watch('citizenshipFront');
    const citizenshipBackFile = watch('citizenshipBack');

    useEffect(() => {
        register('citizenshipFront');
        register('citizenshipBack');
        register('certificates');
    }, [register]);

    useEffect(() => {
        if (locationFromRegistration) {
            setValue('location', locationFromRegistration);
        }
    }, [locationFromRegistration, setValue]);

    useEffect(() => {
        const load = async () => {
            try {
                const [specialitiesRes, specializationsRes] = await Promise.all([
                    api.get('/auth/specialities/'),
                    api.get('/auth/specializations/'),
                ]);
                setSpecialities(specialitiesRes.data);
                setSpecializations(specializationsRes.data);
            } catch (err) {
                console.error('Error fetching specialities:', err);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (citizenshipFrontFile) {
            const reader = new FileReader();
            reader.onloadend = () => setCitizenshipFrontPreview(reader.result);
            reader.readAsDataURL(citizenshipFrontFile);
        } else {
            setCitizenshipFrontPreview(null);
        }
    }, [citizenshipFrontFile]);

    useEffect(() => {
        if (citizenshipBackFile) {
            const reader = new FileReader();
            reader.onloadend = () => setCitizenshipBackPreview(reader.result);
            reader.readAsDataURL(citizenshipBackFile);
        } else {
            setCitizenshipBackPreview(null);
        }
    }, [citizenshipBackFile]);

    const handleSpecialityToggle = (id) => {
        const updated = selectedSpecialities.includes(id)
            ? selectedSpecialities.filter((s) => s !== id)
            : [...selectedSpecialities, id];

        const filteredSpecializations = (selectedSpecializations || []).filter((specId) => {
            const spec = specializations.find((s) => s.id === specId);
            return spec && updated.includes(spec.speciality);
        });

        setValue('specialities', updated, { shouldValidate: true });
        setValue('specializations', filteredSpecializations, { shouldValidate: true });
        clearErrors(['specialities', 'specializations']);
    };

    const handleSpecializationToggle = (id) => {
        const updated = selectedSpecializations.includes(id)
            ? selectedSpecializations.filter((s) => s !== id)
            : [...selectedSpecializations, id];

        setValue('specializations', updated, { shouldValidate: true });
        clearErrors('specializations');
    };

    const handleCitizenshipFrontChange = (e) => {
        const file = e.target.files?.[0];
        setValue('citizenshipFront', file || null, { shouldValidate: true });
        clearErrors('citizenshipFront');
    };

    const handleCitizenshipBackChange = (e) => {
        const file = e.target.files?.[0];
        setValue('citizenshipBack', file || null, { shouldValidate: true });
        clearErrors('citizenshipBack');
    };

    const handleCertificateUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const errorsList = [];
        const newCertificates = [];

        files.forEach((file) => {
            if (file.size > 10 * 1024 * 1024) {
                errorsList.push(`${file.name} is too large (max 10MB)`);
                return;
            }
            if (!allowedCertificateTypes.includes(file.type)) {
                errorsList.push(`${file.name} has an invalid format`);
                return;
            }
            newCertificates.push({
                id: `${Date.now()}-${file.name}-${Math.random()}`,
                name: file.name,
                file,
                size: file.size,
            });
        });

        if (errorsList.length) {
            setFormError('certificates', { type: 'manual', message: errorsList.join(', ') });
            e.target.value = '';
            return;
        }

        setValue('certificates', [...certificates, ...newCertificates], { shouldValidate: true });
        clearErrors('certificates');
        e.target.value = '';
    };

    const handleRemoveCertificate = (id) => {
        const updated = certificates.filter((cert) => cert.id !== id);
        setValue('certificates', updated, { shouldValidate: true });
    };

    const getFilteredSpecializations = () => {
        if (!selectedSpecialities.length) return [];
        return specializations.filter((spec) => selectedSpecialities.includes(spec.speciality));
    };

    const ensureSpecializationCoverage = (specialityIds, specializationIds) => {
        const specLookup = new Map();
        specializations.forEach((spec) => {
            specLookup.set(spec.id, spec.speciality);
        });

        const covered = new Set((specializationIds || []).map((id) => specLookup.get(id)));
        const missing = (specialityIds || []).find((id) => !covered.has(id));
        if (missing) {
            const missingSpec = specialities.find((s) => s.id === missing);
            return `Please select at least one specialization for ${missingSpec?.name || 'each speciality'}`;
        }
        return null;
    };

    const onSubmit = async (data) => {
        setError('');
        clearErrors('specializations');

        const specializationError = ensureSpecializationCoverage(data.specialities, data.specializations);
        if (specializationError) {
            setFormError('specializations', { type: 'manual', message: specializationError });
            return;
        }

        setLoading(true);

        try {
            const token = await getToken();

            const locationData = typeof data.location === 'string' ? { formatted: data.location } : data.location || {};
            const locationPayload = {
                location: locationData.formatted || locationData.address || '',
                address: locationData.formatted || locationData.address || '',
                city: locationData.city || '',
                district: locationData.district || '',
                postal_code: locationData.postal_code || '',
                latitude: locationData.latitude ?? locationData.lat ?? null,
                longitude: locationData.longitude ?? locationData.lng ?? null,
            };

            // Get current user ID for Supabase uploads
            const meResponse = await api.get('/auth/me/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userId = meResponse.data.id;

            // Upload citizenship documents directly to Supabase
            let citizenshipFrontUrl = null;
            let citizenshipBackUrl = null;

            if (data.citizenshipFront) {
                const frontResult = await uploadCitizenshipDocument(data.citizenshipFront, userId, 'front');
                citizenshipFrontUrl = frontResult.url;
            }

            if (data.citizenshipBack) {
                const backResult = await uploadCitizenshipDocument(data.citizenshipBack, userId, 'back');
                citizenshipBackUrl = backResult.url;
            }

            await api.post(
                '/auth/update-user-type/',
                {
                    user_type: 'offer',
                    business_name: data.businessName,
                    years_of_experience: Number(data.yearsOfExperience),
                    service_area: Number(data.serviceArea),
                    ...locationPayload,
                    bio: data.bio,
                    specialities: data.specialities,
                    specializations: data.specializations,
                    citizenship_front: citizenshipFrontUrl,
                    citizenship_back: citizenshipBackUrl,
                    citizenship_number: data.citizenshipNumber,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Upload certificates directly to Supabase
            if (data.certificates?.length) {
                const certificateUploadPromises = data.certificates.map(async (cert) => {
                    try {
                        const uploadResult = await uploadCertificate(cert.file, userId, cert.name);
                        return {
                            name: cert.name,
                            url: uploadResult.url,
                        };
                    } catch (err) {
                        console.error(`Failed to upload certificate ${cert.name}:`, err);
                        throw err;
                    }
                });

                const uploadedCertificates = await Promise.all(certificateUploadPromises);
                
                // Send certificate URLs to backend
                await api.post('/auth/save-certificates/', {
                    certificates: uploadedCertificates
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            await refreshProfile();
            navigate('/provider/dashboard', { replace: true });
        } catch (err) {
            console.error('Error completing profile:', err);
            setError(err.response?.data?.error || err.message || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                                    {...register('businessName')}
                                    placeholder="Your Business Name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                                {errors.businessName && (
                                    <p className="text-red-500 text-xs mt-1">{errors.businessName.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Years of Experience *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    {...register('yearsOfExperience')}
                                    placeholder="5"
                                    className={`w-full px-4 py-3 border ${errors.yearsOfExperience ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500`}
                                />
                                {errors.yearsOfExperience && (
                                    <p className="text-red-500 text-xs mt-1">{errors.yearsOfExperience.message}</p>
                                )}
                            </div>

                            <div>
                                <Controller
                                    control={control}
                                    name="location"
                                    render={({ field }) => (
                                        <AddressAutocomplete
                                            label="Service Location *"
                                            value={field.value}
                                            onChange={(val) => field.onChange(val)}
                                            disabled={loading}
                                            required
                                        />
                                    )}
                                />
                                {errors.location && (
                                    <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Service Area (km) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    {...register('serviceArea')}
                                    placeholder="e.g., 20"
                                    className={`w-full px-4 py-3 border ${errors.serviceArea ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500`}
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter kilometers only (e.g., 10, 20)</p>
                                {errors.serviceArea && (
                                    <p className="text-red-500 text-xs mt-1">{errors.serviceArea.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bio / Description <span className="text-gray-400">(Optional)</span>
                                </label>
                                <textarea
                                    rows="4"
                                    {...register('bio')}
                                    placeholder="Tell us about yourself and your services..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                                {errors.bio && (
                                    <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

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
                                    {specialities.map((speciality) => (
                                        <button
                                            key={speciality.id}
                                            type="button"
                                            onClick={() => handleSpecialityToggle(speciality.id)}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${selectedSpecialities.includes(speciality.id)
                                                    ? 'border-green-600 bg-green-50 text-green-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {speciality.name}
                                        </button>
                                    ))}
                                </div>
                                {errors.specialities && (
                                    <p className="text-red-500 text-sm mt-2">{errors.specialities.message}</p>
                                )}
                            </div>

                            {selectedSpecialities.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specific Expertise * (Select at least one for each speciality)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        {getFilteredSpecializations().map((specialization) => (
                                            <button
                                                key={specialization.id}
                                                type="button"
                                                onClick={() => handleSpecializationToggle(specialization.id)}
                                                className={`p-2 text-sm rounded-lg border transition-all text-left ${selectedSpecializations.includes(specialization.id)
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-gray-300 hover:border-gray-400 bg-white'
                                                    }`}
                                            >
                                                {specialization.name}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.specializations && (
                                        <p className="text-red-500 text-sm mt-2">{errors.specializations.message}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

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
                                    maxLength={11}
                                    inputMode="numeric"
                                    {...register('citizenshipNumber')}
                                    placeholder="Enter 11-digit citizenship number"
                                    className={`w-full px-4 py-3 border ${errors.citizenshipNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500`}
                                />
                                {errors.citizenshipNumber && (
                                    <p className="text-red-500 text-xs mt-1">{errors.citizenshipNumber.message}</p>
                                )}
                                {!errors.citizenshipNumber && watch('citizenshipNumber') && (
                                    <p className="text-gray-500 text-xs mt-1">{(watch('citizenshipNumber') || '').length}/11 digits</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Front Side *
                                    </label>
                                    <div className={`border-2 border-dashed ${errors.citizenshipFront ? 'border-red-500' : 'border-gray-300'} rounded-lg p-4 text-center`}>
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
                                                        setValue('citizenshipFront', null, { shouldValidate: true });
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
                                    {errors.citizenshipFront && (
                                        <p className="text-red-500 text-xs mt-1">{errors.citizenshipFront.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Back Side *
                                    </label>
                                    <div className={`border-2 border-dashed ${errors.citizenshipBack ? 'border-red-500' : 'border-gray-300'} rounded-lg p-4 text-center`}>
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
                                                        setValue('citizenshipBack', null, { shouldValidate: true });
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
                                    {errors.citizenshipBack && (
                                        <p className="text-red-500 text-xs mt-1">{errors.citizenshipBack.message}</p>
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

                            {errors.certificates && (
                                <p className="text-red-500 text-sm">{errors.certificates.message}</p>
                            )}

                            {certificates.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Uploaded Certificates ({certificates.length})
                                    </p>
                                    {certificates.map((cert) => (
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