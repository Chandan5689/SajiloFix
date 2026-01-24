import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../api/axios';
import { useSupabaseAuth } from './SupabaseAuthContext';

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    return {
      userProfile: null,
      registrationStatus: null,
      loading: true,
      error: null,
      refreshProfile: () => Promise.resolve(),
      isRegistrationComplete: false,
      userType: null,
    };
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const { loading: authLoading, isAuthenticated } = useSupabaseAuth();
  
  const isFetchingRef = useRef(false);
  const hasAttemptedFetchRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setUserProfile(null);
      setRegistrationStatus(null);
      setProfileLoading(false);
      setInitialized(false);
      setError(null);
      hasAttemptedFetchRef.current = false;
      isFetchingRef.current = false;
      return;
    }

    if (hasAttemptedFetchRef.current) {
      return;
    }

    if (isFetchingRef.current) {
      return;
    }
    hasAttemptedFetchRef.current = true;

    const fetchUserData = async () => {
      try {
        isFetchingRef.current = true;
        setProfileLoading(true);
        setError(null);

        const statusResp = await api.get('/auth/registration-status/');

        if (!isMounted) {
          isFetchingRef.current = false;
          return;
        }

        setRegistrationStatus(statusResp.data);

        const profileResp = await api.get('/auth/me/');

        if (!isMounted) {
          isFetchingRef.current = false;
          return;
        }

        setUserProfile(profileResp.data);

        if (isMounted) {
          setInitialized(true);
          setProfileLoading(false);
          isFetchingRef.current = false;
        }
      } catch (err) {
        if (!isMounted) {
          isFetchingRef.current = false;
          return;
        }

        console.error('[UserProfileProvider] Fetch failed:', err.message);
        setError(err);
        setUserProfile(null);
        setRegistrationStatus(null);
        setInitialized(true);
        setProfileLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const handleRegistrationComplete = async () => {
      if (!isAuthenticated) return;

      try {
        const statusResp = await api.get('/auth/registration-status/');
        setRegistrationStatus(statusResp.data);

        const profileResp = await api.get('/auth/me/');
        setUserProfile(profileResp.data);
      } catch (err) {
        console.error('[UserProfileProvider] Error refreshing after registration:', err);
      }
    };

    window.addEventListener('registrationComplete', handleRegistrationComplete);
    return () => {
      window.removeEventListener('registrationComplete', handleRegistrationComplete);
    };
  }, [isAuthenticated]);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    try {
      setProfileLoading(true);
      const statusResp = await api.get('/auth/registration-status/');
      setRegistrationStatus(statusResp.data);

      const profileResp = await api.get('/auth/me/');
      setUserProfile(profileResp.data);
    } catch (err) {
      console.error('[UserProfileProvider] Manual refresh failed:', err);
      setError(err);
    } finally {
      setProfileLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const loading = authLoading || profileLoading;

  const value = useMemo(
    () => ({
      userProfile,
      registrationStatus,
      loading,
      error,
      refreshProfile,
      isRegistrationComplete: registrationStatus?.registration_completed ?? false,
      userType: registrationStatus?.user_type || userProfile?.user_type || null,
    }),
    [userProfile, registrationStatus, loading, error, refreshProfile]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
