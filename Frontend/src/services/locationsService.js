import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

const locationsService = {
  /**
   * Get all available cities and districts from providers
   * @returns {Promise} { cities: [], districts: { city: [districts] } }
   */
  getLocations: async () => {
    try {
      const response = await axios.get(`${API_BASE}auth/locations/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      throw error;
    }
  },
};

export default locationsService;
