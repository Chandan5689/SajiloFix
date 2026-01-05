import React, { createContext, useContext, useState, useEffect } from 'react';
import userService from '../services/userService';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    // Return default values instead of throwing error
    return {
      userProfile: null,
      loading: false,
      error: null,
      refreshProfile: () => {},
    };
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await userService.getProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile once on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Function to refresh profile if needed
  const refreshProfile = () => {
    fetchUserProfile();
  };

  const value = {
    userProfile,
    loading,
    error,
    refreshProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
