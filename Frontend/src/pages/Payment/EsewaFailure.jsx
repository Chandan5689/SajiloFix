import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * EsewaFailure Page
 * 
 * Handles eSewa payment failure callback
 */
const EsewaFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard/bookings');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
          <p className="text-gray-600 mb-6">
            Your eSewa payment was cancelled or failed. No charges have been made to your account.
          </p>

          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              If you experienced any issues, please contact our support team.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/bookings')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to My Bookings
            </button>
            <button
              onClick={() => navigate(-2)}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Redirecting to bookings in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default EsewaFailure;
