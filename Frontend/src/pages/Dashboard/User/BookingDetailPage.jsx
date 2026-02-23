import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import PaymentModal from "../../../components/PaymentModal";
import { useToast } from "../../../components/Toast";
import {
  MdCalendarToday,
  MdLocationOn,
  MdPhone,
  MdPerson,
  MdEmail,
  MdArrowBack,
  MdCheckCircle,
  MdAccessTime,
  MdPayment,
  MdReceipt,
} from "react-icons/md";
import { AiOutlineDollarCircle } from "react-icons/ai";
import { FaStar } from "react-icons/fa";
import bookingsService from "../../../services/bookingsService";

// Status configuration
const statusConfig = {
  pending: { 
    color: "bg-orange-100 text-orange-700 border-orange-200", 
    icon: "🕐",
    label: "Pending",
    description: "Waiting for provider confirmation"
  },
  confirmed: { 
    color: "bg-blue-100 text-blue-700 border-blue-200", 
    icon: "✓",
    label: "Confirmed",
    description: "Provider has accepted your booking"
  },
  scheduled: { 
    color: "bg-purple-100 text-purple-700 border-purple-200", 
    icon: "📅",
    label: "Scheduled",
    description: "Service date has been scheduled"
  },
  in_progress: { 
    color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
    icon: "🔧",
    label: "In Progress",
    description: "Service is being performed"
  },
  completed: { 
    color: "bg-green-100 text-green-700 border-green-200", 
    icon: "✅",
    label: "Completed",
    description: "Service has been completed"
  },
  cancelled: { 
    color: "bg-red-100 text-red-700 border-red-200", 
    icon: "✗",
    label: "Cancelled",
    description: "Booking was cancelled"
  },
  declined: { 
    color: "bg-red-100 text-red-700 border-red-200", 
    icon: "✗",
    label: "Declined",
    description: "Provider declined this booking"
  },
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(location.state?.paymentSuccess || false);

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  // Show success toast if redirected from payment
  useEffect(() => {
    if (paymentSuccess) {
      addToast("Payment completed successfully!", "success");
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [paymentSuccess]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingsService.getBookingDetail(id);
      setBooking(data);
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError(err.error || err.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "—";
    return `NPR ${Number(amount).toLocaleString('en-NP')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const handlePaymentSuccess = (response) => {
    setPaymentSuccess(true);
    fetchBookingDetail(); // Refresh booking to get updated payment status
  };

  const isPaymentRequired = () => {
    if (!booking) return false;
    // Payment is required if booking is completed and no payment or payment is not completed
    return booking.status === 'completed' && 
           (!booking.payment || booking.payment?.status !== 'completed');
  };

  const isPaymentCompleted = () => {
    return booking?.payment?.status === 'completed';
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout activeMenuKey="my-bookings">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout activeMenuKey="my-bookings">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Back to My Bookings
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) return null;

  const statusInfo = getStatusInfo(booking.status);
  const amount = booking.final_price || booking.quoted_price || 0;

  return (
    <DashboardLayout activeMenuKey="my-bookings">
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <MdArrowBack className="w-5 h-5" />
            <span>Back to My Bookings</span>
          </button>

          {/* Payment Success Banner */}
          {paymentSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MdCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Payment Successful!</h3>
                <p className="text-sm text-green-700">Your payment has been processed successfully.</p>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Header Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Booking #{booking.id}</p>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {booking.service?.title || booking.booking_services?.[0]?.service_title || 'Service Booking'}
                      </h1>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  {/* Status Description */}
                  <p className="text-gray-600 mb-6">{statusInfo.description}</p>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MdCalendarToday className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Scheduled Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(booking.scheduled_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MdAccessTime className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Scheduled Time</p>
                        <p className="font-semibold text-gray-900">{formatTime(booking.scheduled_time)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                {booking.address && (
                  <div className="border-t border-gray-100 p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MdLocationOn className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Service Location</p>
                        <p className="font-medium text-gray-900">{booking.address}</p>
                        {booking.city && <p className="text-sm text-gray-600">{booking.city}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Provider Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Provider</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {(booking.provider?.full_name || booking.provider?.email || 'P')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {booking.provider?.full_name || booking.provider?.email?.split('@')[0] || 'Provider'}
                    </h3>
                    {booking.provider?.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <MdPhone className="w-4 h-4" />
                        {booking.provider.phone}
                      </p>
                    )}
                    {booking.provider?.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <MdEmail className="w-4 h-4" />
                        {booking.provider.email}
                      </p>
                    )}
                  </div>
                  {booking.provider?.average_rating && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <FaStar className="w-5 h-5" />
                        <span className="font-semibold text-gray-900">{booking.provider.average_rating}</span>
                      </div>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Services List */}
              {booking.booking_services && booking.booking_services.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>
                  <div className="space-y-3">
                    {booking.booking_services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{service.service_title || service.specialization_name || 'Service'}</p>
                          {service.quantity > 1 && (
                            <p className="text-sm text-gray-500">Quantity: {service.quantity}</p>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">{formatCurrency(service.price_at_booking)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column - Payment & Actions */}
            <div className="space-y-6">
              {/* Payment Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MdPayment className="w-5 h-5" />
                    Payment
                  </h2>

                  {/* Amount */}
                  <div className="text-center py-4 mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</p>
                  </div>

                  {/* Payment Status */}
                  {isPaymentCompleted() ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <MdCheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">Payment Completed</p>
                          <p className="text-sm text-green-700 capitalize">via {booking.payment.payment_method}</p>
                        </div>
                      </div>
                      {booking.payment.paid_at && (
                        <p className="text-xs text-green-600 mt-2">
                          Paid on {formatDateTime(booking.payment.paid_at)}
                        </p>
                      )}
                      {booking.payment.transaction_id && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-xs text-green-600">Transaction ID</p>
                          <p className="text-sm font-mono text-green-800">{booking.payment.transaction_id.substring(0, 12)}...</p>
                        </div>
                      )}
                    </div>
                  ) : isPaymentRequired() ? (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <AiOutlineDollarCircle className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-amber-800">Payment Required</p>
                            <p className="text-sm text-amber-700">Complete your payment to finish this booking</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                      >
                        <MdPayment className="w-5 h-5" />
                        Pay Now
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-gray-600">Payment will be required after service completion</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline/History */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Timeline</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Booking Created</p>
                      <p className="text-sm text-gray-500">{formatDateTime(booking.created_at)}</p>
                    </div>
                  </div>
                  {booking.confirmed_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Confirmed</p>
                        <p className="text-sm text-gray-500">{formatDateTime(booking.confirmed_at)}</p>
                      </div>
                    </div>
                  )}
                  {booking.completed_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MdCheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Completed</p>
                        <p className="text-sm text-gray-500">{formatDateTime(booking.completed_at)}</p>
                      </div>
                    </div>
                  )}
                  {isPaymentCompleted() && booking.payment?.paid_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MdReceipt className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Payment Received</p>
                        <p className="text-sm text-gray-500">{formatDateTime(booking.payment.paid_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    to="/my-bookings"
                    className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <MdArrowBack className="w-4 h-4" />
                    All Bookings
                  </Link>
                  {booking.provider?.phone && (
                    <a
                      href={`tel:${booking.provider.phone}`}
                      className="w-full py-2.5 px-4 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <MdPhone className="w-4 h-4" />
                      Call Provider
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        booking={booking}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={(error) => {
          console.error('Payment error:', error);
          addToast(error.message || 'Payment failed', 'error');
        }}
      />
    </DashboardLayout>
  );
}
