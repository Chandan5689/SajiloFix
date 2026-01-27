import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserProfile } from '../context/UserProfileContext';

export default function RequireAdminRole({ children }) {
  const { userProfile, registrationStatus, loading } = useUserProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin permissions...</p>
        </div>
      </div>
    );
  }

  // Check both userProfile and registrationStatus for admin flags
  const isAdmin = (userProfile?.is_staff || userProfile?.is_superuser || 
                   registrationStatus?.is_staff || registrationStatus?.is_superuser);

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
