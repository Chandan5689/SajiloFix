import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import paymentsService from '../../services/paymentsService';

/**
 * KhaltiCallback Page
 * 
 * Handles Khalti payment callback after redirect from Khalti
 * 
 * Khalti redirects with query params:
 * - pidx: Payment ID
 * - transaction_id: Khalti's transaction ID (on success)
 * - tidx: Transaction index
 * - amount: Amount in paisa
 * - total_amount: Total amount
 * - mobile: Customer mobile (if available)
 * - status: Payment status
 * - purchase_order_id: Our order ID
 * - purchase_order_name: Order name
 */
const KhaltiCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your payment...');
  const [transactionData, setTransactionData] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [progress, setProgress] = useState(0);
  const verificationAttempted = useRef(false); // Prevent duplicate verification

  useEffect(() => {
    // Prevent duplicate verification calls
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;
    
    verifyPayment();
  }, []);

  // Progress animation
  useEffect(() => {
    if (status === 'verifying') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [status]);

  const verifyPayment = async () => {
    try {
      // Extract query parameters from Khalti callback
      const pidx = searchParams.get('pidx');
      const transactionId = searchParams.get('transaction_id');
      const khaltiStatus = searchParams.get('status');
      const amount = searchParams.get('amount');
      const purchaseOrderId = searchParams.get('purchase_order_id');

      console.log('Khalti callback params:', {
        pidx,
        transactionId,
        status: khaltiStatus,
        amount,
        purchaseOrderId
      });

      // Also check sessionStorage for transaction info
      const storedPidx = sessionStorage.getItem('khalti_pidx');
      const storedTransactionUid = sessionStorage.getItem('khalti_transaction_uid');
      const storedBookingId = sessionStorage.getItem('khalti_booking_id');

      console.log('Stored transaction info:', {
        storedPidx,
        storedTransactionUid,
        storedBookingId
      });

      // Use pidx from URL or sessionStorage
      const verifyPidx = pidx || storedPidx;

      if (!verifyPidx) {
        setStatus('error');
        setMessage('Invalid payment callback. Missing payment reference.');
        setErrorDetails('No payment ID (pidx) found. Please try again or contact support.');
        return;
      }

      // Check if Khalti indicates a failure
      if (khaltiStatus && khaltiStatus.toLowerCase() !== 'completed') {
        setStatus('error');
        setMessage(getStatusMessage(khaltiStatus));
        setErrorDetails(`Payment was ${khaltiStatus.toLowerCase()}. No amount has been deducted from your account.`);
        
        // Clear session storage
        clearSessionStorage();
        return;
      }

      // Call backend to verify payment
      setMessage('Confirming payment with Khalti...');
      
      const response = await paymentsService.verifyKhaltiPayment({
        pidx: verifyPidx,
        transaction_uid: storedTransactionUid
      });

      console.log('Verification response:', response);

      if (response.success) {
        setStatus('success');
        setMessage('Payment completed successfully!');
        setTransactionData(response.transaction);

        // Clear session storage
        clearSessionStorage();

        // Redirect to my bookings after 4 seconds
        setTimeout(() => {
          navigate('/my-bookings', { 
            state: { paymentSuccess: true } 
          });
        }, 4000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Payment verification failed');
        setErrorDetails('The payment could not be verified. If amount was deducted, please contact support with your transaction details.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('error');
      
      // Better error messages based on error type
      const errorMsg = error?.message || error?.detail || 'Failed to verify payment';
      setMessage(errorMsg);
      setErrorDetails('If your payment was successful but verification failed, please contact support. Your payment is safe.');
    }
  };

  const clearSessionStorage = () => {
    sessionStorage.removeItem('khalti_pidx');
    sessionStorage.removeItem('khalti_transaction_uid');
    sessionStorage.removeItem('khalti_booking_id');
  };

  const getStatusMessage = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'user canceled':
      case 'canceled':
        return 'Payment was cancelled';
      case 'expired':
        return 'Payment session expired';
      case 'refunded':
        return 'Payment was refunded';
      case 'pending':
        return 'Payment is still pending';
      default:
        return `Payment ${status}`;
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Khalti branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-3">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1 className="text-sm font-medium text-purple-600">Khalti Payment</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Progress bar */}
          {status === 'verifying' && (
            <div className="mb-6">
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center">
              <div className="mb-6 relative">
                <div className="w-20 h-20 mx-auto">
                  <svg className="animate-spin w-full h-full text-purple-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secure verification in progress...</span>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">{message}</p>

              {transactionData && (
                <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-5 mb-6 text-left border border-green-100">
                  <div className="text-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="text-xl font-bold text-green-700">NPR {formatAmount(transactionData.amount)}</span>
                    </div>
                    <div className="border-t border-green-200 pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-xs">Transaction ID</span>
                        <span className="font-mono text-xs text-gray-700">{transactionData.transaction_uid?.substring(0, 12)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-xs">Payment Method</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span className="text-xs font-medium text-purple-700">Khalti</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-xs">Status</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Redirecting to your bookings...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h2>
              <p className="text-gray-600 mb-4">{message}</p>

              {errorDetails && (
                <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left border border-amber-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-amber-800">{errorDetails}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const storedBookingId = sessionStorage.getItem('khalti_booking_id');
                    if (storedBookingId) {
                      navigate(`/dashboard/bookings/${storedBookingId}`);
                    } else {
                      navigate('/dashboard/bookings');
                    }
                  }}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium shadow-lg shadow-purple-200"
                >
                  Go to My Bookings
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Try Again
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Need help? Contact us at{' '}
                  <a href="mailto:support@sajilofix.com" className="text-purple-600 hover:underline">
                    support@sajilofix.com
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KhaltiCallback;
