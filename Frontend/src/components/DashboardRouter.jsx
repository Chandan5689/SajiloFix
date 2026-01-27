import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from "../context/SupabaseAuthContext";
import { useUserProfile } from '../context/UserProfileContext';
import UserDashboard from '../pages/Dashboard/User/UserDashboard';
import ProviderDashboard from '../pages/Dashboard/Provider/ProviderDashboard';
import { UserProfileProvider } from '../context/UserProfileContext';

function DashboardRouter() {
    const { isAuthenticated, loading: authLoading } = useSupabaseAuth();
    const { userType, loading: profileLoading } = useUserProfile();

    const loading = authLoading || profileLoading;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (userType === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    if (userType === 'offer') {
        return <ProviderDashboard />;
    }

    if (userType === 'find') {
        return <UserDashboard />;
    }

    // Fallback for unexpected type
    return <Navigate to="/" replace />;
}

export default DashboardRouter;
