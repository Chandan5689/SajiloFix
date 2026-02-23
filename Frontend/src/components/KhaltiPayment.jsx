import { useState, useEffect } from 'react';
import paymentsService from '../services/paymentsService';

/**
 * KhaltiPayment Component
 * 
 * Handles Khalti payment integration using Khalti Checkout SDK
 * 
 * Props:
 * - bookingId: Booking ID to pay for
 * - amount: Amount in NPR (will be converted to paisa)
 * - productName: Service name
 * - onSuccess: Callback when payment succeeds
 * - onError: Callback when payment fails
 * - onClose: Callback when payment is closed/cancelled
 */
const KhaltiPayment = ({ bookingId, amount, productName, onSuccess, onError, onClose }) => {
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
      // Step 1: Initiate payment on our backend
      console.log('Step 1: Initiating Khalti payment on backend...');
      const currentUrl = window.location.origin;
      const initiateData = {
        booking_id: bookingId,
        payment_method: 'khalti',
        return_url: `${currentUrl}/payment/success`,
        failure_url: `${currentUrl}/payment/failure`,
      };

      console.log('Initiate data:', initiateData);
      const initResponse = await paymentsService.initiatePayment(initiateData);
      console.log('Initiate response:', initResponse);

      if (!initResponse.success) {
        throw new Error(initResponse.message || 'Failed to initiate payment');
      }

      // Step 2: Load Khalti Checkout SDK
      console.log('Step 2: Loading Khalti SDK...');
      if (!window.KhaltiCheckout) {
        await loadKhaltiSDK();
        console.log('Khalti SDK loaded successfully');
      } else {
        console.log('Khalti SDK already loaded');
      }

      // Step 3: Configure Khalti Checkout
      console.log('Step 3: Configuring Khalti checkout...');
      
      // Log the public key to verify format
      console.log('Public key from backend:', initResponse.khalti_public_key);
      console.log('Public key type:', typeof initResponse.khalti_public_key);
      console.log('Public key length:', initResponse.khalti_public_key?.length);
      
      const config = {
        publicKey: initResponse.khalti_public_key,
        productIdentity: initResponse.product_identity || `booking_${bookingId}`,
        productName: productName || initResponse.product_name,
        productUrl: initResponse.product_url || window.location.href,
        amount: initResponse.amount, // Already in paisa from backend
        
        // Event handlers
        eventHandler: {
          onSuccess: async (payload) => {
            console.log('Step 4: Khalti payment success callback:', payload);
            
            try {
              // Verify payment on our backend
              const verifyData = {
                token: payload.token,
                amount: payload.amount, // Amount in paisa
                transaction_uid: initResponse.transaction.transaction_uid,
              };

              console.log('Verifying payment with backend:', verifyData);
              const verifyResponse = await paymentsService.verifyKhaltiPayment(verifyData);
              console.log('Verification response:', verifyResponse);

              if (verifyResponse.success) {
                console.log('Payment verified successfully!');
                onSuccess && onSuccess(verifyResponse);
              } else {
                console.error('Payment verification failed:', verifyResponse.message);
                onError && onError(new Error(verifyResponse.message || 'Payment verification failed'));
              }
            } catch (err) {
              console.error('Payment verification error:', err);
              onError && onError(err);
            }
          },
          
          onError: (error) => {
            console.error('Khalti payment error callback:', error);
            onError && onError(error);
          },
          
          onClose: () => {
            console.log('Khalti payment widget closed by user');
            setIsLoading(false);
            onClose && onClose();
          },
        },
      };

      console.log('Khalti config:', config);

      // Step 5: Open Khalti checkout
      console.log('Step 5: Opening Khalti checkout widget...');
      const checkout = new window.KhaltiCheckout(config);
      checkout.show({ amount: initResponse.amount });
      console.log('Khalti checkout widget opened');

    } catch (err) {
      console.error('Error initiating Khalti payment:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        data: err.response?.data
      });
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment');
      onError && onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadKhaltiSDK = () => {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.getElementById('khalti-sdk')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'khalti-sdk';
      script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/khalti-checkout.iffe.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Khalti SDK'));
      document.body.appendChild(script);
    });
  };

  return (
    <div className="khalti-payment">
      <button
        onClick={initiateKhaltiPayment}
        disabled={isLoading || !khaltiConfig}
        className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
              <path d="M16 11h-3V8h-2v3H8v2h3v3h2v-3h3z"/>
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
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          ⚠️ Test Mode: Use Khalti test credentials
        </div>
      )}
    </div>
  );
};

export default KhaltiPayment;
