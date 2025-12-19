import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

/**
 * Wrapper component that ensures only users with user_type='find' 
 * can access user-specific routes.
 * Redirects 'offer' users to /provider/dashboard
 */
function RequireUserRole({ children }) {
    const { isSignedIn, isLoaded } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [isUser, setIsUser] = useState(false);

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
                    if (data.user_type === 'find') {
                        setIsUser(true);
                    } else {
                        // User is 'offer' type, redirect to provider dashboard
                        console.log('⚠️ Access denied: User is a provider, redirecting to provider dashboard');
                        navigate('/provider/dashboard');
                    }
                } else {
                    console.error('Failed to check user type');
                    navigate('/');
                }
            } catch (error) {
                console.error('Error checking user type:', error);
                navigate('/');
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

    if (!isUser) {
        return null;
    }

    return children;
}

export default RequireUserRole;
