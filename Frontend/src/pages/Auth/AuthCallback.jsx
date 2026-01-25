import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import api from '../../api/axios';

/**
 * Handles OAuth and email verification callbacks from Supabase.
 * Checks registration status and redirects accordingly.
 */
function AuthCallback() {
    const navigate = useNavigate();
    const { session, user, loading, getToken } = useSupabaseAuth();
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        const handleCallback = async () => {
            // Wait for auth to finish loading
            if (loading) return;

            // If no session, redirect to login
            if (!session || !user) {
                console.log('No session found, redirecting to login');
                navigate('/login');
                return;
            }

            try {
                const token = await getToken();
                
                if (!token) {
                    console.log('No token available, redirecting to login');
                    navigate('/login');
                    return;
                }

                // Check registration status in backend
                const response = await api.get('/auth/registration-status/', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const { registration_completed, user_type } = response.data;

                if (registration_completed) {
                    // Redirect based on user type
                    if (user_type === 'offer') {
                        navigate('/provider/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                } else if (user_type) {
                    // Has user_type but incomplete registration
                    if (user_type === 'offer') {
                        navigate('/complete-provider-profile');
                    } else {
                        navigate('/register');
                    }
                } else {
                    // New user, needs to complete registration
                    navigate('/register');
                }
            } catch (err) {
                console.error('Auth callback error:', err);
                
                if (err.response?.status === 404) {
                    // User doesn't exist in backend yet, redirect to registration
                    navigate('/register');
                } else {
                    setError('Authentication failed. Please try again.');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } finally {
                setProcessing(false);
            }
        };

        handleCallback();
    }, [loading, session, user, getToken, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">⚠️</div>
                    <p className="text-gray-700">{error}</p>
                    <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Processing authentication...</p>
            </div>
        </div>
    );
}

export default AuthCallback;
