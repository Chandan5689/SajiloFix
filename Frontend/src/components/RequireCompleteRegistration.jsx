import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

/**
 * Wrapper component that checks if user has completed registration
 * (phone verification) before allowing access to protected routes.
 * Redirects to /register if registration is incomplete.
 */
function RequireCompleteRegistration({ children }) {
    const { isSignedIn, isLoaded } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const checkRegistrationStatus = async () => {
            if (!isLoaded) return;

            if (!isSignedIn) {
                // Not signed in at all - redirect to login
                navigate('/login');
                return;
            }

            try {
                const token = await getToken();
                const response = await fetch('http://127.0.0.1:8000/api/auth/registration-status/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.registration_completed) {
                        setIsComplete(true);
                    } else {
                        // Registration incomplete - redirect to phone verification
                        console.log('⚠️ Registration incomplete, redirecting to registration...');
                        navigate('/register');
                    }
                } else {
                    // Error checking status - redirect to registration to be safe
                    console.error('Failed to check registration status');
                    navigate('/register');
                }
            } catch (error) {
                console.error('Error checking registration status:', error);
                navigate('/register');
            } finally {
                setChecking(false);
            }
        };

        checkRegistrationStatus();
    }, [isLoaded, isSignedIn, getToken, navigate]);

    if (!isLoaded || checking) {
        // Show loading spinner while checking
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking registration status...</p>
                </div>
            </div>
        );
    }

    if (!isComplete) {
        // Don't render anything while redirecting
        return null;
    }

    // Registration complete - render protected content
    return children;
}

export default RequireCompleteRegistration;
