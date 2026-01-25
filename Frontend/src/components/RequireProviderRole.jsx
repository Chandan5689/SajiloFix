import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import api from '../api/axios';
import { UserProfileProvider } from '../context/UserProfileContext';

/**
 * Wrapper component that ensures only users with user_type='offer' 
 * can access provider-specific routes.
 * Redirects 'find' users to /dashboard
 */
function RequireProviderRole({ children }) {
    const { isAuthenticated, loading, getToken } = useSupabaseAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [isProvider, setIsProvider] = useState(false);

    useEffect(() => {
        const checkUserType = async () => {
            if (loading) return;

            if (!isAuthenticated) {
                navigate('/login');
                return;
            }

            try {
                const token = await getToken();
                const response = await api.get('/auth/me/', {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (response.status === 200) {
                    const data = response.data;
                    if (data.user_type === 'offer') {
                        setIsProvider(true);
                    } else {
                        // User is 'find' type, redirect to user dashboard
                        console.log('⚠️ Access denied: User is not a provider, redirecting to user dashboard');
                        navigate('/dashboard');
                    }
                } else {
                    console.error('Failed to check user type');
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error('Error checking user type:', error);
                navigate('/dashboard');
            } finally {
                setChecking(false);
            }
        };

        checkUserType();
    }, [loading, isAuthenticated, getToken, navigate]);

    if (loading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isProvider) {
        return null;
    }

    return <UserProfileProvider>{children}</UserProfileProvider>;
}

export default RequireProviderRole;
