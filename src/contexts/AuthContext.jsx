// Firebase Authentication Context
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'purchase_manager' or 'vendor'
  const refreshIntervalRef = useRef(null);

  // Get fresh ID token
  const getIdToken = async (forceRefresh = false) => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(forceRefresh);
        setIdToken(token);
        return token;
      } catch (error) {
        console.error('Error getting ID token:', error);
        return null;
      }
    }
    return null;
  };

  // Sign in with email and password (vendors)
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with custom token (purchase managers)
  const loginWithCustomToken = (customToken) => {
    return signInWithCustomToken(auth, customToken);
  };

  // Sign up (vendors)
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Sign out
  const logout = () => {
    setIdToken(null);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');
    // Safety timeout - if Firebase doesn't respond in 3 seconds, unblock anyway
    const safetyTimeout = setTimeout(() => {
      console.log('⚠️ Firebase initialization timeout - proceeding anyway');
      setLoading(false);
    }, 3000);

    try {
      // Listen to auth state changes
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          console.log('✅ Firebase auth state changed:', user ? 'User logged in' : 'No user');
          clearTimeout(safetyTimeout); // Cancel safety timeout

          // Clear any existing refresh interval
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
          }

          setCurrentUser(user);

          // Determine user role from localStorage
          if (user) {
            // Get ID token when user signs in
            try {
              const token = await user.getIdToken();
              setIdToken(token);
              console.log('🔑 ID token obtained');

              // Role detection: check localStorage for purchaseManagerUser or vendor
              if (localStorage.getItem('purchaseManagerUser')) {
                setUserRole('purchase_manager');
              } else if (localStorage.getItem('vendor')) {
                setUserRole('vendor');
              } else {
                setUserRole(null);
              }

              // Refresh token every 50 minutes (tokens expire after 1 hour)
              const interval = setInterval(async () => {
                try {
                  const newToken = await user.getIdToken(true);
                  setIdToken(newToken);
                  console.log('🔄 Token refreshed');
                } catch (err) {
                  console.error('Token refresh error:', err);
                }
              }, 50 * 60 * 1000);

              refreshIntervalRef.current = interval;
            } catch (error) {
              console.error('Error getting ID token:', error);
            }
          } else {
            setIdToken(null);
            setUserRole(null);
          }

          setLoading(false);
        }
      );

      return () => {
        clearTimeout(safetyTimeout);
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Firebase setup error:', error);
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, []);


  const value = {
    currentUser,
    idToken,
    userRole,
    login,
    loginWithCustomToken,
    signup,
    logout,
    resetPassword,
    getIdToken,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
