import api from '../api/axios';

const authService = {
    register: async (formData) => {
        try {
            // Create config for multipart/form-data
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };

            const response = await api.post('/auth/register/', formData, config);
            
            if (response.data.tokens) {
                localStorage.setItem('access_token', response.data.tokens.access);
                localStorage.setItem('refresh_token', response.data.tokens.refresh);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login/', { email, password });
            
            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                // Fetch user details after login
                const userResponse = await api.get('/auth/me/');
                localStorage.setItem('user', JSON.stringify(userResponse.data));
            }
            
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    }
};

export default authService;