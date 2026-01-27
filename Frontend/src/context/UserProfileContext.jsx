import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../api/axios';
import { useSupabaseAuth } from './SupabaseAuthContext';

const UserProfileContext = createContext();
const PROFILE_CACHE_KEY = 'userProfile_cache';
const STATUS_CACHE_KEY = 'registrationStatus_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Helper functions for localStorage caching
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    // Check if cache is still valid
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (e) {
    console.error('[UserProfileContext] Cache read error:', e);
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('[UserProfileContext] Cache write error:', e);
  }
};

const clearCachedData = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('[UserProfileContext] Cache clear error:', e);
  }
};

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
  const [userProfile, setUserProfile] = useState(() => getCachedData(PROFILE_CACHE_KEY));
  const [registrationStatus, setRegistrationStatus] = useState(() => getCachedData(STATUS_CACHE_KEY));
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
      clearCachedData(PROFILE_CACHE_KEY);
      clearCachedData(STATUS_CACHE_KEY);
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
        setCachedData(STATUS_CACHE_KEY, statusResp.data);

        const profileResp = await api.get('/auth/me/');

        if (!isMounted) {
          isFetchingRef.current = false;
          return;
        }

        setUserProfile(profileResp.data);
        setCachedData(PROFILE_CACHE_KEY, profileResp.data);

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
        setCachedData(STATUS_CACHE_KEY, statusResp.data);

        const profileResp = await api.get('/auth/me/');
        setUserProfile(profileResp.data);
        setCachedData(PROFILE_CACHE_KEY, profileResp.data);
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
      setCachedData(STATUS_CACHE_KEY, statusResp.data);

      const profileResp = await api.get('/auth/me/');
      setUserProfile(profileResp.data);
      setCachedData(PROFILE_CACHE_KEY, profileResp.data);
    } catch (err) {
      console.error('[UserProfileProvider] Manual refresh failed:', err);
      setError(err);
    } finally {
      setProfileLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const loading = authLoading || profileLoading;

  const isAdmin = Boolean(
    userProfile?.is_staff ||
    userProfile?.is_superuser ||
    registrationStatus?.is_staff ||
    registrationStatus?.is_superuser
  );

  const value = useMemo(
    () => ({
      userProfile,
      registrationStatus,
      loading,
      error,
      refreshProfile,
      isRegistrationComplete: (registrationStatus?.registration_completed ?? false) || isAdmin,
      userType: isAdmin ? 'admin' : (registrationStatus?.user_type || userProfile?.user_type || null),
      isAdmin,
    }),
    [userProfile, registrationStatus, loading, error, refreshProfile, isAdmin]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
