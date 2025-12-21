import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

/**
 * Wrapper component that ensures only users with user_type='offer' 
 * can access provider-specific routes.
 * Redirects 'find' users to /dashboard
 */
function RequireProviderRole({ children }) {
    const { isSignedIn, isLoaded } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [isProvider, setIsProvider] = useState(false);

    useEffect(() => {
        const checkUserType = async () => {
            if (!isLoaded) return;

            if (!isSignedIn) {
                navigate('/login');
                return;
            }

            try {
                const token = await getToken();
                const response = await fetch('http://127.0.0.1:8000/api/auth/me/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
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
    }, [isLoaded, isSignedIn, getToken, navigate]);

    if (!isLoaded || checking) {
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

    return children;
}

export default RequireProviderRole;
