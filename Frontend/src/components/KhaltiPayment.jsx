import { useState, useEffect } from 'react';
import paymentsService from '../services/paymentsService';

/**
 * KhaltiPayment Component
 * 
 * Handles Khalti payment integration using the new ePayment API (redirect flow)
 * 
 * Flow:
 * 1. User clicks "Pay with Khalti"
 * 2. Backend initiates payment with Khalti ePayment API
 * 3. User is redirected to Khalti's payment page
 * 4. After payment, Khalti redirects back to our callback URL
 * 5. Callback page verifies payment with backend
 * 
 * Props:
 * - bookingId: Booking ID to pay for
 * - amount: Amount in NPR (for display only, backend fetches actual amount)
 * - productName: Service name (optional, for display)
 * - onSuccess: Callback when payment redirect is initiated
 * - onError: Callback when payment initiation fails
 */
const KhaltiPayment = ({ bookingId, amount, productName, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [khaltiConfig, setKhaltiConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadKhaltiConfig();
  }, []);

  const loadKhaltiConfig = async () => {
    try {
      console.log('Loading Khalti config...');
      const config = await paymentsService.getKhaltiConfig();
      console.log('Khalti config loaded:', config);
      setKhaltiConfig(config);
    } catch (err) {
      console.error('Failed to load Khalti config:', err);
      setError('Khalti payment is not available at the moment');
    }
  };

  const initiateKhaltiPayment = async () => {
    if (!khaltiConfig?.public_key) {
      setError('Khalti configuration not loaded');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build callback URL for Khalti to redirect after payment
      const currentUrl = window.location.origin;
      const callbackUrl = `${currentUrl}/payment/khalti/callback`;
      
      // Step 1: Initiate payment on our backend
      console.log('Initiating Khalti payment on backend...');
      const initiateData = {
        booking_id: bookingId,
        payment_method: 'khalti',
        return_url: callbackUrl,
        failure_url: `${currentUrl}/payment/failure`,
      };

      console.log('Initiate data:', initiateData);
      const response = await paymentsService.initiatePayment(initiateData);
      console.log('Khalti initiate response:', response);

      if (!response.success) {
        throw new Error(response.message || 'Failed to initiate payment');
      }

      // Step 2: Redirect to Khalti payment page
      const paymentUrl = response.payment_url;
      
      if (!paymentUrl) {
        throw new Error('No payment URL received from Khalti');
      }

      console.log('Redirecting to Khalti payment page:', paymentUrl);
      
      // Store transaction info for verification after redirect
      sessionStorage.setItem('khalti_pidx', response.pidx);
      sessionStorage.setItem('khalti_transaction_uid', response.transaction.transaction_uid);
      sessionStorage.setItem('khalti_booking_id', bookingId.toString());
      
      // Notify parent before redirect
      onSuccess && onSuccess({ 
        transaction: response.transaction,
        redirecting: true 
      });
      
      // Redirect to Khalti
      window.location.href = paymentUrl;

    } catch (err) {
      console.error('Error initiating Khalti payment:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        data: err.response?.data
      });
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment');
      onError && onError(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="khalti-payment">
      <button
        onClick={initiateKhaltiPayment}
        disabled={isLoading || !khaltiConfig}
        className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-white font-medium"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Redirecting to Khalti...</span>
          </>
        ) : (
          <>
            {/* Khalti Logo */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span>Pay with Khalti</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {khaltiConfig?.is_test_mode && (
        <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
          <strong>🧪 Test Mode</strong>
          <p className="mt-1">Use these test credentials on Khalti:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Mobile: <code className="bg-purple-100 px-1 rounded">9800000000</code> - <code className="bg-purple-100 px-1 rounded">9800000005</code></li>
            <li>MPIN: <code className="bg-purple-100 px-1 rounded">1111</code></li>
            <li>OTP: <code className="bg-purple-100 px-1 rounded">987654</code></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default KhaltiPayment;
