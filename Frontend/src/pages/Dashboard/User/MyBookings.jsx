import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Modal } from "../../../components/Modal";
import BookingImageUpload from "../../../components/BookingImageUpload";
import ActionButton from "../../../components/ActionButton";
import PaymentModal from "../../../components/PaymentModal";
import { useToast } from "../../../components/Toast";
import { useUserProfile } from "../../../context/UserProfileContext";
import {
    MdCalendarToday,
    MdLocationOn,
    MdPhone,
} from "react-icons/md";
import { AiOutlineDollarCircle } from "react-icons/ai";
import bookingsService from "../../../services/bookingsService";
import { reviewFormSchema, decisionFormSchema } from "../../../validations/userSchemas";

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
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 10;
    const [error, setError] = useState(null);
    const [cancelingBookingId, setCancelingBookingId] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadImageType, setUploadImageType] = useState("problem_area");
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [decisionFiles, setDecisionFiles] = useState([]);
    const [decisionPreviews, setDecisionPreviews] = useState([]);
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentBooking, setPaymentBooking] = useState(null);
    const [loadingDetailId, setLoadingDetailId] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [loadingReviewModal, setLoadingReviewModal] = useState(false);
    const { addToast } = useToast();
    const { userProfile: userData } = useUserProfile();

    const tabs = ["All", "pending", "confirmed", "scheduled", "in_progress", "completed", "cancelled"];
    const decisionEligibleStatuses = ["provider_completed", "awaiting_confirmation", "awaiting_customer", "completed"];

    // React Hook Form - Review Form
    const {
        register: registerReview,
        handleSubmit: handleSubmitReview,
        formState: { errors: reviewErrors },
        reset: resetReview,
        watch: watchReview,
        setValue: setReviewValue,
    } = useForm({
        resolver: yupResolver(reviewFormSchema),
        defaultValues: {
            rating: 5,
            title: "",
            comment: "",
            would_recommend: true,
        },
        mode: 'onBlur',
    });

    // React Hook Form - Decision Form
    const {
        register: registerDecision,
        handleSubmit: handleSubmitDecision,
        formState: { errors: decisionErrors },
        reset: resetDecision,
        watch: watchDecision,
        setValue: setDecisionValue,
    } = useForm({
        resolver: yupResolver(decisionFormSchema),
        defaultValues: {
            decisionType: 'approve',
            decisionNote: '',
            decisionFiles: [],
        },
        mode: 'onBlur',
    });

    const decisionTypeValue = watchDecision('decisionType');

    // Fetch bookings on component mount
    useEffect(() => {
        fetchBookings(1, false);
    }, []);

    const fetchBookings = async (targetPage = 1, append = false) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);
            const data = await bookingsService.getMyBookings({ page: targetPage, page_size: pageSize });
            const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
            setBookings((prev) => append ? [...prev, ...list] : list);
            setHasMore(Boolean(data?.next));
            setPage(targetPage);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError(err.error || "Failed to load bookings");
            if (!append) {
                setBookings([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!hasMore || loadingMore) return;
        fetchBookings(page + 1, true);
    };
    // Format currency
    const formatCurrency = (amount) => {
        if (!amount) return "—";
        return `NRS ${Number(amount).toLocaleString('en-US')}`;
    };

    // Calculate total price from booking services if main price fields are null
    const getBookingPrice = (booking) => {
        if (booking.final_price) {
            return formatCurrency(booking.final_price);
        }
        if (booking.quoted_price) {
            return formatCurrency(booking.quoted_price);
        }
        // Fallback: calculate from booking_services if available
        if (booking.booking_services && Array.isArray(booking.booking_services) && booking.booking_services.length > 0) {
            const total = booking.booking_services.reduce((sum, svc) => {
                return sum + (Number(svc.price_at_booking) || 0);
            }, 0);
            return total > 0 ? formatCurrency(total) : "TBD";
        }
        return "TBD";
    };

    // Get all service titles from booking_services array
    const getAllServiceTitles = (booking) => {
        if (booking.booking_services && Array.isArray(booking.booking_services) && booking.booking_services.length > 0) {
            return booking.booking_services.map(bs => bs.service_title || bs.specialization_name || 'Service').join(', ');
        }
        return booking.service_title || 'Service';
    };

    // Get count of services in booking
    const getServiceCount = (booking) => {
        if (booking.booking_services && Array.isArray(booking.booking_services)) {
            return booking.booking_services.length;
        }
        return 1;
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
            setReviewSuccess(null);
            setHasReviewed(false);
            try {
                const myReviewsResp = await bookingsService.getMyCustomerReviews({ page_size: 100 });
                const myReviews = Array.isArray(myReviewsResp?.results) ? myReviewsResp.results : (Array.isArray(myReviewsResp) ? myReviewsResp : []);
                const reviewed = myReviews.some(r => r.booking_id === selectedBooking.id || r.booking === selectedBooking.id);
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
        // This function is now replaced by RHF but kept as reference
        // Form inputs are now managed by register()
    };

    // Star rating input component (1-5) - Updated for RHF
    function StarRatingInput({ fieldValue, onFieldChange, disabled = false }) {
        const stars = [1, 2, 3, 4, 5];
        return (
            <div className="flex items-center gap-1">
                {stars.map((n) => (
                    <button
                        type="button"
                        key={n}
                        disabled={disabled}
                        onClick={() => onFieldChange(n)}
                        className={`text-2xl ${n <= fieldValue ? 'text-yellow-500' : 'text-white'} ${disabled ? '' : 'hover:text-yellow-400 hover:scale-110'} transition-all duration-150 cursor-pointer`}
                        style={{ textShadow: n <= fieldValue ? '0 0 3px rgba(234, 179, 8, 0.5)' : '0 0 2px rgba(0, 0, 0, 0.3)', WebkitTextStroke: '1px #d1d5db' }}
                        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    }

    const onReviewSubmit = async (formData) => {
        if (!selectedBooking) return;
        try {
            const payload = {
                rating: formData.rating,
                title: formData.title.trim(),
                comment: formData.comment.trim(),
                would_recommend: !!formData.would_recommend,
            };
            const created = await bookingsService.createReview(selectedBooking.id, payload);
            setReviewSuccess('Thank you! Your review has been submitted.');
            setHasReviewed(true);
            resetReview();
            setTimeout(() => setReviewSuccess(null), 3000);
        } catch (err) {
            console.error('Error submitting review:', err);
            addToast(err?.error || err?.message || 'Failed to submit review', 'error');
        }
    };

    // Open upload modal with specified image type
    const handleOpenUpload = (imageType) => {
        setUploadImageType(imageType);
        setShowUploadModal(true);
    };

    const resetDecisionState = () => {
        setDecisionFiles([]);
        setDecisionPreviews([]);
        resetDecision();
    };

    const handleOpenDecisionModal = (type, booking) => {
        setSelectedBooking(booking);
        setDecisionValue('decisionType', type);
        resetDecisionState();
        // Always refresh booking status when opening modal to ensure we have latest state
        bookingsService.getBookingDetail(booking.id)
            .then(refreshed => {
                setSelectedBooking(refreshed);
                console.log(`[Decision Modal] Refreshed booking ${refreshed.id}, status: ${refreshed.status}`);
            })
            .catch(err => console.error('Failed to refresh booking:', err));
        setShowDecisionModal(true);
    };

    const handleDecisionFilesChange = (files) => {
        const remaining = 5 - decisionFiles.length;
        const toAdd = files.slice(0, remaining);
        const valid = toAdd.filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
        setDecisionFiles((prev) => [...prev, ...valid]);
        setDecisionPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    };

    const handleRemoveDecisionFile = (index) => {
        setDecisionFiles((prev) => prev.filter((_, i) => i !== index));
        setDecisionPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const onDecisionSubmit = async (formData) => {
        if (!selectedBooking) return;
        try {
            setDecisionLoading(true);
            // Upload customer photos as 'approval_photos' type (separate from provider 'after' images)
            if (decisionFiles.length > 0) {
                await bookingsService.uploadBookingImages(selectedBooking.id, 'approval_photos', decisionFiles, formData.decisionNote);
            }
            // Refresh booking status before approving (in case it auto-transitioned)
            const refreshed = await bookingsService.getBookingDetail(selectedBooking.id);
            setSelectedBooking(refreshed);
            const updated = formData.decisionType === 'approve'
                ? await bookingsService.approveCompletion(refreshed.id, formData.decisionNote)
                : await bookingsService.disputeBooking(refreshed.id, formData.decisionNote, formData.decisionNote);
            setBookings(bookings.map((b) => (b.id === updated.id ? updated : b)));
            setSelectedBooking(updated);
            addToast(formData.decisionType === 'approve' ? 'Booking approved successfully' : 'Dispute submitted', 'success');
            setShowDecisionModal(false);
            resetDecisionState();
        } catch (err) {
            console.error('Decision submit failed', err);
            const errorMsg = err?.error || err?.message || 'Failed to submit';
            // Log booking status for debugging
            if (selectedBooking) {
                console.error(`Booking ID: ${selectedBooking.id}, Status: ${selectedBooking.status}`);
            }
            addToast(errorMsg, 'error');
        } finally {
            setDecisionLoading(false);
        }
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
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-lg">{getAllServiceTitles(booking)}</p>
                                            {getServiceCount(booking) > 1 && (
                                                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                    {getServiceCount(booking)} services
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 text-sm">Provider: <span className="text-base text-gray-800 font-semibold capitalize">{booking.provider_name}</span></p>

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
                                    <p className="font-semibold">{getBookingPrice(booking)}</p>
                                </div>

                                <p className="text-gray-700 text-sm mb-5">{booking.description}</p>

                                <div className="flex space-x-3">
                                    <button
                                        className="px-4 py-2 border border-green-600 text-green-600 rounded-md text-sm font-semibold hover:bg-green-50 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                        onClick={async () => {
                                            try {
                                                setLoadingDetailId(booking.id);
                                                const fullBooking = await bookingsService.getBookingDetail(booking.id);
                                                setSelectedBooking(fullBooking);
                                            } catch (err) {
                                                console.error("Error fetching booking details:", err);
                                                addToast("Failed to load booking details", "error");
                                            } finally {
                                                setLoadingDetailId(null);
                                            }
                                        }}
                                        disabled={loadingDetailId === booking.id}
                                    >
                                        {loadingDetailId === booking.id ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                                                Loading...
                                            </>
                                        ) : (
                                            "View Details"
                                        )}
                                    </button>

                                    {booking.status === "completed" && (
                                        <>
                                            {/* No payment yet - show Pay button */}
                                            {!booking.payment && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            setLoadingDetailId(booking.id);
                                                            const fullBooking = await bookingsService.getBookingDetail(booking.id);
                                                            setPaymentBooking(fullBooking);
                                                            setShowPaymentModal(true);
                                                        } catch (err) {
                                                            console.error("Error fetching booking details:", err);
                                                            addToast("Failed to load booking details", "error");
                                                        } finally {
                                                            setLoadingDetailId(null);
                                                        }
                                                    }}
                                                    disabled={loadingDetailId === booking.id}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
                                                >
                                                    {loadingDetailId === booking.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AiOutlineDollarCircle className="h-4 w-4" />
                                                            Pay NPR {booking.final_price || booking.quoted_price}
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {/* Non-cash payment pending (e.g. failed attempt) - show Pay button */}
                                            {booking.payment && booking.payment.status !== 'completed' && booking.payment.payment_method !== 'cash' && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            setLoadingDetailId(booking.id);
                                                            const fullBooking = await bookingsService.getBookingDetail(booking.id);
                                                            setPaymentBooking(fullBooking);
                                                            setShowPaymentModal(true);
                                                        } catch (err) {
                                                            console.error("Error fetching booking details:", err);
                                                            addToast("Failed to load booking details", "error");
                                                        } finally {
                                                            setLoadingDetailId(null);
                                                        }
                                                    }}
                                                    disabled={loadingDetailId === booking.id}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
                                                >
                                                    {loadingDetailId === booking.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AiOutlineDollarCircle className="h-4 w-4" />
                                                            Pay NPR {booking.final_price || booking.quoted_price}
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {/* Cash payment pending - show awaiting status */}
                                            {booking.payment?.payment_method === 'cash' && booking.payment?.status === 'pending' && (
                                                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                                                    <svg className="w-4 h-4 text-amber-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="font-semibold text-sm">Cash — Awaiting Confirmation</span>
                                                </div>
                                            )}
                                            {/* Payment completed */}
                                            {booking.payment?.status === 'completed' && (
                                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="font-semibold text-sm">Paid{booking.payment.payment_method === 'cash' ? ' (Cash)' : ''}</span>
                                                </div>
                                            )}
                                            <ActionButton
                                                label="★ Rate Service"
                                                loadingLabel="Loading..."
                                                isLoading={loadingReviewModal && loadingDetailId === booking.id}
                                                onClick={async () => {
                                                    try {
                                                        setLoadingReviewModal(true);
                                                        setLoadingDetailId(booking.id);
                                                        const fullBooking = await bookingsService.getBookingDetail(booking.id);
                                                        setSelectedBooking(fullBooking);
                                                        setShowReviewModal(true);
                                                        resetReview();
                                                        setReviewSuccess(null);
                                                        setHasReviewed(fullBooking.review ? true : false);
                                                    } catch (err) {
                                                        console.error("Error fetching booking details:", err);
                                                        addToast("Failed to load booking details", "error");
                                                    } finally {
                                                        setLoadingReviewModal(false);
                                                        setLoadingDetailId(null);
                                                    }
                                                }}
                                                variant="primary"
                                                size="md"
                                            />
                                        </>
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
                            Are you sure you want to cancel this booking for <strong>{getAllServiceTitles(selectedBooking)}</strong>?
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

            {showDecisionModal && selectedBooking && (
                <Modal onClose={() => { setShowDecisionModal(false); resetDecisionState(); }}>
                    <form onSubmit={handleSubmitDecision(onDecisionSubmit)} className="p-6 max-w-2xl space-y-4">
                        {/* Hidden input for decision type */}
                        <input type="hidden" {...registerDecision('decisionType')} />
                        
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold">
                                    Report Issue / Dispute Completion
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Please describe the issue and add photos showing the problem.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => { setShowDecisionModal(false); resetDecisionState(); }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                            <p className="flex justify-between"><span className="font-semibold">Service{getServiceCount(selectedBooking) > 1 ? 's' : ''}:</span> <span>{getAllServiceTitles(selectedBooking)}</span></p>
                            <p className="flex justify-between"><span className="font-semibold">Provider:</span> <span>{selectedBooking.provider_name}</span></p>
                            <p className="mt-2 text-red-700 font-semibold text-xs">📸 Photos are required to support your dispute claim.</p>
                        </div>

                        {decisionErrors.decisionFiles && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{decisionErrors.decisionFiles.message}</div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Photos of the Issue <span className="text-red-500">*</span>
                            </label>
                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer text-sm text-gray-600 ${decisionFiles.length >= 5 ? 'opacity-60 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-50'}`}>
                                <span className="font-medium text-gray-800">{decisionFiles.length >= 5 ? 'Maximum 5 images reached' : 'Drop images here or click to browse'}</span>
                                <span className="text-xs text-gray-500">JPG/PNG up to 5MB each • Max 5</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    disabled={decisionFiles.length >= 5 || decisionLoading}
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        const remaining = 5 - decisionFiles.length;
                                        const toAdd = files.slice(0, remaining);
                                        handleDecisionFilesChange(toAdd);
                                    }}
                                />
                            </label>
                            {decisionPreviews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {decisionPreviews.map((url, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={url} alt={`decision-${idx}`} className="h-24 w-full object-cover rounded border" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDecisionFile(idx)}
                                                className="absolute top-1 right-1 bg-white/90 text-red-600 text-xs px-2 py-1 rounded shadow hidden group-hover:block"
                                                disabled={decisionLoading}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-red-600 font-medium">📌 At least 1 photo is required to submit your dispute.</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">
                                Describe the Issue <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                {...registerDecision('decisionNote')}
                                rows={4}
                                className={`w-full border ${decisionErrors.decisionNote ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500`}
                                placeholder="Please describe what went wrong, what issues you found, and what you expect to be resolved..."
                                disabled={decisionLoading}
                            />
                            {decisionErrors.decisionNote && (
                                <p className="text-red-500 text-xs mt-1">{decisionErrors.decisionNote.message}</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                                onClick={() => { setShowDecisionModal(false); resetDecisionState(); }}
                                disabled={decisionLoading}
                            >
                                Cancel
                            </button>
                            <ActionButton
                                label="Submit Dispute"
                                loadingLabel="Submitting..."
                                isLoading={decisionLoading}
                                type="submit"
                                disabled={decisionLoading}
                                variant="danger"
                                size="md"
                                className="flex-1"
                            />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal for Review */}
            {showReviewModal && selectedBooking && (
                <Modal onClose={() => { setShowReviewModal(false); setSelectedBooking(null); resetReview(); setReviewSuccess(null); }}>
                    <div className="p-6 max-w-2xl">
                        <div className="mb-4">
                            <h3 className="text-xl font-semibold">Rate Your Service</h3>
                            <p className="text-sm text-gray-600 mt-1">Share your experience with this service</p>
                        </div>

                        {/* Booking Context */}
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4 text-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{getAllServiceTitles(selectedBooking)}</p>
                                    {getServiceCount(selectedBooking) > 1 && (
                                        <p className="text-xs text-green-600 mt-1">{getServiceCount(selectedBooking)} services booked</p>
                                    )}
                                    <p className="text-gray-600">Provider: {selectedBooking.provider_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-600">{formatDate(selectedBooking.scheduled_date || selectedBooking.preferred_date)}</p>
                                    <p className="font-semibold text-green-600">{getBookingPrice(selectedBooking)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Review Form */}
                        {hasReviewed ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 text-center">
                                <p className="font-semibold mb-2">✓ You have already reviewed this booking</p>
                                <p className="text-sm">Thank you for sharing your feedback!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitReview(onReviewSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rating <span className="text-red-500">*</span></label>
                                        <StarRatingInput 
                                            fieldValue={watchReview('rating')} 
                                            onFieldChange={(val) => {
                                                setReviewValue('rating', val);
                                            }} 
                                        />
                                        <input type="hidden" {...registerReview('rating')} />
                                        {reviewErrors.rating && (
                                            <p className="text-red-500 text-xs mt-1">{reviewErrors.rating.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Would Recommend</label>
                                        <label className="inline-flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                {...registerReview('would_recommend')}
                                                className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700">Yes, I recommend this provider</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...registerReview('title')}
                                        placeholder="e.g., Great work and professional"
                                        className={`w-full p-3 border ${reviewErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                                    />
                                    {reviewErrors.title && (
                                        <p className="text-red-500 text-xs mt-1">{reviewErrors.title.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Comments (optional)</label>
                                    <textarea
                                        {...registerReview('comment')}
                                        rows={4}
                                        placeholder="Share more about your experience..."
                                        className={`w-full p-3 border ${reviewErrors.comment ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                                    />
                                    {reviewErrors.comment && (
                                        <p className="text-red-500 text-xs mt-1">{reviewErrors.comment.message}</p>
                                    )}
                                </div>
                                {reviewSuccess && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                                        {reviewSuccess}
                                    </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <ActionButton
                                        label="Submit Review"
                                        loadingLabel="Submitting..."
                                        isLoading={false}
                                        type="submit"
                                        disabled={reviewSuccess !== null}
                                        variant="primary"
                                        size="md"
                                        className="flex-1"
                                    />
                                </div>
                            </form>
                        )}
                    </div>
                </Modal>
            )}

            {/* Modal for booking details */}
            {selectedBooking && !cancelingBookingId && !showUploadModal && !showDecisionModal && !showReviewModal && (
                <Modal onClose={() => setSelectedBooking(null)}>
                    <div className="p-6 max-w-2xl">
                        <h3 className="text-xl font-semibold mb-4">Booking Details</h3>
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <p className="text-gray-500 font-semibold">Service{getServiceCount(selectedBooking) > 1 ? 's' : ''}</p>
                                    {selectedBooking.booking_services && selectedBooking.booking_services.length > 0 ? (
                                        <div className="space-y-1 mt-1">
                                            {selectedBooking.booking_services.map((bs, idx) => (
                                                <div key={idx} className="flex justify-between items-start text-sm bg-gray-50 p-2 rounded">
                                                    <span className="flex-1">{bs.service_title || bs.specialization_name}</span>
                                                    <span className="text-gray-600 ml-2">{formatCurrency(bs.price_at_booking)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>{selectedBooking.service_title}</p>
                                    )}
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
                                    <p>{getBookingPrice(selectedBooking)}</p>
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
                                {/* Dispute completion */}
                                {decisionEligibleStatuses.includes(selectedBooking.status) && (
                                    <div className="col-span-2">
                                        <button
                                            onClick={() => handleOpenDecisionModal('dispute', selectedBooking)}
                                            className="w-full px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition"
                                        >
                                            Report Issue / Dispute Completion
                                        </button>
                                    </div>
                                )}
                                {/* Payment Section */}
                                {/* No payment yet OR non-cash pending - show Pay button */}
                                {selectedBooking.status === 'completed' && (
                                    !selectedBooking.payment || 
                                    (selectedBooking.payment?.status !== 'completed' && selectedBooking.payment?.payment_method !== 'cash')
                                ) && (
                                    <div className="col-span-2 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                        <p className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                                            <AiOutlineDollarCircle className="h-5 w-5 text-blue-600" />
                                            Payment Required
                                        </p>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Complete your payment to finish this booking
                                        </p>
                                        <button
                                            onClick={() => {
                                                setPaymentBooking(selectedBooking);
                                                setShowPaymentModal(true);
                                            }}
                                            className="w-full px-4 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                                        >
                                            <AiOutlineDollarCircle className="h-5 w-5" />
                                            Pay NPR {selectedBooking.final_price || selectedBooking.quoted_price} Now
                                        </button>
                                    </div>
                                )}
                                {/* Cash payment pending - awaiting provider confirmation */}
                                {selectedBooking.payment?.payment_method === 'cash' && selectedBooking.payment?.status === 'pending' && (
                                    <div className="col-span-2 bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-amber-800 font-semibold">Cash Payment — Awaiting Confirmation</p>
                                                <p className="text-sm text-amber-700 mt-0.5">
                                                    You selected cash payment. Please pay the provider directly. The provider will confirm once they receive the payment.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {selectedBooking.payment?.status === 'completed' && (
                                    <div className="col-span-2 bg-green-50 p-4 rounded-lg border-2 border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-green-700 font-semibold">Payment Completed</span>
                                            </div>
                                            <span className="text-sm text-gray-600 capitalize">
                                                {selectedBooking.payment.payment_method}
                                            </span>
                                        </div>
                                        <p className="text-sm text-green-700 mt-2">
                                            Amount: NPR {selectedBooking.payment.amount}
                                        </p>
                                    </div>
                                )}
                                {/* Rate Service Button in Details Modal */}
                                {selectedBooking.status === 'completed' && (
                                    <div className="col-span-2">
                                        <button
                                            onClick={() => {
                                                setShowReviewModal(true);
                                                resetReview();
                                                setReviewSuccess(null);
                                                setHasReviewed(selectedBooking.review ? true : false);
                                            }}
                                            className="w-full px-4 py-3 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                                        >
                                            ★ Leave a Review
                                        </button>
                                    </div>
                                )}
                                {/* Review block */}
                                {selectedBooking?.review && (
                                    <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">Your review for</span>
                                            <span className="text-gray-600">
                                                {selectedBooking.review.provider_name ||
                                                    selectedBooking.provider?.full_name ||
                                                    "Provider"}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-yellow-600">
                                            {"★".repeat(selectedBooking.review.rating).padEnd(5, "☆")}
                                        </div>
                                        <p className="mt-2 text-gray-700">{selectedBooking.review.comment}</p>
                                    </div>
                                )}
                            </div>
                            <button
                                className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 w-full"
                                onClick={() => setSelectedBooking(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    </Modal>
                )}

                {/* Payment Modal */}
                {showPaymentModal && paymentBooking && (
                    <PaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => {
                            setShowPaymentModal(false);
                            setPaymentBooking(null);
                        }}
                        booking={paymentBooking}
                        onPaymentSuccess={(response) => {
                            addToast('Payment successful! Your booking is fully complete.', 'success');
                            setShowPaymentModal(false);
                            setPaymentBooking(null);
                            fetchBookings();
                        }}
                        onPaymentError={(error) => {
                            addToast(error.message || 'Payment failed. Please try again.', 'error');
                        }}
                    />
                )}
        </DashboardLayout>
    );
}
