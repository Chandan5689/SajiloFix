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
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(null);
    const [declineReason, setDeclineReason] = useState("");
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadImageType, setUploadImageType] = useState("before_work");

    const tabs = ["All", "pending", "confirmed", "scheduled", "in_progress", "completed", "cancelled", "declined"];

    // Fetch provider bookings on mount
    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await bookingsService.getProviderBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching provider bookings:", err);
            setError(err.error || "Failed to load bookings");
            setBookings([]);
        } finally {
            setLoading(false);
        }
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
    const handleComplete = async (bookingId) => {
        try {
            setActionInProgress(bookingId);
            const updated = await bookingsService.completeBooking(bookingId);
            setBookings(bookings.map(b => b.id === updated.id ? updated : b));
            if (selectedBooking?.id === bookingId) {
                setSelectedBooking(updated);
            }
        } catch (err) {
            console.error("Error completing booking:", err);
            alert("Failed to complete booking: " + (err.error || err.message));
        } finally {
            setActionInProgress(null);
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
                                        onClick={() => handleComplete(booking.id)}
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

            {/* Modal for Booking Details */}
            {selectedBooking && !showDeclineModal && !showUploadModal && (
                <Modal onClose={() => setSelectedBooking(null)}>
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
                                        handleComplete(selectedBooking.id);
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

