import React, { useState, useEffect } from 'react'
import { TiMessageTyping } from "react-icons/ti";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import { MdOutlineMessage } from "react-icons/md";
import { BsCheckCircleFill, BsCalendar2Week } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';
import RatingBadge from '../components/RatingBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import providersService from '../services/providersService';
import { FaEye } from 'react-icons/fa6';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

/**
 * ServiceProviderCard shows a compact-yet-informative provider summary.
 * Emphasis: price band, top services, rating + review count, and location.
 */
function ServiceProviderCard({ provider }) {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { isAuthenticated } = useSupabaseAuth();
    const [showServicesModal, setShowServicesModal] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [servicesError, setServicesError] = useState(null);
    const [services, setServices] = useState([]);
    const [expandedServices, setExpandedServices] = useState([]);
    const [expandedLoading, setExpandedLoading] = useState(false);
    const [expandedError, setExpandedError] = useState(null);
    const [showAllServices, setShowAllServices] = useState(false);
    const [availabilityLabel, setAvailabilityLabel] = useState(provider.availability || "Checking availability...");
    const [availabilityStatus, setAvailabilityStatus] = useState('checking'); // 'available-today', 'available-soon', 'on-request', 'checking'

    // Display provider's primary speciality (first one selected)
    const specialtyLabel = provider.specialties && provider.specialties.length > 0
        ? provider.specialties[0]
        : 'Speciality not set';

    // Fetch availability once per provider to show next available day/time
    useEffect(() => {
        let mounted = true;
        const fetchAvailability = async () => {
            try {
                const data = await providersService.getProviderAvailability(provider.id);
                if (!mounted || !data?.weekly_schedule) {
                    setAvailabilityStatus('on-request');
                    setAvailabilityLabel("On request");
                    return;
                }
                
                // Normalize the schedule data to ensure consistent field names
                const normalizedSchedule = data.weekly_schedule.map(d => ({
                    day: d.day,
                    enabled: d.enabled,
                    start_time: d.start_time || d.startTime || '',
                    end_time: d.end_time || d.endTime || '',
                }));
                
                const result = computeNextAvailable(normalizedSchedule);
                if (!mounted) return;
                if (result) {
                    setAvailabilityLabel(result.label);
                    setAvailabilityStatus(result.status);
                } else {
                    setAvailabilityLabel("On request");
                    setAvailabilityStatus('on-request');
                }
            } catch (e) {
                if (mounted) {
                    setAvailabilityLabel(provider.availability || "On request");
                    setAvailabilityStatus('on-request');
                }
            }
        };
        fetchAvailability();
        return () => { mounted = false; };
    }, [provider.id, provider.availability]);
    const openServicesModal = async () => {
        setShowServicesModal(true);
        if (services.length > 0 || servicesLoading) return;
        try {
            setServicesLoading(true);
            setServicesError(null);
            const detail = await providersService.getProviderDetail(provider.id);
            const list = detail?.services || [];
            setServices(list);
        } catch (err) {
            setServicesError("Failed to load services");
        } finally {
            setServicesLoading(false);
        }
    };

    const handleShowMoreInline = async () => {
        // Toggle off if already showing all
        if (showAllServices) {
            setShowAllServices(false);
            return;
        }

        // If already loaded, just show
        if (expandedServices.length > 0) {
            setExpandedError(null);
            setShowAllServices(true);
            return;
        }

        // Fetch full services to show inline
        try {
            setExpandedLoading(true);
            setExpandedError(null);
            const detail = await providersService.getProviderDetail(provider.id);
            const list = detail?.services || [];
            setExpandedServices(list);
            setShowAllServices(true);
        } catch (err) {
            setExpandedError('Failed to load services');
        } finally {
            setExpandedLoading(false);
        }
    };

    // const handleMessage = () => {
    //     addToast(`Message feature coming soon! You can reach ${provider.name} by booking a service.`, 'info', 3000);
    // };

    const formatPrice = (srv) => {
        // Prefer explicit price, else minimum_charge (>0), else base_price
        const priceValue = srv.price != null
            ? Number(srv.price)
            : (srv.minimum_charge != null && Number(srv.minimum_charge) > 0
                ? Number(srv.minimum_charge)
                : (srv.base_price != null ? Number(srv.base_price) : null));

        if (priceValue == null || Number.isNaN(priceValue)) return 'Contact';

        const suffix = srv.price_type === 'hourly'
            ? '/hr'
            : (srv.price_type === 'negotiable'
                ? ' (negotiable)'
                : (srv.price_type === 'fixed' ? ' (fixed)' : ''));

        return `NPR ${priceValue}${suffix}`;
    };

    const computeNextAvailable = (weekly) => {
        if (!Array.isArray(weekly) || weekly.length === 0) return null;
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const todayIdx = new Date().getDay();
        
        for (let offset = 0; offset < 7; offset++) {
            const dayIdx = (todayIdx + offset) % 7;
            const dayName = days[dayIdx];
            
            // Find the day in schedule (case-insensitive match)
            const day = weekly.find(d => d.day && d.day.toLowerCase() === dayName.toLowerCase());
            
            if (day && day.enabled) {
                const start = day.start_time || '';
                const end = day.end_time || '';
                let label = '';
                let status = '';
                
                if (offset === 0) {
                    // Check if we're still within business hours for today
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    
                    // Parse end time to check if day has passed
                    let dayHasPassed = false;
                    if (end) {
                        const endMatch = end.match(/(\d+):(\d+)\s*(AM|PM)/i);
                        if (endMatch) {
                            let endHour = parseInt(endMatch[1]);
                            const endMinute = parseInt(endMatch[2]);
                            const isPM = endMatch[3].toUpperCase() === 'PM';
                            
                            if (isPM && endHour !== 12) endHour += 12;
                            if (!isPM && endHour === 12) endHour = 0;
                            
                            dayHasPassed = (currentHour > endHour) || (currentHour === endHour && currentMinute >= endMinute);
                        }
                    }
                    
                    if (dayHasPassed) {
                        // Skip today if hours have passed, continue to check next days
                        continue;
                    }
                    
                    label = start && end ? `Available Today (${start} - ${end})` : 'Available Today';
                    status = 'available-today';
                } else if (offset === 1) {
                    label = start && end ? `Available Tomorrow (${start} - ${end})` : 'Available Tomorrow';
                    status = 'available-soon';
                } else {
                    label = start && end ? `Available ${dayName} (${start} - ${end})` : `Available ${dayName}`;
                    status = 'available-soon';
                }
                
                return { label, status };
            }
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-5 w-full border border-gray-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
                
                <div className="relative shrink-0">
                    <img
                        src={provider.img}
                        alt={provider.name}
                        className="w-16 h-16 rounded-xl border border-gray-200 object-cover"
                    />
                    <div className="absolute -top-1 -left-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex-col sm:flex-row items-center justify-between gap-2">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">{provider.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <RatingBadge
                                providerId={provider.id}
                                fallbackRating={provider.rating}
                                fallbackCount={provider.reviews}
                                compact
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[12px] font-semibold text-green-700">
                        {(provider.specialties || []).length > 0 ? (
                            provider.specialties.slice(0, 4).map((spec, idx) => (
                                <span key={`${spec}-${idx}`} className="px-2 py-1 bg-green-50 border border-green-100 rounded-full">
                                    {spec}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500">Speciality not set</span>
                        )}
                        {provider.specialties && provider.specialties.length > 4 && (
                            <span className="text-gray-500">+{provider.specialties.length - 4} more</span>
                        )}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1 flex-wrap">
                        {provider.city && <span>{provider.city}</span>}
                        {provider.district && <span>• {provider.district}</span>}
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-1">
                    <p className="text-[11px] text-gray-600 font-semibold">PRICE RANGE</p>
                    {provider.priceRangeMin != null ? (
                        <div className="flex items-baseline gap-1">
                            <p className="text-xl text-green-700 font-bold leading-none">NPR {provider.priceRangeMin}</p>
                            {provider.priceRangeMax != null && provider.priceRangeMax !== provider.priceRangeMin && (
                                <p className="text-sm text-green-700 font-semibold leading-none">– {provider.priceRangeMax}</p>
                            )}
                            {provider.priceType && (
                                <span className="text-[11px] ml-1 font-semibold text-gray-600 align-top">{provider.priceType === 'hourly' ? '/hr' : 'fixed'}</span>
                            )}
                        </div>
                    ) : (
                        <p className="text-base text-gray-500 font-semibold">Contact for price</p>
                    )}
                    <p className="text-[11px] text-gray-500">Based on published services</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                    <p className="text-[11px] text-gray-600 font-semibold">SERVICES OFFERED</p>
                    <p className="text-lg font-bold text-blue-700 leading-none">{provider.serviceCount ?? 0}</p>
                    <p className="text-[11px] text-gray-500">Top services listed below</p>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] text-gray-600 font-semibold">Available Services</p>
                        {provider.serviceCount > 3 && (
                            <button
                                type="button"
                                onClick={handleShowMoreInline}
                                className="text-[11px] text-green-700 font-semibold hover:underline"
                                aria-label={`View ${provider.serviceCount - 3} more services`}
                            >
                                {showAllServices ? 'Hide extra' : `+${provider.serviceCount - 3} more`}
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {(showAllServices ? (expandedServices.length > 0 ? expandedServices : provider.servicePreview || []) : (provider.servicePreview || []).slice(0, 3)).map((srv, idx) => (
                            <div key={`${srv.id || srv.title || idx}-${idx}`} className="flex items-center justify-between text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                                <div className="flex-1">
                                    <div className="text-gray-900 font-semibold truncate pr-2">{srv.specialization_name || srv.title || 'Service'}</div>
                                    {srv.estimated_duration_min && (
                                        <div className="text-[10px] text-purple-700 mt-0.5">
                                            ⏱️ {srv.estimated_duration_max && srv.estimated_duration_max !== srv.estimated_duration_min
                                                ? `${srv.estimated_duration_min}-${srv.estimated_duration_max}h`
                                                : `${srv.estimated_duration_min}h`
                                            }
                                        </div>
                                    )}
                                </div>
                                <div className="text-gray-700 text-xs whitespace-nowrap">
                                    {formatPrice(srv)}
                                </div>
                            </div>
                        ))}
                        {expandedLoading && (
                            <div className="text-xs text-gray-500">Loading services...</div>
                        )}
                        {expandedError && (
                            <div className="text-xs text-red-600">{expandedError}</div>
                        )}
                        {(!provider.servicePreview || provider.servicePreview.length === 0) && !expandedLoading && !expandedError && (
                            <div className="text-xs text-gray-500">Services not listed yet</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-700">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500 font-semibold">EXPERIENCE</span>
                    <span className="text-sm font-semibold text-gray-900">{provider.experience} yrs</span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <span className="text-[11px] text-gray-500 font-semibold">AVAILABILITY</span>
                    {availabilityStatus === 'available-today' && (
                        <div className="flex items-center gap-1.5 bg-green-100 text-green-800 px-2.5 py-1.5 rounded-lg border border-green-200">
                            <BsCheckCircleFill className="text-green-600 text-sm" />
                            <span className="text-[11px] font-bold whitespace-nowrap">Available Today</span>
                        </div>
                    )}
                    {availabilityStatus === 'available-soon' && (
                        <div className="flex items-center gap-1.5 bg-blue-100 text-blue-800 px-2.5 py-1.5 rounded-lg border border-blue-200">
                            <BsCalendar2Week className="text-blue-600 text-sm" />
                            <span className="text-[11px] font-bold whitespace-nowrap">Available Soon</span>
                        </div>
                    )}
                    {availabilityStatus === 'on-request' && (
                        <div className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-2.5 py-1.5 rounded-lg border border-amber-200">
                            <FaClock className="text-amber-600 text-sm" />
                            <span className="text-[11px] font-bold whitespace-nowrap">On Request</span>
                        </div>
                    )}
                    {availabilityStatus === 'checking' && (
                        <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200">
                            <FaClock className="text-gray-500 text-sm animate-pulse" />
                            <span className="text-[11px] font-semibold">Checking...</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Show detailed availability info */}
            {availabilityStatus !== 'checking' && availabilityLabel && (
                <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                        <FaClock className="text-gray-500 text-[10px]" />
                        <span className="font-medium">{availabilityLabel}</span>
                    </div>
                </div>
            )}

            <div className="mt-5 flex gap-3">
                <button
                    className="flex-1 py-2 px-4 text-blue-700 font-semibold border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer"
                    onClick={openServicesModal}
                >
                    <FaEye className="h-4 w-4" />
                    View services
                </button>
                {/* <button
                    className="flex-1 py-2 px-4 bg-blue-600 font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer text-white"
                    onClick={handleMessage}
                >
                    <MdOutlineMessage className="h-4 w-4" />
                    Message
                </button> */}
                
            </div>

            <div className='mt-5'>
                <button
                    className="w-full flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer border border-green-600"
                    onClick={() => {
                        if (!isAuthenticated) {
                            addToast('Please log in to book a service.', 'info', 3000);
                            navigate('/login');
                            return;
                        }
                        navigate(`/provider/${provider.id}`);
                    }}
                >
                    <FaCalendarAlt className="h-4 w-4" />
                    Book Now
                </button>
            </div>

            <Modal
                isOpen={showServicesModal}
                onClose={() => setShowServicesModal(false)}
                title={`Services by ${provider.name}`}
            >
                {servicesLoading ? (
                    <div className="text-sm text-gray-600">Loading services...</div>
                ) : servicesError ? (
                    <div className="text-sm text-red-600">{servicesError}</div>
                ) : services.length === 0 ? (
                    <div className="text-sm text-gray-600">No services published yet.</div>
                ) : (
                    <div className="space-y-3">
                        {services.map((srv) => (
                            <div key={srv.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{srv.title}</p>
                                        <p className="text-xs text-gray-800 mt-1 font-semibold">Service : {srv.specialization_name}</p>
                                        {srv.description && (
                                            <p className="text-xs text-gray-500 mt-2 line-clamp-3">{srv.description}</p>
                                        )}
                                    </div>
                                    <div className="text-sm font-semibold text-green-700 whitespace-nowrap">{formatPrice(srv)}</div>
                                </div>
                                <div className="text-[11px] text-gray-600 mt-2 flex flex-wrap gap-3">
                                    {srv.price_type === 'hourly' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Hourly Rate</span>}
                                    {srv.price_type === 'fixed' && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Fixed Rate</span>}
                                    {srv.price_type === 'negotiable' && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Negotiable Rate</span>}
                                    {srv.estimated_duration_min && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                            ⏱️ {srv.estimated_duration_max && srv.estimated_duration_max !== srv.estimated_duration_min
                                                ? `${srv.estimated_duration_min}-${srv.estimated_duration_max} hours`
                                                : `${srv.estimated_duration_min} ${srv.estimated_duration_min === 1 ? 'hour' : 'hours'}`
                                            }
                                        </span>
                                    )}
                                    {srv.emergency_service && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">Emergency service available</span>}
                                    {srv.requires_site_visit && <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full">Site visit required</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default ServiceProviderCard

