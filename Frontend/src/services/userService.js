import api from '../api/axios';

const userService = {
  /**
   * Fetch current user profile
   * @returns {Promise} User profile data
   */
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update user profile information
   * @param {FormData|Object} profileData - Profile data to update (can be FormData or object)
   * @returns {Promise} Updated user profile
   */
  updateProfile: async (profileData) => {
    try {
      let formData = profileData;
      
      // Convert object to FormData if it's not already
      if (!(profileData instanceof FormData)) {
        formData = new FormData();
        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== null && profileData[key] !== undefined) {
            formData.append(key, profileData[key]);
          }
        });
      }
      
      const response = await api.patch('/auth/me/update/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Upload profile picture
   * @param {File} file - Image file
   * @returns {Promise} Updated user profile
   */
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const response = await api.patch('/auth/me/update/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get user registration status
   * @returns {Promise} Registration status
   */
  getRegistrationStatus: async () => {
    try {
      const response = await api.get('/auth/registration-status/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userService;
