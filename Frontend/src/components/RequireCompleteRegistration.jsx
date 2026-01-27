import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useUserProfile } from '../context/UserProfileContext';

/**
 * Wrapper component that checks if user has completed registration
 * before allowing access to protected routes.
 * Redirects to /register if registration is incomplete.
 */
function RequireCompleteRegistration({ children }) {
    const { isAuthenticated, loading: authLoading } = useSupabaseAuth();
    const { isRegistrationComplete, isAdmin, loading: profileLoading } = useUserProfile();
    const navigate = useNavigate();

    const loading = authLoading || profileLoading;

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }

        if (!isRegistrationComplete && !isAdmin) {
            navigate('/register', { replace: true });
        }
    }, [loading, isAuthenticated, isRegistrationComplete, isAdmin, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || (!isRegistrationComplete && !isAdmin)) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}

export default RequireCompleteRegistration;
