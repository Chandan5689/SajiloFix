import axios from 'axios';


const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ||'http://127.0.0.1:8000/api/', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// Response interceptor to handle token refresh

api.interceptors.response.use(
    (response) => response,
    async (error) => {
         // hANDLE ERROR
         if (error.response?.status === 401){
            console.error('Unauthorized access');
         }

        return Promise.reject(error);
    }
);

export default api;