import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import paymentsService from '../../services/paymentsService';

/**
 * EsewaSuccess Page
 * 
 * Handles eSewa payment success callback
 * Query params from eSewa: oid, amt, refId
 */
const EsewaSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your payment...');
  const [transactionData, setTransactionData] = useState(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Extract query parameters from eSewa callback
      const oid = searchParams.get('oid');
      const amt = searchParams.get('amt');
      const refId = searchParams.get('refId');

      if (!oid || !amt || !refId) {
        setStatus('error');
        setMessage('Invalid payment callback. Missing required parameters.');
        return;
      }

      // Call backend to verify payment
      const response = await paymentsService.verifyEsewaPayment({
        oid,
        amt,
        refId,
      });

      if (response.success) {
        setStatus('success');
        setMessage('Payment verified successfully!');
        setTransactionData(response.transaction);

        // Redirect to booking details after 3 seconds
        setTimeout(() => {
          if (response.transaction?.booking) {
            navigate(`/dashboard/bookings/${response.transaction.booking}`);
          } else {
            navigate('/dashboard/bookings');
          }
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to verify payment. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="mb-6">
              <svg className="animate-spin mx-auto h-16 w-16 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Please wait, do not close this window...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            {transactionData && (
              <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">NPR {transactionData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference ID:</span>
                    <span className="font-mono text-xs">{searchParams.get('refId')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-xs">{transactionData.transaction_uid}</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500">Redirecting to your booking...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard/bookings')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to My Bookings
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EsewaSuccess;
