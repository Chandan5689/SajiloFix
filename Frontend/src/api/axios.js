import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ||'http://127.0.0.1:8000/api/', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Store the getToken function (will be set by the app)
let getTokenFunction = null;

export const setGetTokenFunction = (fn) => {
    getTokenFunction = fn;
};

// Request interceptor to add Clerk auth token
api.interceptors.request.use(
    async (config) => {
        try {
            // Get the Clerk token if available
            if (getTokenFunction) {
                const token = await getTokenFunction();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }

        // If the request body is FormData, remove Content-Type header
        // so the browser can set it with the proper boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// Response interceptor to handle errors

api.interceptors.response.use(
    (response) => response,
    async (error) => {
         // HANDLE ERROR
         if (error.response?.status === 401){
            console.error('Unauthorized access');
         }

        return Promise.reject(error);
    }
);

export default api;