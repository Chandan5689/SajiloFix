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

export default function ProviderMyServices() {
    const [activeMenu, setActiveMenu] = useState("my-services");
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [providerSpecialities, setProviderSpecialities] = useState([]);
    const [providerSpecializations, setProviderSpecializations] = useState([]);
    const [selectedSpeciality, setSelectedSpeciality] = useState('');
    const [filteredSpecializations, setFilteredSpecializations] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        specialization: '', // This will be the specialization ID
        base_price: '',
        price_type: 'fixed',
        service_radius: '', // in kilometers
        emergency_service: false,
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
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
        
        const handleFocus = () => {
            console.log('Window focused, refreshing specializations...');
            fetchProviderSpecializations();
        };

        // Listen for visibility changes (tab switching)
        document.addEventListener('visibilitychange', handleVisibilityChange);
        // Listen for window focus (coming back from another window)
        window.addEventListener('focus', handleFocus);

        // Cleanup listeners on unmount
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
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
            service_radius: '',
            emergency_service: false,
            is_active: true,
        });
        setShowModal(true);
        console.log('Modal should be open now');
    };

    const handleOpenEdit = (service) => {
        setEditingService(service);        
        // Find the specialization and its speciality
        const serviceSpec = providerSpecializations.find(spec => spec.id === service.specialization?.id);
        const specialityName = serviceSpec?.speciality || '';
        const speciality = providerSpecialities.find(sp => sp.name === specialityName);
        
        // Set the speciality and filter specializations
        if (speciality) {
            setSelectedSpeciality(speciality.id.toString());
            const filtered = providerSpecializations.filter(spec => spec.speciality === speciality.name);
            setFilteredSpecializations(filtered);
        }
        
        setFormData({
            title: service.title,
            description: service.description,
            specialization: service.specialization?.id || service.specialization || '',
            base_price: service.base_price,
            price_type: service.price_type,
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
        
        // Validation (title/description now optional)
        if (!formData.specialization || !formData.base_price) {
            alert('Please fill in required fields (Specialization, Base Price)');
            return;
        }

        try {
            setSubmitting(true);
            
            // Prepare data - only send fields that backend expects (excluding provider which is set automatically)
            const serviceData = {
                title: formData.title,
                description: formData.description,
                specialization: formData.specialization,
                base_price: parseFloat(formData.base_price),
                price_type: formData.price_type,
                service_radius: formData.service_radius ? parseInt(formData.service_radius) : null,
                emergency_service: formData.emergency_service,
                is_active: formData.is_active,
            };
            
            if (editingService) {
                // Update existing service
                const updated = await bookingsService.updateService(editingService.id, serviceData);
                setServices(services.map(s => s.id === updated.id ? updated : s));
                setSuccessMessage('Service updated successfully!');
            } else {
                // Create new service
                const created = await bookingsService.createService(serviceData);
                setServices([created, ...services]);
                setSuccessMessage('Service created successfully!');
            }

            setShowModal(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error saving service:", err);
            alert(err.error || err.message || 'Failed to save service');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (serviceId, currentStatus) => {
        try {
            const updated = await bookingsService.toggleService(serviceId, !currentStatus);
            setServices(services.map(s => s.id === updated.id ? updated : s));
            setSuccessMessage(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error toggling service:", err);
            alert(err.error || err.message || 'Failed to toggle service');
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (deleting) return; // Prevent double-click
        
        try {
            setDeleting(true);
            const result = await bookingsService.deleteService(serviceId);
            setServices(services.filter(s => s.id !== serviceId));
            setSuccessMessage(result.message || 'Service deleted successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Error deleting service:", err);
            alert(err.error || err.message || 'Failed to delete service');
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
                            alert('No specialities available. You may need to complete your provider profile first.');
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

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {successMessage}
                </div>
            )}

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
