import api from '../api/axios';

const bookingsService = {
  // ==================== CUSTOMER BOOKINGS ====================

  /**
   * Fetch all bookings for the current customer
   * @param {Object} filters - Optional filters (status, date_from, date_to, etc.)
   * @returns {Promise} Array of bookings
   */
  getMyBookings: async (filters = {}) => {
    try {
      const params = {
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 20,
        ...filters,
      };
      const response = await api.get('/bookings/my-bookings/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get a specific booking with full details and images
   * @param {number} bookingId
   * @returns {Promise} Booking object with nested images
   */
  getBookingDetail: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/bookings/${bookingId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new booking for a service
   * @param {Object} bookingData - Booking details
   * @returns {Promise} Created booking
   */
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings/bookings/create/', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Cancel a booking
   * @param {number} bookingId
   * @param {string} reason - Cancellation reason
   * @returns {Promise} Updated booking
   */
  cancelBooking: async (bookingId, reason = '') => {
    try {
      const response = await api.post(`/bookings/bookings/${bookingId}/cancel/`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Upload images for a booking (before/during/after)
   * @param {number} bookingId
   * @param {string} imageType - 'before', 'during', or 'after'
   * @param {File[]} files - Image files
   * @param {string} description - Optional image description
   * @returns {Promise} Array of uploaded image objects
   */
  uploadBookingImages: async (bookingId, imageType, files, description = '') => {
    try {
      const formData = new FormData();
      formData.append('image_type', imageType);
      formData.append('description', description);
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post(`/bookings/bookings/${bookingId}/images/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ==================== CUSTOMER PAYMENTS & REVIEWS ====================

  /**
   * Get payment history for the customer
   * @returns {Promise} Array of payments
   */
  getPayments: async () => {
    try {
      const response = await api.get('/bookings/payments/my/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a review for a completed booking
   * @param {number} bookingId
   * @param {Object} reviewData - { rating, title, comment, would_recommend }
   * @returns {Promise} Created review
   */
  createReview: async (bookingId, reviewData) => {
    try {
      const response = await api.post(`/bookings/bookings/${bookingId}/review/create/`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ==================== PROVIDER BOOKINGS ====================

  /**
   * Fetch all bookings for the current provider
   * @returns {Promise} Array of provider's bookings
   */
  getProviderBookings: async (filters = {}) => {
    try {
      const params = {
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 20,
        ...filters,
      };
      const response = await api.get('/bookings/provider-bookings/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Accept a pending booking
   * @param {number} bookingId
   * @returns {Promise} Updated booking
   */
  acceptBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/bookings/${bookingId}/accept/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Decline a pending booking
   * @param {number} bookingId
   * @param {string} reason - Decline reason
   * @returns {Promise} Updated booking
   */
  declineBooking: async (bookingId, reason = '') => {
    try {
      const response = await api.post(`/bookings/bookings/${bookingId}/decline/`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Schedule a confirmed booking
   * @param {number} bookingId
   * @param {string} scheduledDate - Date (YYYY-MM-DD)
   * @param {string} scheduledTime - Time (HH:MM:SS)
   * @returns {Promise} Updated booking
   */
  scheduleBooking: async (bookingId, scheduledDate, scheduledTime) => {
    try {
      const response = await api.post(`/bookings/bookings/${bookingId}/schedule/`, {
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Start work on a booking
   * @param {number} bookingId
   * @returns {Promise} Updated booking
   */
  startBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/bookings/${bookingId}/start/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Complete a booking
   * @param {number} bookingId
   * @param {number} finalPrice - Optional final price in NRS
   * @returns {Promise} Updated booking
   */
  completeBooking: async (bookingId, finalPrice = null) => {
    try {
      const payload = finalPrice ? { final_price: finalPrice } : {};
      const response = await api.post(`/bookings/bookings/${bookingId}/complete/`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * @deprecated The approve-completion endpoint has been removed.
   * Bookings are now completed directly by the provider.
   * Customer can only dispute a completed booking.
   */
  approveCompletion: async (bookingId, note = '') => {
    console.warn('approveCompletion is deprecated. Bookings complete directly now.');
    throw new Error('Approve completion has been removed. Bookings are completed directly by the provider.');
  },

  /**
   * Customer disputes booking completion
   * @param {number} bookingId
   * @param {string} reason - Dispute reason
   * @param {string} note - Additional dispute note
   * @returns {Promise} Updated booking
   */
  disputeBooking: async (bookingId, reason = '', note = '') => {
    try {
      const response = await api.post(`/bookings/bookings/${bookingId}/dispute/`, {
        reason,
        note,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get provider earnings summary
   * @returns {Promise} Earnings data {total_earnings_nrs, total_paid_jobs}
   */
  getEarnings: async () => {
    try {
      const response = await api.get('/bookings/payments/provider/earnings/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get reviews received by the provider
   * @returns {Promise} Array of reviews
   */
  getProviderReviews: async (filters = {}) => {
    try {
      const params = {
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 20,
        ...filters,
      };
      const response = await api.get('/bookings/reviews/my/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMyCustomerReviews: async (filters = {}) => {
    try {
      const params = {
        page: filters.page ?? 1,
        page_size: filters.page_size ?? 20,
        ...filters,
      };
      const response = await api.get('/bookings/reviews/my-submitted/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getUserDashboardStats: async () => {
    try {
      const response = await api.get('/bookings/dashboard/stats/user/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProviderDashboardStats: async () => {
    try {
      const response = await api.get('/bookings/dashboard/stats/provider/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Provider responds to a review
   * @param {number} reviewId
   * @param {string} providerResponse
   * @returns {Promise} Updated review
   */
  respondToReview: async (reviewId, providerResponse) => {
    try {
      const response = await api.post(`/bookings/reviews/${reviewId}/respond/`, {
        provider_response: providerResponse,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ==================== SERVICES ====================

  /**
   * Get provider's services
   * @param {boolean} active - Filter by active status (optional)
   * @returns {Promise} Array of services
   */
  getMyServices: async (active = null) => {
    try {
      let url = '/bookings/services/my/';
      if (active !== null) {
        url += `?active=${active}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new service
   * @param {Object} serviceData - Service details
   * @returns {Promise} Created service
   */
  createService: async (serviceData) => {
    try {
      const response = await api.post('/bookings/services/create/', serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update a service
   * @param {number} serviceId
   * @param {Object} serviceData - Updated service details
   * @returns {Promise} Updated service
   */
  updateService: async (serviceId, serviceData) => {
    try {
      const response = await api.patch(`/bookings/services/${serviceId}/update/`, serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Toggle service active status
   * @param {number} serviceId
   * @param {boolean} isActive - Optional explicit value (else toggles)
   * @returns {Promise} Updated service
   */
  toggleService: async (serviceId, isActive = null) => {
    try {
      const payload = isActive !== null ? { is_active: isActive } : {};
      const response = await api.post(`/bookings/services/${serviceId}/toggle/`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a service (only if no active bookings)
   * @param {number} serviceId
   * @returns {Promise} Deletion confirmation
   */
  deleteService: async (serviceId) => {
    try {
      const response = await api.delete(`/bookings/services/${serviceId}/delete/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Search public services (customer-facing)
   * @param {Object} filters - Query filters (q, specialization, city, district, price_type, emergency, min_price, max_price)
   * @returns {Promise} Array of services
   */
  searchServices: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/bookings/services/${params ? '?' + params : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get service detail
   * @param {number} serviceId
   * @returns {Promise} Service object with provider info
   */
  getServiceDetail: async (serviceId) => {
    try {
      const response = await api.get(`/bookings/services/${serviceId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // ==================== BOOKING CONFLICT DETECTION ====================

  /**
   * Check for booking conflicts before creating a booking
   * @param {number} providerId
   * @param {string} preferredDate - YYYY-MM-DD
   * @param {string} preferredTime - Optional HH:MM:SS
   * @param {number} serviceId - Optional
   * @returns {Promise} Conflict check result with warnings/suggestions
   */
  checkBookingConflict: async (providerId, preferredDate, preferredTime = null, serviceId = null) => {
    try {
      const payload = {
        provider_id: providerId,
        preferred_date: preferredDate,
      };
      if (preferredTime) {
        payload.preferred_time = preferredTime;
      }
      if (serviceId) {
        payload.service_id = serviceId;
      }
      
      const response = await api.post('/bookings/check-conflict/', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get available time slots for a provider on a specific date
   * @param {number} providerId
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise} Available slots and booked times
   */
  getAvailableTimeSlots: async (providerId, date) => {
    try {
      const response = await api.get('/bookings/available-slots/', {
        params: {
          provider_id: providerId,
          date: date,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get alternative dates with available slots
   * @param {number} providerId
   * @param {string} preferredDate - YYYY-MM-DD
   * @param {number} daysAhead - Optional (default 7)
   * @returns {Promise} Alternative dates with availability info
   */
  getAlternativeDates: async (providerId, preferredDate, daysAhead = 7) => {
    try {
      const response = await api.get('/bookings/alternative-dates/', {
        params: {
          provider_id: providerId,
          preferred_date: preferredDate,
          days_ahead: daysAhead,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default bookingsService;
