import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import api from '../api/axios';
import { UserProfileProvider } from '../context/UserProfileContext';

/**
 * Wrapper component that ensures only users with user_type='find' 
 * can access user-specific routes.
 * Redirects 'offer' users to /provider/dashboard
 */
function RequireUserRole({ children }) {
    const { isAuthenticated, loading, getToken } = useSupabaseAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [isUser, setIsUser] = useState(false);

    useEffect(() => {
        const checkUserType = async () => {
            if (loading) return;

            if (!isAuthenticated) {
                navigate('/login', { replace: true });
                return;
            }

            try {
                const token = await getToken();
                const response = await api.get('/auth/me/', {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (response.status === 200) {
                    const data = response.data;
                    if (data.user_type === 'find') {
                        setIsUser(true);
                    } else {
                        // User is 'offer' type, redirect to provider dashboard
                        console.log('⚠️ Access denied: User is a provider, redirecting to provider dashboard');
                        navigate('/provider/dashboard', { replace: true });
                    }
                } else {
                    console.error('Failed to check user type');
                    navigate('/', { replace: true });
                }
            } catch (error) {
                console.error('Error checking user type:', error);
                navigate('/', { replace: true });
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

    if (!isUser) {
        return null;
    }

    return <UserProfileProvider>{children}</UserProfileProvider>;
}

export default RequireUserRole;
