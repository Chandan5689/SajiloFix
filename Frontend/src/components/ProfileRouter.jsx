import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import UserMyProfile from '../pages/Dashboard/User/UserMyProfile';
import MyProfile from '../pages/Dashboard/Provider/ProviderMyProfile/MyProfile';

function ProfileRouter() {
    const { isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const [userType, setUserType] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const fetchUserType = async () => {
            if (!isLoaded) return;
            if (!isSignedIn) {
                setChecking(false);
                return;
            }
            try {
                const token = await getToken();
                const resp = await fetch('http://127.0.0.1:8000/api/auth/registration-status/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resp.ok) throw new Error('Failed to fetch registration status');
                const data = await resp.json();
                setUserType(data.user_type);
            } catch (err) {
                console.error('Error fetching user type:', err);
            } finally {
                setChecking(false);
            }
        };
        fetchUserType();
    }, [getToken, isLoaded, isSignedIn]);

    if (!isLoaded || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return <Navigate to="/login" replace />;
    }

    if (userType === 'offer') {
        return <MyProfile />;
    }

    if (userType === 'find') {
        return <UserMyProfile />;
    }

    return <Navigate to="/" replace />;
}

export default ProfileRouter;
