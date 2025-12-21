import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  reload
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../api/axios';

const FirebaseAuthContext = createContext(null);

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [djangoUser, setDjangoUser] = useState(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Reload user to get latest emailVerified status
        try {
          await reload(firebaseUser);
        } catch (err) {
          console.error('Error reloading user:', err);
        }
        
        // Get Firebase ID token and fetch Django user data
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await api.get('/auth/me/', {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          setDjangoUser(response.data);
        } catch (err) {
          // 403 is expected for unverified users - they'll be redirected
          if (err.response?.status !== 403) {
            console.error('Error fetching Django user:', err);
          }
          setDjangoUser(null);
        }
      } else {
        setDjangoUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, firstName, lastName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase profile with name
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      // Send email verification
      await sendEmailVerification(firebaseUser);

      return { user: firebaseUser };
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user };
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setDjangoUser(null);
    } catch (error) {
      throw error;
    }
  };

  const getIdToken = async () => {
    if (user) {
      return await user.getIdToken(true); // Force refresh
    }
    return null;
  };

  const refreshDjangoUser = async () => {
    if (user) {
      try {
        const idToken = await getIdToken();
        const response = await api.get('/auth/me/', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        setDjangoUser(response.data);
        return response.data;
      } catch (err) {
        console.error('Error refreshing Django user:', err);
        return null;
      }
    }
    return null;
  };

  const checkEmailVerification = async () => {
    if (user) {
      try {
        await reload(user); // Reload user to get latest emailVerified status
        // After reload, user.emailVerified should be updated
        return user.emailVerified;
      } catch (error) {
        console.error('Error checking email verification:', error);
        return false;
      }
    }
    return false;
  };

  const value = {
    user,
    djangoUser,
    loading,
    register,
    login,
    logout,
    getIdToken,
    refreshDjangoUser,
    checkEmailVerification,
    isAuthenticated: !!user,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

