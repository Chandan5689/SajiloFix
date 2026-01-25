import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import api from '../api/axios';
import MyBookings from '../pages/Dashboard/User/MyBookings';
import ProviderMyBookings from '../pages/Dashboard/Provider/ProviderMyBookings';
import { UserProfileProvider } from '../context/UserProfileContext';

function BookingsRouter() {
    const { isAuthenticated, loading, getToken } = useSupabaseAuth();
    const [userType, setUserType] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const fetchUserType = async () => {
            if (loading) return;
            if (!isAuthenticated) {
                setChecking(false);
                return;
            }
            try {
                const token = await getToken();
                const resp = await api.get('/auth/registration-status/', {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (resp.status !== 200) throw new Error('Failed to fetch registration status');
                setUserType(resp.data.user_type);
            } catch (err) {
                console.error('Error fetching user type:', err);
            } finally {
                setChecking(false);
            }
        };
        fetchUserType();
    }, [getToken, loading, isAuthenticated]);

    if (loading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your bookings...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (userType === 'offer') {
        return (
            <UserProfileProvider>
                <ProviderMyBookings />
            </UserProfileProvider>
        );
    }

    if (userType === 'find') {
        return (
            <UserProfileProvider>
                <MyBookings />
            </UserProfileProvider>
        );
    }

    return <Navigate to="/" replace />;
}

export default BookingsRouter;
