import axios from 'axios';
import { supabase } from '../config/supabaseClient';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ||'http://127.0.0.1:8000/api/', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// In-memory token cache to reduce Supabase calls
let cachedToken = null;
let tokenCacheTime = 0;
const TOKEN_CACHE_DURATION = 50 * 1000; // Cache for 50 seconds (token expires in 60s)

// Request interceptor to add Supabase Auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const now = Date.now();
            
            // Use cached token if still fresh
            if (cachedToken && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {
                config.headers.Authorization = `Bearer ${cachedToken}`;
                return config;
            }
            
            // Get the Supabase session with JWT token
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                // Ignore abort errors
                if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                    return config;
                }
                console.error('Error getting Supabase session:', error);
                return config;
            }
            
            if (session?.access_token) {
                // Cache the token
                cachedToken = session.access_token;
                tokenCacheTime = now;
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
        } catch (error) {
            // Ignore abort errors (component unmounted during navigation)
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                return config;
            }
            console.error('Error in auth interceptor:', error);
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
            // Clear cached token on 401
            cachedToken = null;
            tokenCacheTime = 0;
         }

        return Promise.reject(error);
    }
);

export default api;