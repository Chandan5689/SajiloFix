import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProviderDashboardLayout from '../../../layouts/ProviderDashboardLayout';
import { Modal } from '../../../components/Modal';
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdToggleOn,
    MdToggleOff,
    MdAttachMoney,
    MdLocationOn,
    MdCategory,
    MdRefresh,
} from 'react-icons/md';
import bookingsService from '../../../services/bookingsService';
import api from '../../../api/axios';
import { useToast } from '../../../components/Toast';

export default function ProviderMyServices() {
    const { addToast } = useToast();
    const [activeMenu, setActiveMenu] = useState("my-services");
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [providerSpecialities, setProviderSpecialities] = useState([]);
    const [providerSpecializations, setProviderSpecializations] = useState([]);
    const [providerServiceAreaKm, setProviderServiceAreaKm] = useState(null);
    const [selectedSpeciality, setSelectedSpeciality] = useState('');
    const [filteredSpecializations, setFilteredSpecializations] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        specialization: '', // This will be the specialization ID
        base_price: '',
        price_type: 'fixed',
        estimated_duration_min: '', // minimum hours
        estimated_duration_max: '', // maximum hours
        service_radius: '', // in kilometers
        emergency_service: false,
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Debug modal state
    useEffect(() => {
        console.log('Modal state changed:', showModal);
    }, [showModal]);

    useEffect(() => {
        fetchInitialData();
        
        // Auto-refresh when user returns to this page/tab
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('Page became visible, refreshing specializations...');
                fetchProviderSpecializations();
            }
        };

        const handleProfileUpdated = () => {
            console.log('Profile updated event received, refreshing services and specializations...');
            fetchInitialData();
        };
        
        const handleFocus = () => {
            console.log('Window focused, refreshing specializations...');
            fetchProviderSpecializations();
        };

        // Listen for visibility changes (tab switching)
        document.addEventListener('visibilitychange', handleVisibilityChange);
        // Listen for window focus (coming back from another window)
        window.addEventListener('focus', handleFocus);
        // Listen for profile updates
        window.addEventListener('provider-profile-updated', handleProfileUpdated);

        // Cleanup listeners on unmount
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('provider-profile-updated', handleProfileUpdated);
        };
    }, []);

    const fetchInitialData = async () => {
        await Promise.all([fetchServices(), fetchProviderSpecializations()]);
    };

    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching provider services...');
            const data = await bookingsService.getMyServices();
            console.log('Services received:', data);
            setServices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching services:", err);
            console.error("Error details:", err.response?.data);
            setError(err.error || err.response?.data?.error || "Failed to load services");
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProviderSpecializations = async () => {
        try {
            console.log('Fetching provider profile...');
            // Fetch provider's registered specialities and specializations from profile
            const response = await api.get('/auth/me/');
            console.log('Profile received:', response.data);
            
            const specialities = Array.isArray(response.data.specialities) ? response.data.specialities : [];
            const specializations = Array.isArray(response.data.specializations) ? response.data.specializations : [];
            
            setProviderSpecialities(specialities);
            setProviderSpecializations(specializations);
            // Derive numeric service area in km from profile (e.g., "20", "20km", or text)
            const saRaw = response.data.service_area;
            if (saRaw != null) {
                const digits = String(saRaw).match(/\d+/);
                const km = digits ? parseInt(digits[0], 10) : null;
                setProviderServiceAreaKm(Number.isFinite(km) ? km : null);
            } else {
                setProviderServiceAreaKm(null);
            }
            
            console.log('Provider specialities:', specialities);
            console.log('Provider specializations:', specializations);
        } catch (err) {
            console.error("Error fetching provider profile:", err);
            console.error("Error details:", err.response?.data);
            setProviderSpecialities([]);
            setProviderSpecializations([]);
        }
    };

    const handleOpenCreate = () => {
        console.log('Add New Service button clicked');
        console.log('Available specializations:', providerSpecializations);
        setEditingService(null);
        setSelectedSpeciality('');
        setFilteredSpecializations([]);
        setFormData({
            title: '',
            description: '',
            specialization: '',
            base_price: '',
            price_type: 'fixed',
            estimated_duration_min: '',
            estimated_duration_max: '',
            service_radius: providerServiceAreaKm ?? '',
            emergency_service: false,
            is_active: true,
        });
        setShowModal(true);
        console.log('Modal should be open now');
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);
        // Find the specialization object (service.specialization might be an id or an object)
        const specializationId = service?.specialization?.id ?? service?.specialization;
        const serviceSpec = providerSpecializations.find(spec => spec.id === specializationId);

        // Derive the speciality object (serviceSpec.speciality might be a name or an id)
        let speciality = null;
        if (serviceSpec) {
            speciality =
                providerSpecialities.find(sp => sp.name === serviceSpec.speciality) ||
                providerSpecialities.find(sp => String(sp.id) === String(serviceSpec.speciality));
        }

        // Set the speciality and filter specializations accordingly (support name or id on spec.speciality)
        if (speciality) {
            setSelectedSpeciality(String(speciality.id));
            const filtered = providerSpecializations.filter(
                spec => spec.speciality === speciality.name || String(spec.speciality) === String(speciality.id)
            );
            setFilteredSpecializations(filtered);
        } else {
            // Fallback: clear selection-specific filter but keep list intact
            setSelectedSpeciality('');
            setFilteredSpecializations([]);
        }

        setFormData({
            title: service.title,
            description: service.description,
            specialization: specializationId || '',
            base_price: service.base_price,
            price_type: service.price_type,
            estimated_duration_min: service.estimated_duration_min || '',
            estimated_duration_max: service.estimated_duration_max || '',
            service_radius: service.service_radius || '',
            emergency_service: service.emergency_service || false,
            is_active: service.is_active,
        });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSpecialityChange = (e) => {
        const specialityId = e.target.value;
        setSelectedSpeciality(specialityId);
        
        // Find the speciality name
        const speciality = providerSpecialities.find(sp => sp.id.toString() === specialityId);
        
        if (speciality) {
            // Filter specializations that belong to this speciality
            const filtered = providerSpecializations.filter(spec => spec.speciality === speciality.name);
            setFilteredSpecializations(filtered);
            console.log(`Filtered specializations for ${speciality.name}:`, filtered);
        } else {
            setFilteredSpecializations([]);
        }
        
        // Reset specialization selection when speciality changes
        setFormData(prev => ({
            ...prev,
            specialization: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.specialization || !formData.base_price) {
            addToast('Please select a specialization and enter a base price.', 'warning', 4000);
            return;
        }

        if (!formData.estimated_duration_min) {
            addToast('Please specify the minimum estimated duration.', 'warning', 4000);
            return;
        }

        const minDuration = parseFloat(formData.estimated_duration_min);
        const maxDuration = formData.estimated_duration_max ? parseFloat(formData.estimated_duration_max) : null;

        if (maxDuration && minDuration > maxDuration) {
            addToast('Minimum duration cannot be greater than maximum duration.', 'warning', 4000);
            return;
        }

        try {
            setSubmitting(true);
            
            const avgDuration = maxDuration ? (minDuration + maxDuration) / 2 : minDuration;
            
            // Prepare data - only send fields that backend expects (excluding provider which is set automatically)
            const serviceData = {
                title: formData.title,
                description: formData.description,
                specialization: formData.specialization,
                base_price: parseFloat(formData.base_price),
                price_type: formData.price_type,
                estimated_duration: avgDuration,
                estimated_duration_min: minDuration,
                estimated_duration_max: maxDuration,
                // Default to provider's service area km if user left radius empty
                service_radius: (formData.service_radius !== '' && formData.service_radius != null)
                    ? parseInt(formData.service_radius, 10)
                    : (providerServiceAreaKm ?? null),
                emergency_service: formData.emergency_service,
                is_active: formData.is_active,
            };
            
            if (editingService) {
                const updated = await bookingsService.updateService(editingService.id, serviceData);
                setServices(services.map(s => s.id === updated.id ? updated : s));
                addToast('Service updated successfully!', 'success', 3000);
            } else {
                const created = await bookingsService.createService(serviceData);
                setServices([created, ...services]);
                addToast('Service created successfully!', 'success', 3000);
            }

            setShowModal(false);
        } catch (err) {
            console.error("Error saving service:", err);
            const rawMsg = typeof err === 'string'
                ? err
                : (err && (err.error || err.detail || err.message))
                    ? (err.error || err.detail || err.message)
                    : '';
            const isDuplicate = typeof rawMsg === 'string' && /already exists|duplicate|already added|unique constraint/i.test(rawMsg);
            const friendly = isDuplicate
                ? 'You already offer this service. Edit your existing service instead.'
                : (typeof rawMsg === 'string' && rawMsg.trim().length > 0
                    ? `Could not save service: ${rawMsg}`
                    : 'Could not save service. Please try again.');
            addToast(friendly, 'error', 4000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (serviceId, currentStatus) => {
        try {
            const updated = await bookingsService.toggleService(serviceId, !currentStatus);
            setServices(services.map(s => s.id === updated.id ? updated : s));
            addToast(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, 'success', 3000);
        } catch (err) {
            console.error("Error toggling service:", err);
            const rawMsg = typeof err === 'string'
                ? err
                : (err && (err.error || err.detail || err.message))
                    ? (err.error || err.detail || err.message)
                    : '';
            const friendly = rawMsg
                ? `Could not change service status: ${rawMsg}`
                : 'Could not change service status. Please try again.';
            addToast(friendly, 'error', 4000);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (deleting) return; // Prevent double-click
        
        try {
            setDeleting(true);
            const result = await bookingsService.deleteService(serviceId);
            setServices(services.filter(s => s.id !== serviceId));
            addToast(result.message || 'Service deleted successfully!', 'success', 3000);
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Error deleting service:", err);
            const rawMsg = typeof err === 'string'
                ? err
                : (err && (err.error || err.detail || err.message))
                    ? (err.error || err.detail || err.message)
                    : '';
            const friendly = rawMsg
                ? `Could not delete service: ${rawMsg}`
                : 'Could not delete service. Please try again.';
            addToast(friendly, 'error', 4000);
        } finally {
            setDeleting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading services...</p>
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
                    <h1 className="text-3xl font-bold text-gray-800">My Services</h1>
                    <p className="text-gray-500 mt-1">Manage your service offerings</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchProviderSpecializations}
                        className="border border-gray-300 text-gray-700 rounded-md px-4 py-3 font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                        title="Refresh specializations from your profile"
                    >
                        <MdRefresh className="h-5 w-5" />
                        Refresh
                    </button>
                    <Link
                        to="/provider/profile"
                        className="border border-blue-600 text-blue-600 rounded-md px-4 py-3 font-semibold hover:bg-blue-50 transition"
                        title="Add or edit your specialities and specializations"
                    >
                        Manage Specializations
                    </Link>
                    <button
                    onClick={() => {
                        if (providerSpecialities.length === 0) {
                            addToast('No specialities available. Please complete your provider profile first.', 'warning', 4000);
                            return;
                        }
                        handleOpenCreate();
                    }}
                    className="bg-green-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-green-700 transition flex items-center gap-2"
                >
                    <MdAdd className="h-5 w-5" />
                    Add New Service
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Services Grid */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {services.length > 0 ? (
                    services.map((service) => {
                        // Find which speciality this service's specialization belongs to
                        const serviceSpec = providerSpecializations.find(spec => spec.id === service.specialization?.id || spec.id === service.specialization);
                        const specialityName = serviceSpec?.speciality || '';
                        
                        return (
                        <div
                            key={service.id}
                            className={`bg-white p-6 rounded-lg shadow border ${
                                service.is_active ? 'border-green-200' : 'border-gray-200'
                            } relative`}
                        >
                            {/* Active Badge */}
                            <div className="absolute top-4 right-4">
                                {service.is_active ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                        Inactive
                                    </span>
                                )}
                            </div>

                            <div className="mb-4 pr-20">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {specialityName && (
                                        <>
                                            <span className="text-gray-600">{specialityName}</span>
                                            <span className="text-gray-400 mx-2">/</span>
                                        </>
                                    )}
                                    {service.specialization_name || service.specialization || 'N/A'}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-2">
                                    {service.title && <span className="block font-semibold">{service.title}</span>}
                                    {service.description}
                                </p>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <p className="flex items-center gap-2">
                                    <MdAttachMoney className="text-gray-400" />
                                    <span className="font-semibold">Price:</span> {formatCurrency(service.base_price)}
                                    <span className="text-xs text-gray-500">({service.price_type})</span>
                                </p>
                                {service.estimated_duration_min && (
                                    <p className="flex items-center gap-2">
                                        <span className="text-gray-400">⏱️</span>
                                        <span className="font-semibold">Est. Duration:</span> 
                                        {service.estimated_duration_max && service.estimated_duration_max !== service.estimated_duration_min
                                            ? `${service.estimated_duration_min}-${service.estimated_duration_max} hours`
                                            : `${service.estimated_duration_min} ${service.estimated_duration_min === 1 ? 'hour' : 'hours'}`
                                        }
                                    </p>
                                )}
                                {service.service_radius && (
                                    <p className="flex items-center gap-2">
                                        <MdLocationOn className="text-gray-400" />
                                        Service Radius: {service.service_radius} km
                                    </p>
                                )}
                                {service.emergency_service && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                        Emergency Available
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleOpenEdit(service)}
                                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-semibold hover:bg-blue-50 transition flex items-center gap-1"
                                >
                                    <MdEdit /> Edit
                                </button>
                                <button
                                    onClick={() => handleToggleActive(service.id, service.is_active)}
                                    className={`px-4 py-2 border ${
                                        service.is_active
                                            ? 'border-gray-400 text-gray-700'
                                            : 'border-green-600 text-green-600'
                                    } rounded-md text-sm font-semibold hover:bg-gray-50 transition flex items-center gap-1`}
                                >
                                    {service.is_active ? (
                                        <>
                                            <MdToggleOff /> Deactivate
                                        </>
                                    ) : (
                                        <>
                                            <MdToggleOn /> Activate
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(service)}
                                    className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-semibold hover:bg-red-50 transition flex items-center gap-1"
                                >
                                    <MdDelete /> Delete
                                </button>
                            </div>
                        </div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center p-10 bg-white rounded-lg shadow-md text-gray-500">
                        <p className="mb-2 text-lg font-semibold">No services found</p>
                        {providerSpecialities.length === 0 ? (
                            <>
                                <p className="mb-4 text-red-600">You don't have any specialities registered.</p>
                                <p className="mb-4">Please complete your provider profile first to add services.</p>
                                <a
                                    href="/complete-provider-profile"
                                    className="bg-blue-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
                                >
                                    Complete Provider Profile
                                </a>
                            </>
                        ) : (
                            <>
                                <p className="mb-4">Create your first service to start receiving bookings!</p>
                                <button
                                    onClick={handleOpenCreate}
                                    className="bg-green-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-green-700 transition inline-flex items-center gap-2"
                                >
                                    <MdAdd className="h-5 w-5" />
                                    Add Your First Service
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Debug info - Remove after testing */}
            {/* {showModal && (
                <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg z-50 shadow-lg">
                    Modal should be visible! showModal = {showModal.toString()}
                </div>
            )} */}

            {/* Create/Edit Service Modal */}
            <Modal 
                isOpen={showModal} 
                onClose={() => {
                    console.log('Closing modal');
                    setShowModal(false);
                }}
            >
                <div className="p-6 max-w-2xl">
                        <h3 className="text-xl font-semibold mb-6">
                            {editingService ? 'Edit Service' : 'Create New Service'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {providerSpecialities.length === 0 && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                                    <p className="font-semibold">⚠️ No specializations available</p>
                                    <p className="text-sm mt-1">You need to complete your provider profile and register specializations before creating services.</p>
                                </div>
                            )}

                            {/* Speciality Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Speciality (Category) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSpeciality}
                                    onChange={handleSpecialityChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                    required
                                >
                                    <option value="">Select Speciality</option>
                                    {providerSpecialities.map(speciality => (
                                        <option key={speciality.id} value={speciality.id}>
                                            {speciality.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Select the main category for this service
                                </p>
                            </div>

                            {/* Title (optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Service Title <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Emergency Plumbing Repair"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                />
                            </div>

                            {/* Description (optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe your service in detail..."
                                    rows="4"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                />
                            </div>

                            {/* Specialization */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Specialization <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                    required
                                    disabled={!selectedSpeciality}
                                >
                                    <option value="">
                                        {!selectedSpeciality 
                                            ? 'First select a speciality above' 
                                            : 'Select Specialization'}
                                    </option>
                                    {filteredSpecializations.map(spec => (
                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {selectedSpeciality 
                                        ? `${filteredSpecializations.length} specialization(s) available for selected speciality`
                                        : 'Select a speciality first to see available specializations'}
                                </p>
                            </div>

                            {/* Price & Price Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Base Price (NRS) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="base_price"
                                        value={formData.base_price}
                                        onChange={handleInputChange}
                                        placeholder="1000"
                                        min="0"
                                        step="0.01"
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Price Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="price_type"
                                        value={formData.price_type}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                        required
                                    >
                                        <option value="fixed">Fixed Price</option>
                                        <option value="hourly">Hourly Rate</option>
                                        <option value="negotiable">Negotiable</option>
                                    </select>
                                </div>
                            </div>

                            {/* Estimated Duration Range */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Estimated Duration (hours) <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            type="number"
                                            name="estimated_duration_min"
                                            value={formData.estimated_duration_min}
                                            onChange={handleInputChange}
                                            placeholder="Min (e.g., 1)"
                                            min="0.5"
                                            step="0.5"
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Minimum hours</p>
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            name="estimated_duration_max"
                                            value={formData.estimated_duration_max}
                                            onChange={handleInputChange}
                                            placeholder="Max (e.g., 2)"
                                            min="0.5"
                                            step="0.5"
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Maximum hours (optional)</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Provide duration range (e.g., 1-2 hours) or just minimum if fixed. This helps customers plan their schedule.
                                </p>
                            </div>

                            {/* Service Radius */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Service Radius (km)
                                </label>
                                <input
                                    type="number"
                                    name="service_radius"
                                    value={formData.service_radius}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 20"
                                    min="0"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-green-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Maximum distance you're willing to travel for this service
                                </p>
                            </div>

                            {/* Checkboxes */}
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="emergency_service"
                                        checked={formData.emergency_service}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">Emergency/24-7 Service Available</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">Active Service</span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Saving...
                                        </span>
                                    ) : (
                                        editingService ? 'Update Service' : 'Create Service'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={!!deleteConfirm} 
                onClose={() => setDeleteConfirm(null)}
            >
                <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Service</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                                onClick={() => handleDeleteService(deleteConfirm.id)}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Service'
                                )}
                            </button>
                        </div>
                    </div>
            </Modal>
        </ProviderDashboardLayout>
    );
}
