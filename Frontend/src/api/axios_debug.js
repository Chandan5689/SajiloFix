import axios from 'axios';
import { supabase } from '../config/supabaseClient';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ||'http://127.0.0.1:8000/api/', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Supabase Auth token
api.interceptors.request.use(
    async (config) => {
        try {
            // Get the Supabase session with JWT token
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                // Ignore abort errors
                if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                    return config;
                }
                console.error('[axios] Error getting Supabase session:', error);
                return config;
            }
            
            if (session?.access_token) {
                console.log('[axios] Adding Bearer token to request:', config.url);
                console.log('[axios] Token (first 20 chars):', session.access_token.substring(0, 20) + '...');
                config.headers.Authorization = `Bearer ${session.access_token}`;
            } else {
                console.warn('[axios] No session or access_token found for request:', config.url);
            }
        } catch (error) {
            // Ignore abort errors (component unmounted during navigation)
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                return config;
            }
            console.error('[axios] Error in auth interceptor:', error);
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
            console.error('[axios] Unauthorized access - 401');
         }
         if (error.response?.status === 403){
            console.error('[axios] Forbidden access - 403');
            console.error('[axios] Response:', error.response?.data);
         }

        return Promise.reject(error);
    }
);

export default api;
