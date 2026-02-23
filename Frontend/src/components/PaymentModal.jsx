import { useState } from 'react';
import { Modal } from './Modal';
import KhaltiPayment from './KhaltiPayment';
import EsewaPayment from './EsewaPayment';
import paymentsService from '../services/paymentsService';

/**
 * PaymentModal Component
 * 
 * Unified payment modal that allows user to choose between payment methods
 * 
 * Props:
 * - isOpen: Whether modal is open
 * - onClose: Callback when modal is closed
 * - booking: Booking object with details
 * - onPaymentSuccess: Callback when payment succeeds
 * - onPaymentError: Callback when payment fails
 */
const PaymentModal = ({ isOpen, onClose, booking, onPaymentSuccess, onPaymentError }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cashLoading, setCashLoading] = useState(false);
  const [cashError, setCashError] = useState(null);

  if (!booking) return null;

  const amount = booking.final_price || booking.quoted_price || 0;
  const serviceName = booking.service?.title || booking.service?.specialization?.name || 'Service';

  const handlePaymentSuccess = (response) => {
    console.log('Payment successful:', response);
    setShowSuccess(true);
    setSuccessMessage('Payment completed successfully! Redirecting...');
    
    // Call parent callback
    onPaymentSuccess && onPaymentSuccess(response);
    
    // Close modal and redirect after delay
    setTimeout(() => {
      onClose();
      // Redirect to my bookings page
      window.location.href = '/my-bookings';
    }, 2000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    onPaymentError && onPaymentError(error);
  };

  const handlePaymentClose = () => {
    console.log('Payment cancelled by user');
    // Don't close the modal, just reset selection
    setSelectedMethod(null);
  };

  const handleEsewaInitiate = (response) => {
    console.log('eSewa payment initiated, redirecting...');
    // User will be redirected, so we can close the modal
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
      <div className="payment-modal p-6">
        {showSuccess ? (
          // Success Message
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600">{successMessage}</p>
          </div>
        ) : (
          <>
            {/* Payment Details */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium">#{booking.id}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-semibold">Amount to Pay:</span>
                  <span className="text-xl font-bold text-green-600">NPR {amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {!selectedMethod ? (
              <div className="payment-methods">
                <h3 className="font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
                
                <div className="space-y-3">
                  {/* Khalti Option */}
                  <button
                    onClick={() => setSelectedMethod('khalti')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Khalti</div>
                          <div className="text-sm text-gray-500">Digital Wallet</div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* eSewa Option */}
                  <button
                    onClick={() => setSelectedMethod('esewa')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">eSewa</div>
                          <div className="text-sm text-gray-500">Digital Wallet</div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Cash Option (Optional) */}
                  <button
                    onClick={() => setSelectedMethod('cash')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Cash</div>
                          <div className="text-sm text-gray-500">Pay on Service</div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Back Button */}
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to payment methods
                </button>

                {/* Selected Payment Method */}
                <div className="payment-component">
                  {selectedMethod === 'khalti' && (
                    <KhaltiPayment
                      bookingId={booking.id}
                      amount={amount}
                      productName={serviceName}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onClose={handlePaymentClose}
                    />
                  )}

                  {selectedMethod === 'esewa' && (
                    <EsewaPayment
                      bookingId={booking.id}
                      amount={amount}
                      onInitiate={handleEsewaInitiate}
                      onError={handlePaymentError}
                    />
                  )}

                  {selectedMethod === 'cash' && (
                    <div className="text-center py-4">
                      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold text-amber-800">Cash Payment</span>
                        </div>
                        <p className="text-sm text-amber-700">
                          Pay <span className="font-bold">NPR {amount.toLocaleString()}</span> directly to the provider after service completion.
                          The provider will confirm receipt of payment.
                        </p>
                      </div>
                      {cashError && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          {cashError}
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            setCashLoading(true);
                            setCashError(null);
                            await paymentsService.initiatePayment({
                              booking_id: booking.id,
                              payment_method: 'cash',
                            });
                            setShowSuccess(true);
                            setSuccessMessage('Cash payment registered! Please pay the provider after service completion.');
                            onPaymentSuccess && onPaymentSuccess({ payment_method: 'cash' });
                            setTimeout(() => {
                              onClose();
                              window.location.href = '/my-bookings';
                            }, 2000);
                          } catch (err) {
                            console.error('Cash payment initiation failed:', err);
                            setCashError(err?.message || 'Failed to register cash payment. Please try again.');
                          } finally {
                            setCashLoading(false);
                          }
                        }}
                        disabled={cashLoading}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cashLoading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                          </span>
                        ) : 'Confirm Cash Payment'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Security Notice */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p>Your payment is secure and encrypted. We never store your card details.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;
