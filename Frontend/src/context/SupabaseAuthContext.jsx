import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

const SupabaseAuthContext = createContext(null);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
};

const formatNepalPhone = (phone) => {
  const trimmed = (phone || '').replace(/\s+/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  // Strip leading zeros then prepend country code
  const withoutZero = trimmed.replace(/^0+/, '');
  return `+977${withoutZero}`;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (!isMounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error('Supabase auth init error:', err.message || err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    initSession();

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, firstName, middleName, lastName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    setSession(data.session ?? null);
    setUser(data.session?.user ?? null);
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
    setSession(data.session ?? null);
    setUser(data.session?.user ?? null);
    return data;
  };

  const signInWithOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setSession(null);
    setUser(null);
  };

  const getToken = async () => {
    try {
      // First try to get the current session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // If we have a session, check if the token is close to expiry
      if (data.session) {
        const expiresAt = data.session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        
        // If token expires within 60 seconds, try to refresh it
        if (expiresAt && expiresAt - now < 60) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            return refreshData.session.access_token;
          }
        }
        
        return data.session.access_token;
      }
      
      return null;
    } catch (err) {
      console.error('Error getting token:', err);
      return null;
    }
  };

  const resendEmailOtp = async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      throw new Error(error.message);
    }
  };

  const verifyEmailOtp = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      type: 'signup',
      email,
      token,
    });
    if (error) {
      throw new Error(error.message);
    }
    setSession(data.session ?? null);
    setUser(data.session?.user ?? null);
    return data;
  };

  const sendPhoneOtp = async (phone) => {
    const phoneE164 = formatNepalPhone(phone);
    const { error, data } = await supabase.auth.updateUser({ phone: phoneE164 });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  };

  const verifyPhoneOtp = async (phone, token) => {
    const phoneE164 = formatNepalPhone(phone);
    const { data, error } = await supabase.auth.verifyOtp({
      type: 'sms',
      phone: phoneE164,
      token,
    });
    if (error) {
      throw new Error(error.message);
    }
    setSession(data.session ?? session);
    setUser(data.session?.user ?? user);
    return data;
  };

  const updateUser = async (updates) => {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) {
      throw new Error(error.message);
    }
    setUser(data.user ?? user);
    return data;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    getToken,
    resendEmailOtp,
    verifyEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    updateUser,
    isAuthenticated: Boolean(session && user),
    supabase,
  };

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};
