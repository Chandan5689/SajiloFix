import api from '../api/axios';

const providersService = {
  /**
   * Get list of all service providers with optional filters
   * @param {Object} filters - Optional filters (specialization, city, district, q)
   * @returns {Promise} Array of providers with stats
   */
  getProviders: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(
        `/bookings/providers/${params ? '?' + params : ''}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get detailed information about a specific provider
   * @param {number} providerId
   * @returns {Promise} Provider object with services
   */
  getProviderDetail: async (providerId) => {
    try {
      const response = await api.get(`/bookings/providers/${providerId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get provider's availability schedule
   * @param {number} providerId
   * @returns {Promise} Provider availability with weekly schedule
   */
  getProviderAvailability: async (providerId) => {
    try {
      const response = await api.get(`/bookings/providers/${providerId}/availability/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get provider's booked time slots for a specific date
   * @param {number} providerId
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} Object with booked slots
   */
  getProviderBookedSlots: async (providerId, date) => {
    try {
      const response = await api.get(`/bookings/providers/${providerId}/booked-slots/?date=${date}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default providersService;
