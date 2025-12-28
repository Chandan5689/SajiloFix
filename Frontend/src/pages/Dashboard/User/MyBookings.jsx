import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Modal } from "../../../components/Modal";
import BookingImageUpload from "../../../components/BookingImageUpload";
import { useToast } from "../../../components/Toast";
import { useUserProfile } from "../../../context/UserProfileContext";
import {
    MdCalendarToday,
    MdLocationOn,
    MdPhone,
} from "react-icons/md";
import bookingsService from "../../../services/bookingsService";

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

export default function MyBookingsPage() {
    const [activeMenuKey, setActiveMenuKey] = useState("my-bookings");
    const [activeTab, setActiveTab] = useState("All");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelingBookingId, setCancelingBookingId] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadImageType, setUploadImageType] = useState("problem_area");
    const { addToast } = useToast();
    const { userProfile: userData } = useUserProfile();

    // Review form state
    const [hasReviewed, setHasReviewed] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        title: "",
        comment: "",
        would_recommend: true,
    });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState(null);
    const [reviewSuccess, setReviewSuccess] = useState(null);

    const tabs = ["All", "pending", "confirmed", "scheduled", "in_progress", "completed", "cancelled"];

    // Fetch bookings on component mount
    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await bookingsService.getMyBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError(err.error || "Failed to load bookings");
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle booking cancellation
    const handleCancelBooking = async () => {
        if (!selectedBooking) return;
        try {
            setCancelingBookingId(selectedBooking.id);
            const updated = await bookingsService.cancelBooking(selectedBooking.id, cancelReason);
            setBookings(bookings.map(b => b.id === updated.id ? updated : b));
            setSelectedBooking(null);
            setCancelReason("");
            addToast("Booking cancelled successfully", "success");
        } catch (err) {
            console.error("Error cancelling booking:", err);
            addToast("Failed to cancel booking: " + (err.error || err.message || "Unknown error"), "error");
        } finally {
            setCancelingBookingId(null);
        }
    };

    // Handle successful image upload
    const handleUploadSuccess = async (uploadedImages) => {
        // Refresh the booking details to show new images
        try {
            const updatedBooking = await bookingsService.getBookingDetail(selectedBooking.id);
            setSelectedBooking(updatedBooking);
            setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            setShowUploadModal(false);
        } catch (err) {
            console.error("Error refreshing booking:", err);
        }
    };

    // When booking selection changes, determine if already reviewed
    useEffect(() => {
        const checkReviewed = async () => {
            if (!selectedBooking) return;
            setReviewError(null);
            setReviewSuccess(null);
            setHasReviewed(false);
            try {
                const myReviews = await bookingsService.getMyCustomerReviews();
                const reviewed = Array.isArray(myReviews) && myReviews.some(r => r.booking_id === selectedBooking.id);
                setHasReviewed(reviewed);
            } catch (err) {
                // Non-blocking: if unable to fetch, allow form and backend will enforce
                console.warn("Unable to fetch customer reviews:", err);
            }
        };
        checkReviewed();
    }, [selectedBooking]);

    const handleReviewInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setReviewForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'rating' ? parseInt(value) : value)
        }));
    };

    // Star rating input component (1-5)
    function StarRatingInput({ value, onChange, disabled = false }) {
        const stars = [1, 2, 3, 4, 5];
        return (
            <div className="flex items-center gap-1">
                {stars.map((n) => (
                    <button
                        type="button"
                        key={n}
                        disabled={disabled}
                        onClick={() => onChange({ target: { name: 'rating', value: n } })}
                        className={`text-xl ${n <= value ? 'text-yellow-500' : 'text-gray-300'} ${disabled ? '' : 'hover:text-yellow-600'}`}
                        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    }

    const handleSubmitReview = async () => {
        if (!selectedBooking) return;
        // Simple validation
        if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
            setReviewError('Please select a rating between 1 and 5');
            return;
        }
        if (!reviewForm.title.trim()) {
            setReviewError('Please add a short title');
            return;
        }
        try {
            setReviewSubmitting(true);
            setReviewError(null);
            const payload = {
                rating: reviewForm.rating,
                title: reviewForm.title.trim(),
                comment: reviewForm.comment.trim(),
                would_recommend: !!reviewForm.would_recommend,
            };
            const created = await bookingsService.createReview(selectedBooking.id, payload);
            setReviewSuccess('Thank you! Your review has been submitted.');
            setHasReviewed(true);
            // Optionally refresh booking or list if needed
            setTimeout(() => setReviewSuccess(null), 3000);
        } catch (err) {
            console.error('Error submitting review:', err);
            setReviewError(err.error || err.message || 'Failed to submit review');
        } finally {
            setReviewSubmitting(false);
        }
    };

    // Open upload modal with specified image type
    const handleOpenUpload = (imageType) => {
        setUploadImageType(imageType);
        setShowUploadModal(true);
    };

    // Format date and time for display
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

    // Calculate the visual status display
    const getStatusDisplay = (status) => {
        return status
            .replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    // Filter bookings by tab
    const filteredBookings =
        activeTab === "All"
            ? bookings
            : bookings.filter(b => b.status === activeTab);

    if (loading) {
        return (
            <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey} userData={userData}>
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading bookings...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout activeMenuKey={activeMenuKey} onMenuChange={setActiveMenuKey} userData={userData}>
            {/* Header & Book New Service Button */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-semibold">My Bookings</h2>
                    <p className="text-gray-600 text-sm">
                        Track and manage all your service bookings
                    </p>
                </div>
                <Link to="/services" className="bg-green-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-green-700 transition">
                    Book New Service
                </Link>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="bg-gray-200 mb-6 px-2 rounded-lg">
                <div className="flex flex-wrap gap-3 py-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`whitespace-nowrap rounded px-3 py-1 text-sm font-medium transition cursor-pointer ${activeTab === tab
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

            {/* Bookings grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map(
                        (booking) => (
                            <div
                                key={booking.id}
                                className="bg-white p-6 rounded-lg shadow border border-gray-100"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <p className="font-semibold text-lg">{booking.service_title}</p>
                                        <p className="text-gray-700 text-sm">{booking.provider_name}</p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColorMap[booking.status] || "bg-gray-100 text-gray-700"}`}
                                    >
                                        {getStatusDisplay(booking.status)}
                                    </span>
                                </div>

                                <div className="text-gray-600 text-sm space-y-1 mt-3 mb-4">
                                    <p className="flex items-center gap-2">
                                        <MdCalendarToday /> {formatDate(booking.scheduled_date || booking.preferred_date)} at {formatTime(booking.scheduled_time || booking.preferred_time)}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <MdLocationOn /> {booking.service_address}
                                    </p>
                                    <p className="font-semibold">NRS {booking.final_price || booking.quoted_price || "TBD"}</p>
                                </div>

                                <p className="text-gray-700 text-sm mb-5">{booking.description}</p>

                                <div className="flex space-x-3">
                                    <button
                                        className="px-4 py-2 border border-green-600 text-green-600 rounded-md text-sm font-semibold hover:bg-green-50 transition"
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        View Details
                                    </button>

                                    {booking.status === "completed" && (
                                        <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-700 flex items-center gap-1 transition cursor-pointer">
                                            ★ Rate Service
                                        </button>
                                    )}

                                    {booking.status === "in_progress" && (
                                        <button className="px-4 py-2 border bg-yellow-500 text-white rounded-md text-sm font-semibold hover:bg-yellow-600 transition cursor-pointer" onClick={() => alert("Calling provider...")}>
                                            <MdPhone className="inline-block" /> Call Provider
                                        </button>
                                    )}

                                    {booking.status === "confirmed" && (
                                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center gap-1 transition cursor-pointer" onClick={() => alert("Calling provider...")}>
                                            <MdPhone className="inline-block" /> Call Provider
                                        </button>
                                    )}

                                    {["pending", "confirmed", "scheduled"].includes(booking.status) && (
                                        <button
                                            className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-semibold hover:bg-red-50 transition"
                                            onClick={() => {
                                                setCancelingBookingId(booking.id);
                                                setSelectedBooking(booking);
                                                setCancelReason("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    )
                ) : (
                    <div className="col-span-full text-center p-10 bg-white rounded-lg shadow-md text-gray-500">
                        <p>No bookings found for the selected filter.</p>
                    </div>
                )}
            </div>

            {/* Modal for cancellation confirmation */}
            {cancelingBookingId && selectedBooking && (
                <Modal onClose={() => { setCancelingBookingId(null); setSelectedBooking(null); }}>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Cancel Booking</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to cancel this booking for <strong>{selectedBooking.service_title}</strong>?
                        </p>
                        <textarea
                            placeholder="Reason for cancellation (optional)"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mb-4 text-sm focus:outline-none focus:border-green-600"
                            rows="3"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50"
                                onClick={() => { setCancelingBookingId(null); setSelectedBooking(null); }}
                            >
                                Keep Booking
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700"
                                onClick={handleCancelBooking}
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal for image upload */}
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

            {/* Modal for booking details */}
            {selectedBooking && !cancelingBookingId && !showUploadModal && (
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
                                    <p className="text-gray-500 font-semibold">Provider</p>
                                    <p>{selectedBooking.provider_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold">Status</p>
                                    <p>{getStatusDisplay(selectedBooking.status)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-semibold">Price</p>
                                    <p>NRS {selectedBooking.final_price || selectedBooking.quoted_price || "TBD"}</p>
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
                                                    <img src={img.image_url} alt={img.image_type} className="w-full h-24 object-cover rounded-md" />
                                                    <p className="text-xs text-gray-500 mt-1">{img.image_type}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Upload Images Button */}
                                {["pending", "confirmed", "scheduled", "in_progress"].includes(selectedBooking.status) && (
                                    <div className="col-span-2">
                                        <button
                                            onClick={() => handleOpenUpload(
                                                selectedBooking.status === "in_progress" ? "before_work" : "problem_area"
                                            )}
                                            className="w-full px-4 py-2 border-2 border-dashed border-green-600 text-green-600 rounded-md text-sm font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
                                        >
                                            <span className="text-lg">+</span>
                                            Add {selectedBooking.status === "in_progress" ? "Work" : "Problem Area"} Photos
                                        </button>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    {/* Leave a Review (completed bookings) */}
                                    {selectedBooking.status === 'completed' && (
                                        <div className="mt-4">
                                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                <p className="font-semibold mb-2">Leave a Review</p>
                                                {hasReviewed ? (
                                                    <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700">
                                                        You have already reviewed this booking.
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Rating</label>
                                                            <StarRatingInput value={reviewForm.rating} onChange={handleReviewInputChange} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Would Recommend</label>
                                                            <label className="inline-flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    name="would_recommend"
                                                                    checked={reviewForm.would_recommend}
                                                                    onChange={handleReviewInputChange}
                                                                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                                />
                                                                <span className="text-sm text-gray-700">Yes, I recommend this provider</span>
                                                            </label>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                                                            <input
                                                                type="text"
                                                                name="title"
                                                                value={reviewForm.title}
                                                                onChange={handleReviewInputChange}
                                                                placeholder="e.g., Great work and professional"
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-600"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Comments (optional)</label>
                                                            <textarea
                                                                name="comment"
                                                                value={reviewForm.comment}
                                                                onChange={handleReviewInputChange}
                                                                rows={3}
                                                                placeholder="Share more about your experience..."
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-600"
                                                            />
                                                        </div>
                                                        {reviewError && (
                                                            <div className="md:col-span-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                                                {reviewError}
                                                            </div>
                                                        )}
                                                        {reviewSuccess && (
                                                            <div className="md:col-span-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                                                                {reviewSuccess} <a href="/user/my-reviews" className="underline text-green-700">View My Reviews</a>
                                                            </div>
                                                        )}
                                                        <div className="md:col-span-2 flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleSubmitReview}
                                                                disabled={reviewSubmitting}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300"
                                                            >
                                                                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>
                            <button
                                className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 w-full"
                                onClick={() => setSelectedBooking(null)}
                            >
                                Close
                            </button>
                        </div>
                    </Modal>
                )}
        </DashboardLayout>
    );
}
