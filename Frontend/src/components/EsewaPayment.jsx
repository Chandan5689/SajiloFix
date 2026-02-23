import { useState, useEffect, useRef } from 'react';
import paymentsService from '../services/paymentsService';

/**
 * EsewaPayment Component
 * 
 * Handles eSewa payment integration using form POST redirect
 * 
 * Props:
 * - bookingId: Booking ID to pay for
 * - amount: Amount in NPR
 * - onInitiate: Callback when payment is initiated (before redirect)
 * - onError: Callback when payment initiation fails
 */
const EsewaPayment = ({ bookingId, amount, onInitiate, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [esewaConfig, setEsewaConfig] = useState(null);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    loadEsewaConfig();
  }, []);

  const loadEsewaConfig = async () => {
    try {
      const config = await paymentsService.getEsewaConfig();
      setEsewaConfig(config);
    } catch (err) {
      console.error('Failed to load eSewa config:', err);
      setError('eSewa payment is not available at the moment');
    }
  };

  const initiateEsewaPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Initiate payment on our backend
      const currentUrl = window.location.origin;
      const initiateData = {
        booking_id: bookingId,
        payment_method: 'esewa',
        return_url: `${currentUrl}/payment/esewa/success`,
        failure_url: `${currentUrl}/payment/esewa/failure`,
      };

      console.log('Initiating eSewa payment with data:', initiateData);
      const response = await paymentsService.initiatePayment(initiateData);
      console.log('eSewa initiate response:', response);

      if (!response.success) {
        throw new Error(response.message || 'Failed to initiate payment');
      }

      // Notify parent component
      onInitiate && onInitiate(response);

      // Step 2: Create and submit form to redirect to eSewa
      const paymentData = response.payment_data;
      const paymentUrl = response.payment_url;

      if (!paymentData || !paymentUrl) {
        throw new Error('Invalid payment data received');
      }

      console.log('eSewa Payment URL:', paymentUrl);
      console.log('eSewa Payment Data:', paymentData);

      // Create form dynamically
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl;

      // Add form fields from payment data
      Object.keys(paymentData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentData[key];
        form.appendChild(input);
        console.log(`eSewa form field: ${key} = ${paymentData[key]}`);
      });

      // Append to body and submit
      document.body.appendChild(form);
      console.log('Submitting form to eSewa...');
      console.log('Form HTML:', form.outerHTML);
      
      // Display form in a modal for debugging (optional - comment out in production)
      const debugInfo = `
        eSewa Payment Form Debug:
        URL: ${paymentUrl}
        Amount: ${paymentData.amt}
        Product ID: ${paymentData.pid}
        Merchant Code: ${paymentData.scd}
        Success URL: ${paymentData.su}
        Failure URL: ${paymentData.fu}
      `;
      console.log(debugInfo);
      
      // Check if we should open in new tab (useful for debugging)
      const openInNewTab = false; // Set to true for debugging
      
      if (openInNewTab) {
        // Create a visible form for debugging
        form.target = '_blank';
        form.style.display = 'block';
        form.innerHTML += '<button type="submit" style="padding: 10px; background: green; color: white;">Submit to eSewa</button>';
        document.body.appendChild(form);
        return; // Don't auto-submit
      }
      
      // Add a small delay to see console logs before redirect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      form.submit();

      // Note: User will be redirected to eSewa, so loading state will persist

    } catch (err) {
      console.error('Error initiating eSewa payment:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        data: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment');
      setIsLoading(false);
      onError && onError(err);
    }
  };

  return (
    <div className="esewa-payment">
      <button
        onClick={initiateEsewaPayment}
        disabled={isLoading || !esewaConfig}
        className="btn btn-success w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Redirecting to eSewa...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Pay with eSewa</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {esewaConfig?.is_test_mode && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          ⚠️ Test Mode: You'll be redirected to eSewa test gateway
        </div>
      )}

      {/* Hidden form for eSewa (alternative approach) */}
      <form ref={formRef} method="POST" style={{ display: 'none' }}>
        {/* Form fields will be added dynamically */}
      </form>
    </div>
  );
};

export default EsewaPayment;
