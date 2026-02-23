import api from '../api/axios';

const paymentsService = {
  // ==================== PAYMENT CONFIGURATION ====================

  /**
   * Get Khalti public key (no auth required)
   * @returns {Promise} Khalti configuration
   */
  getKhaltiConfig: async () => {
    try {
      const response = await api.get('/payments/khalti/public-key/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get eSewa configuration (no auth required)
   * @returns {Promise} eSewa configuration
   */
  getEsewaConfig: async () => {
    try {
      const response = await api.get('/payments/esewa/info/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ==================== PAYMENT INITIATION ====================

  /**
   * Initiate payment for a booking
   * @param {Object} paymentData - Payment initiation data
   * @param {number} paymentData.booking_id - Booking ID
   * @param {string} paymentData.payment_method - 'khalti' | 'esewa' | 'cash'
   * @param {string} paymentData.return_url - Success return URL
   * @param {string} paymentData.failure_url - Failure return URL
   * @returns {Promise} Payment initiation response
   */
  initiatePayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/initiate/', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Initiate eSewa payment specifically (alternative endpoint)
   * @param {Object} paymentData
   * @returns {Promise} eSewa payment data with form parameters
   */
  initiateEsewaPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/esewa/initiate/', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ==================== PAYMENT VERIFICATION ====================

  /**
   * Verify Khalti payment after widget completion
   * @param {Object} verificationData
   * @param {string} verificationData.token - Khalti token
   * @param {number} verificationData.amount - Amount in paisa
   * @param {string} verificationData.transaction_uid - Transaction UUID
   * @returns {Promise} Verification response
   */
  verifyKhaltiPayment: async (verificationData) => {
    try {
      const response = await api.post('/payments/khalti/verify/', verificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Verify eSewa payment after redirect callback
   * @param {Object} queryParams - Query parameters from eSewa
   * @param {string} queryParams.oid - Transaction UUID
   * @param {string} queryParams.amt - Amount
   * @param {string} queryParams.refId - eSewa reference ID
   * @returns {Promise} Verification response
   */
  verifyEsewaPayment: async (queryParams) => {
    try {
      const params = new URLSearchParams(queryParams).toString();
      const response = await api.get(`/payments/esewa/verify/?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ==================== PAYMENT HISTORY & STATUS ====================

  /**
   * Get payment history for current user
   * @param {Object} filters - Optional filters
   * @returns {Promise} Payment history
   */
  getPaymentHistory: async (filters = {}) => {
    try {
      const params = {
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 20,
        status: filters.status,
      };
      const response = await api.get('/payments/history/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get bookings with pending payments
   * @returns {Promise} List of bookings needing payment
   */
  getPendingPayments: async () => {
    try {
      const response = await api.get('/payments/pending/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get transaction details
   * @param {string} transactionUid - Transaction UUID
   * @returns {Promise} Transaction details
   */
  getTransactionDetail: async (transactionUid) => {
    try {
      const response = await api.get(`/payments/transactions/${transactionUid}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default paymentsService;
