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
                try {
                    const userResponse = await api.get('/auth/me/');
                    localStorage.setItem('user', JSON.stringify(userResponse.data));
                } catch (err) {
                    console.error('Error fetching user details:', err);
                }
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
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },

    getUserType: () => {
        const user = authService.getCurrentUser();
        return user ? user.user_type : null;
    }
};

export default authService;