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

  // ==================== PAYMENT INITIATION ====================

  /**
   * Initiate payment for a booking
   * @param {Object} paymentData - Payment initiation data
   * @param {number} paymentData.booking_id - Booking ID
   * @param {string} paymentData.payment_method - 'khalti' | 'cash'
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

  // ==================== PAYMENT VERIFICATION ====================

  /**
   * Verify Khalti payment after redirect from Khalti (ePayment API)
   * @param {Object} verificationData
   * @param {string} verificationData.pidx - Khalti payment ID from redirect
   * @param {string} verificationData.transaction_uid - Our transaction UUID (optional)
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

  // ==================== CASH PAYMENT ====================

  /**
   * Provider confirms cash payment received for a booking
   * @param {number} bookingId - Booking ID
   * @returns {Promise} Confirmation response
   */
  confirmCashPayment: async (bookingId) => {
    try {
      const response = await api.post('/payments/cash/confirm/', {
        booking_id: bookingId,
      });
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

  // ==================== PROVIDER EARNINGS ====================

  /**
   * Get provider earnings history (paginated, filterable)
   * @param {Object} filters - Optional filters
   * @param {string} filters.period - 'this_week' | 'this_month' | 'last_month' | 'this_year'
   * @param {string} filters.status - 'pending' | 'completed' | 'failed'
   * @param {string} filters.payment_method - 'khalti' | 'cash'
   * @param {number} filters.page - Page number
   * @param {number} filters.page_size - Items per page
   * @returns {Promise} Paginated earnings list
   */
  getProviderEarningsHistory: async (filters = {}) => {
    try {
      const params = {};
      if (filters.period) params.period = filters.period;
      if (filters.status) params.status = filters.status;
      if (filters.payment_method) params.payment_method = filters.payment_method;
      params.page = filters.page ?? 1;
      params.page_size = filters.page_size ?? 50;
      const response = await api.get('/payments/provider/earnings/history/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get provider earnings stats with period filter
   * @param {string} period - 'this_week' | 'this_month' | 'last_month' | 'this_year'
   * @returns {Promise} Earnings stats object
   */
  getProviderEarningsStats: async (period) => {
    try {
      const params = {};
      if (period) params.period = period;
      const response = await api.get('/payments/provider/earnings/stats/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default paymentsService;
