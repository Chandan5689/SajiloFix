import api from '../api/axios';

// Provider availability API helpers
const availabilityService = {
  getAvailability: async () => {
    try {
      const response = await api.get('/bookings/availability/');
      return response.data;
    } catch (error) {
      console.error('Get availability error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
  saveAvailability: async (payload) => {
    try {
      const response = await api.put('/bookings/availability/', payload);
      return response.data;
    } catch (error) {
      console.error('Save availability error:', error.response?.data || error.message);
      const errorData = error.response?.data;
      // Format error message for display
      if (typeof errorData === 'object') {
        const messages = Object.values(errorData)
          .flat()
          .join('; ');
        throw messages || error.message;
      }
      throw error.response?.data || error.message;
    }
  },
};

export default availabilityService;
