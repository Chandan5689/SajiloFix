import React, { useState, useEffect } from 'react';
import ProviderDashboardLayout from '../../../layouts/ProviderDashboardLayout';
import { Modal } from '../../../components/Modal';
import BookingImageUpload from '../../../components/BookingImageUpload';
import {
    MdCalendarToday,
    MdLocationOn,
    MdPhone,
    MdPerson,
    MdCheckCircle,
    MdCancel,
    MdPlayArrow,
} from 'react-icons/md';
import bookingsService from '../../../services/bookingsService';

// Status color mapping
const statusColorMap = {
    pending: "bg-orange-100 text-orange-700",
    confirmed: "bg-blue-100 text-blue-700",
    scheduled: "bg-purple-100 text-purple-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    declined: "bg-red-100 text-red-700",
};

export default function ProviderMyBookings() {
    const [activeMenu, setActiveMenu] = useState("my-bookings");
    const [activeTab, setActiveTab] = useState("All");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 10;
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(null);
    const [declineReason, setDeclineReason] = useState("");
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadImageType, setUploadImageType] = useState("before_work");
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completeNote, setCompleteNote] = useState("");
    const [completeFiles, setCompleteFiles] = useState([]);
    const [completePreviews, setCompletePreviews] = useState([]);
    const [completeError, setCompleteError] = useState(null);
    const [completeLoading, setCompleteLoading] = useState(false);

    const tabs = ["All", "pending", "confirmed", "scheduled", "in_progress", "completed", "cancelled", "declined"];

    // Fetch provider bookings on mount
    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async (targetPage = 1, append = false) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);
            const data = await bookingsService.getProviderBookings({ page: targetPage, page_size: pageSize });
            const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
            setBookings((prev) => append ? [...prev, ...list] : list);
            setHasMore(Boolean(data?.next));
            setPage(targetPage);
        } catch (err) {
            console.error("Error fetching provider bookings:", err);
            setError(err.error || "Failed to load bookings");
            if (!append) setBookings([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!hasMore || loadingMore) return;
        fetchBookings(page + 1, true);
    };

    // Format date and time
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (time) => {
        if (!time) return "";
        const [hours, minutes] = time.split(":");
        const h = parseInt(hours);
        const m = parseInt(minutes);
        const ampm = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 || 12;
        return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    // Status display formatter
    const getStatusDisplay = (status) => {
        return status
            .replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    // Handle Accept Booking
    const handleAccept = async (bookingId) => {
        try {
            setActionInProgress(bookingId);
            const updated = await bookingsService.acceptBooking(bookingId);
            setBookings(bookings.map(b => b.id === updated.id ? updated : b));
            if (selectedBooking?.id === bookingId) {
                setSelectedBooking(updated);
            }
        } catch (err) {
            console.error("Error accepting booking:", err);
            alert("Failed to accept booking: " + (err.error || err.message));
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle Decline Booking
    const handleDeclineClick = (booking) => {
        setSelectedBooking(booking);
        setShowDeclineModal(true);
        setDeclineReason("");
    };

    const handleDeclineConfirm = async () => {
        if (!selectedBooking) return;
        try {
            setActionInProgress(selectedBooking.id);
            const updated = await bookingsService.declineBooking(selectedBooking.id, declineReason);
            setBookings(bookings.map(b => b.id === updated.id ? updated : b));
            setShowDeclineModal(false);
            setSelectedBooking(null);
            setDeclineReason("");
        } catch (err) {
            console.error("Error declining booking:", err);
            alert("Failed to decline booking: " + (err.error || err.message));
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle Start Work
    const handleStartWork = async (bookingId) => {
        try {
            setActionInProgress(bookingId);
            const updated = await bookingsService.startBooking(bookingId);
            setBookings(bookings.map(b => b.id === updated.id ? updated : b));
            if (selectedBooking?.id === bookingId) {
                setSelectedBooking(updated);
            }
        } catch (err) {
            console.error("Error starting booking:", err);
            alert("Failed to start work: " + (err.error || err.message));
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle Complete Work
    const resetCompleteState = () => {
        setCompleteNote("");
        setCompleteFiles([]);
        setCompletePreviews([]);
        setCompleteError(null);
    };

    const handleOpenCompleteModal = (booking) => {
        setSelectedBooking(booking);
        resetCompleteState();
        setShowCompleteModal(true);
    };

    const handleCompleteFilesChange = (files) => {
        const valid = files.filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
        if (valid.length !== files.length) {
            setCompleteError('Only images up to 5MB are allowed');
        } else {
            setCompleteError(null);
        }
        setCompleteFiles((prev) => [...prev, ...valid]);
        const previews = valid.map((file) => URL.createObjectURL(file));
        setCompletePreviews((prev) => [...prev, ...previews]);
    };

    const handleRemoveCompleteFile = (index) => {
        setCompleteFiles((prev) => prev.filter((_, i) => i !== index));
        setCompletePreviews((prev) => prev.filter((_, i) => i !== index));
        if (completeFiles.length <= 1) {
            setCompleteError(null);
        }
    };

    const handleCompleteSubmit = async () => {
        if (!selectedBooking) return;
        if (completeFiles.length === 0) {
            setCompleteError('After photos are required to complete this job');
            return;
        }
        try {
            setCompleteLoading(true);
            setCompleteError(null);
            // Complete booking first (sets provider_completed status)
            const completed = await bookingsService.completeBooking(selectedBooking.id);
            // Then upload after photos
            await bookingsService.uploadBookingImages(completed.id, 'after', completeFiles, completeNote);
            // Refresh booking to get final status
            const updated = await bookingsService.getBookingDetail(completed.id);
            // Explicitly set status to awaiting_customer if we just uploaded after photos
            if (updated.status === 'provider_completed') {
                updated.status = 'awaiting_customer';
            }
            setBookings(bookings.map((b) => (b.id === updated.id ? updated : b)));
            setSelectedBooking(updated);
            setShowCompleteModal(false);
            resetCompleteState();
        } catch (err) {
            console.error('Error completing booking:', err);
            setCompleteError(err?.error || err?.message || 'Failed to complete booking');
        } finally {
            setCompleteLoading(false);
        }
    };

    // Handle Image Upload Success
    const handleUploadSuccess = async (uploadedImages) => {
        try {
            const updatedBooking = await bookingsService.getBookingDetail(selectedBooking.id);
            setSelectedBooking(updatedBooking);
            setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            setShowUploadModal(false);
        } catch (err) {
            console.error("Error refreshing booking:", err);
        }
    };

    // Open upload modal
    const handleOpenUpload = (imageType) => {
        setUploadImageType(imageType);
        setShowUploadModal(true);
    };

    // Filter bookings by tab
    const filteredBookings =
        activeTab === "All"
            ? bookings
            : bookings.filter(b => b.status === activeTab);

    // Helpers
    const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
        const toRad = (d) => (d * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    };

    const timeSince = (dateStr) => {
        if (!dateStr) return null;
        const diffMs = Date.now() - new Date(dateStr).getTime();
        if (Number.isNaN(diffMs)) return null;
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    };

    // Derived fields for the selected booking (modal)
    const serviceLat =
        selectedBooking?.service_latitude ??
        selectedBooking?.service_lat ??
        selectedBooking?.latitude;
    const serviceLng =
        selectedBooking?.service_longitude ??
        selectedBooking?.service_lng ??
        selectedBooking?.longitude;
    const providerLat =
        selectedBooking?.provider_latitude ??
        selectedBooking?.provider_lat ??
        selectedBooking?.provider?.latitude;
    const providerLng =
        selectedBooking?.provider_longitude ??
        selectedBooking?.provider_lng ??
        selectedBooking?.provider?.longitude;
    const distanceKm = haversineDistanceKm(
        providerLat,
        providerLng,
        serviceLat,
        serviceLng
    );
    const radiusKm = selectedBooking?.service_radius ?? selectedBooking?.radius;
    const isHourly = selectedBooking?.service?.price_type === 'hourly';
    const estHours = selectedBooking?.estimated_hours;
    const isEmergency = !!selectedBooking?.is_emergency;
    const customerRating = selectedBooking?.customer_rating;
    const customerBookings = selectedBooking?.customer_booking_count;
    const bookingAge = timeSince(
        selectedBooking?.created_at ??
        selectedBooking?.requested_at ??
        selectedBooking?.createdAt
    );
    const specialization =
        selectedBooking?.service_specialization ??
        selectedBooking?.service?.specialization?.name ??
        selectedBooking?.specialization?.name;
    const serviceTitle =
        selectedBooking?.service_title ?? selectedBooking?.service?.title;
    const priceType = selectedBooking?.service?.price_type;
    const mapLinkService =
        serviceLat != null && serviceLng != null
            ? `https://www.openstreetmap.org/?mlat=${serviceLat}&mlon=${serviceLng}#map=17/${serviceLat}/${serviceLng}`
            : null;
    const mapLinkProvider =
        providerLat != null && providerLng != null
            ? `https://www.openstreetmap.org/?mlat=${providerLat}&mlon=${providerLng}#map=17/${providerLat}/${providerLng}`
            : null;

    if (loading) {
        return (
            <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading bookings...</p>
                    </div>
                </div>
            </ProviderDashboardLayout>
        );
    }

    return (
        <ProviderDashboardLayout activeMenuKey={activeMenu} onMenuChange={setActiveMenu}>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
                <p className="text-gray-500 mt-1">Manage all your customer bookings and appointments</p>
            </header>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="bg-gray-100 mb-6 px-2 rounded-lg">
                <div className="flex flex-wrap gap-3 py-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`whitespace-nowrap rounded px-3 py-1 text-sm font-medium cursor-pointer transition ${
                                activeTab === tab
                                    ? "bg-white text-green-600"
                                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === "All" ? "All" : getStatusDisplay(tab)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings Grid */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                        <div
                            key={booking.id}
                            className="bg-white p-6 rounded-lg shadow border border-gray-100"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-semibold text-lg">{booking.service_title}</p>
                                    <p className="text-gray-600 text-sm flex items-center gap-1">
                                        <MdPerson className="inline" /> {booking.customer_name}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                        statusColorMap[booking.status] || "bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    {getStatusDisplay(booking.status)}
                                </span>
                            </div>

                            <div className="text-gray-600 text-sm space-y-2 mb-4">
                                <p className="flex items-center gap-2">
                                    <MdCalendarToday />
                                    {formatDate(booking.scheduled_date || booking.preferred_date)} at{" "}
                                    {formatTime(booking.scheduled_time || booking.preferred_time)}
                                </p>
                                <p className="flex items-center gap-2">
                                    <MdLocationOn /> {booking.service_address}
                                </p>
                                <p className="font-semibold text-gray-800">
                                    NRS {booking.quoted_price || booking.final_price || "TBD"}
                                </p>
                            </div>

                            <p className="text-gray-700 text-sm mb-4 line-clamp-2">{booking.description}</p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className="px-4 py-2 border border-green-600 text-green-600 rounded-md text-sm font-semibold hover:bg-green-50 transition"
                                    onClick={() => setSelectedBooking(booking)}
                                >
                                    View Details
                                </button>

                                {booking.status === "pending" && (
                                    <>
                                        <button
                                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition flex items-center gap-1"
                                            onClick={() => handleAccept(booking.id)}
                                            disabled={actionInProgress === booking.id}
                                        >
                                            <MdCheckCircle /> Accept
                                        </button>
                                        <button
                                            className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-semibold hover:bg-red-50 transition flex items-center gap-1"
                                            onClick={() => handleDeclineClick(booking)}
                                            disabled={actionInProgress === booking.id}
                                        >
                                            <MdCancel /> Decline
                                        </button>
                                    </>
                                )}

                                {(booking.status === "confirmed" || booking.status === "scheduled") && (
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1"
                                        onClick={() => handleStartWork(booking.id)}
                                        disabled={actionInProgress === booking.id}
                                    >
                                        <MdPlayArrow /> Start Work
                                    </button>
                                )}

                                {booking.status === "in_progress" && (
                                    <button
                                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition"
                                        onClick={() => handleOpenCompleteModal(booking)}
                                        disabled={actionInProgress === booking.id}
                                    >
                                        Complete Job
                                    </button>
                                )}

                                {["confirmed", "scheduled", "in_progress"].includes(booking.status) && (
                                    <a
                                        href={`tel:${booking.customer_phone}`}
                                        className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm font-semibold hover:bg-yellow-600 transition flex items-center gap-1"
                                    >
                                        <MdPhone /> Call Customer
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center p-10 bg-white rounded-lg shadow-md text-gray-500">
                        No bookings found for the selected filter.
                    </div>
                )}
            </div>

            {hasMore && (
                <div className="mt-6 text-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-semibold hover:bg-gray-900 disabled:opacity-50"
                    >
                        {loadingMore ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}

            {/* Modal for Decline Confirmation */}
            {showDeclineModal && selectedBooking && (
                <Modal onClose={() => setShowDeclineModal(false)}>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Decline Booking</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to decline the booking for{" "}
                            <strong>{selectedBooking.service_title}</strong> from{" "}
                            <strong>{selectedBooking.customer_name}</strong>?
                        </p>
                        <textarea
                            placeholder="Reason for declining (optional)"
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mb-4 text-sm focus:outline-none focus:border-green-600"
                            rows="3"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50"
                                onClick={() => setShowDeclineModal(false)}
                                disabled={actionInProgress}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700"
                                onClick={handleDeclineConfirm}
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? "Declining..." : "Confirm Decline"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal for Image Upload */}
            {showUploadModal && selectedBooking && (
                <Modal onClose={() => setShowUploadModal(false)}>
                    <BookingImageUpload
                        bookingId={selectedBooking.id}
                        imageType={uploadImageType}
                        onUploadSuccess={handleUploadSuccess}
                        onCancel={() => setShowUploadModal(false)}
                        existingImages={selectedBooking.images?.filter(img => img.image_type === uploadImageType) || []}
                    />
                </Modal>
            )}

            {showCompleteModal && selectedBooking && (
                <Modal onClose={() => { setShowCompleteModal(false); resetCompleteState(); }}>
                    <div className="p-6 max-w-2xl space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold">Mark Job as Completed</h3>
                                <p className="text-sm text-gray-600">Upload after-service photos (required) and add an optional note.</p>
                            </div>
                            <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => { setShowCompleteModal(false); resetCompleteState(); }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                            <p className="flex justify-between"><span className="font-semibold">Service:</span> <span>{selectedBooking.service_title}</span></p>
                            <p className="flex justify-between"><span className="font-semibold">Customer:</span> <span>{selectedBooking.customer_name}</span></p>
                            <p className="mt-2 text-orange-700 font-semibold text-xs">After photos are required to complete the job.</p>
                        </div>

                        {completeError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{completeError}</div>
                        )}

                        {selectedBooking.images?.filter((img) => img.image_type === 'after')?.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">Existing after photos</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {selectedBooking.images.filter((img) => img.image_type === 'after').map((img) => (
                                        <img key={img.id} src={img.image_url} alt="after" className="h-24 w-full object-cover rounded border" />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">After-service photos (max 5)</label>
                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer text-sm text-gray-600 ${completeFiles.length >= 5 ? 'opacity-60 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-50'}`}>
                                <span className="font-medium text-gray-800">{completeFiles.length >= 5 ? 'Maximum 5 images reached' : 'Drop images here or click to browse'}</span>
                                <span className="text-xs text-gray-500">JPG/PNG up to 5MB each</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    disabled={completeFiles.length >= 5 || completeLoading}
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        const remaining = 5 - completeFiles.length;
                                        const toAdd = files.slice(0, remaining);
                                        if (files.length > remaining) {
                                            setCompleteError(`Only ${remaining} more image(s) can be added (max 5).`);
                                        }
                                        handleCompleteFilesChange(toAdd);
                                    }}
                                />
                            </label>
                            {completePreviews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {completePreviews.map((url, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={url} alt={`after-${idx}`} className="h-24 w-full object-cover rounded border" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCompleteFile(idx)}
                                                className="absolute top-1 right-1 bg-white/90 text-red-600 text-xs px-2 py-1 rounded shadow hidden group-hover:block"
                                                disabled={completeLoading}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500">At least 1 after photo is required.</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Completion note (optional)</label>
                            <textarea
                                rows={3}
                                value={completeNote}
                                onChange={(e) => setCompleteNote(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Summarize the work done or any follow-up info"
                                disabled={completeLoading}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50"
                                onClick={() => { setShowCompleteModal(false); resetCompleteState(); }}
                                disabled={completeLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                onClick={handleCompleteSubmit}
                                disabled={completeLoading}
                            >
                                {completeLoading ? 'Completing...' : 'Submit & Complete'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal for Booking Details */}
            {selectedBooking && !showDeclineModal && !showUploadModal && !showCompleteModal && (
                <Modal onClose={() => setSelectedBooking(null)}>
                    {/* Info bar with badges */}
                    <div className="mb-4 flex flex-wrap gap-2">
                        {isEmergency && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-red-700 text-sm font-semibold">
                                🚨 Emergency request
                            </span>
                        )}
                        {customerRating ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-blue-700 text-sm">
                                ⭐ {customerRating.toFixed(1)} ({customerBookings ?? '—'} bookings)
                            </span>
                        ) : (
                            customerBookings != null && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-700 text-sm">
                                    📦 {customerBookings} booking{customerBookings === 1 ? '' : 's'}
                                </span>
                            )
                        )}
                        {distanceKm != null && (
                            <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                                    radiusKm && distanceKm > radiusKm
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-green-100 text-green-700'
                                }`}
                            >
                                📍 {distanceKm} km{' '}
                                {radiusKm
                                    ? distanceKm > radiusKm
                                        ? `(outside ${radiusKm} km radius)`
                                        : `(within ${radiusKm} km radius)`
                                    : null}
                            </span>
                        )}
                        {bookingAge && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-purple-700 text-sm">
                                ⏳ Requested {bookingAge}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-700 text-sm">
                            ⏱️ Respond within 24h
                        </span>
                    </div>

                    {/* Optional service/specialization chips */}
                    {(serviceTitle || specialization || priceType) && (
                        <div className="mb-4 flex flex-wrap gap-2 text-sm">
                            {serviceTitle && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                                    🛠️ {serviceTitle}
                                </span>
                            )}
                            {specialization && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                                    🎯 {specialization}
                                </span>
                            )}
                            {priceType && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 capitalize">
                                    💰 {priceType}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="p-6 max-w-2xl">
                        <h3 className="text-xl font-semibold mb-4">Booking Details</h3>
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-500 font-semibold">Service</p>
                                    <p>{selectedBooking.service_title}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold">Customer</p>
                                    <p>{selectedBooking.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold">Status</p>
                                    <p>{getStatusDisplay(selectedBooking.status)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold">Price</p>
                                    <p>NRS {selectedBooking.quoted_price || selectedBooking.final_price || "TBD"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold">Customer Phone</p>
                                    <p>{selectedBooking.customer_phone || "Not provided"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold">Scheduled</p>
                                    <p>
                                        {formatDate(selectedBooking.scheduled_date || selectedBooking.preferred_date)}{" "}
                                        at {formatTime(selectedBooking.scheduled_time || selectedBooking.preferred_time)}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500 font-semibold">Address</p>
                                    <p>{selectedBooking.service_address}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500 font-semibold">Description</p>
                                    <p>{selectedBooking.description}</p>
                                </div>
                                {selectedBooking.special_instructions && (
                                    <div className="col-span-2">
                                        <p className="text-gray-500 font-semibold">Special Instructions</p>
                                        <p>{selectedBooking.special_instructions}</p>
                                    </div>
                                )}
                                {selectedBooking.images && selectedBooking.images.length > 0 && (
                                    <div className="col-span-2">
                                        <p className="text-gray-500 font-semibold mb-2">Photos</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedBooking.images.map((img) => (
                                                <div key={img.id} className="text-center">
                                                    <img
                                                        src={img.image_url}
                                                        alt={img.image_type}
                                                        className="w-full h-24 object-cover rounded-md"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">{img.image_type}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Upload Photos Button */}
                                {["confirmed", "scheduled", "in_progress"].includes(selectedBooking.status) && (
                                    <div className="col-span-2">
                                        <button
                                            onClick={() => handleOpenUpload(
                                                selectedBooking.status === "in_progress" ? "after_work" : "before_work"
                                            )}
                                            className="w-full px-4 py-2 border-2 border-dashed border-green-600 text-green-600 rounded-md text-sm font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
                                        >
                                            <span className="text-lg">+</span>
                                            Add {selectedBooking.status === "in_progress" ? "After Work" : "Before Work"} Photos
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* In your service/pricing area, add a duration hint for hourly services */}
                        {isHourly && estHours ? (
                            <p className="text-sm text-gray-700">
                                Estimated duration:{' '}
                                <span className="font-semibold">
                                    {estHours} hour{estHours === 1 ? '' : 's'}
                                </span>
                            </p>
                        ) : null}

                        {/* Coordinates & map links (compact, only if coords exist) */}
                        {(serviceLat != null || providerLat != null) && (
                            <div className="mt-4 grid gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                {serviceLat != null && serviceLng != null && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">Service location:</span>
                                        <span>
                                            {serviceLat}, {serviceLng}
                                        </span>
                                        {mapLinkService && (
                                            <a
                                                className="text-blue-600 hover:underline"
                                                href={mapLinkService}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                View on map
                                            </a>
                                        )}
                                    </div>
                                )}
                                {providerLat != null && providerLng != null && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">Provider location:</span>
                                        <span>
                                            {providerLat}, {providerLng}
                                        </span>
                                        {mapLinkProvider && (
                                            <a
                                                className="text-blue-600 hover:underline"
                                                href={mapLinkProvider}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                View on map
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Review block */}
                        {selectedBooking?.review && (
                            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Customer review</span>
                                    <span className="text-gray-600">
                                        {selectedBooking.review.customer_name ||
                                            selectedBooking.review.customer?.full_name ||
                                            "Customer"}
                                    </span>
                                </div>
                                <div className="mt-1 text-yellow-600">
                                    {"★".repeat(selectedBooking.review.rating).padEnd(5, "☆")}
                                </div>
                                <p className="mt-2 text-gray-700">{selectedBooking.review.comment}</p>
                            </div>
                        )}

                        {/* Action Buttons in Modal */}
                        <div className="flex gap-3 mt-6">
                            {selectedBooking.status === "pending" && (
                                <>
                                    <button
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700"
                                        onClick={() => {
                                            handleAccept(selectedBooking.id);
                                            setSelectedBooking(null);
                                        }}
                                        disabled={actionInProgress}
                                    >
                                        Accept Booking
                                    </button>
                                    <button
                                        className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-semibold hover:bg-red-50"
                                        onClick={() => {
                                            setShowDeclineModal(true);
                                        }}
                                        disabled={actionInProgress}
                                    >
                                        Decline
                                    </button>
                                </>
                            )}
                            {(selectedBooking.status === "confirmed" || selectedBooking.status === "scheduled") && (
                                <button
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                                    onClick={() => {
                                        handleStartWork(selectedBooking.id);
                                    }}
                                    disabled={actionInProgress}
                                >
                                    Start Work
                                </button>
                            )}
                            {selectedBooking.status === "in_progress" && (
                                <button
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700"
                                    onClick={() => {
                                        handleOpenCompleteModal(selectedBooking);
                                    }}
                                    disabled={actionInProgress}
                                >
                                    Complete Job
                                </button>
                            )}
                            <button
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50"
                                onClick={() => setSelectedBooking(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </ProviderDashboardLayout>
    );
};

