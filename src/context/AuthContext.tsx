'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithGoogle, 
  signInWithEmail,
  signUpWithEmail,
  logoutFirebase, 
  FirebaseUser 
} from '@/lib/firebase';
import { LoginPage } from '@/components/LoginPage';
import { AuthNotificationModal } from '@/components/AuthNotificationModal';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  requestLogoutConfirmation: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  requestLogoutConfirmation: () => {}
});

const DEFAULT_ALLOWED_EMAILS = ['mariamtelecom7011@gmail.com'];

export function isEmailAllowed(email?: string | null): boolean {
  if (!email) return false;
  const envEmails = process.env.NEXT_PUBLIC_ALLOWED_EMAILS;
  const allowedList = envEmails 
    ? envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ALLOWED_EMAILS;
  
  return allowedList.includes(email.trim().toLowerCase());
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Success / Logout Confirmation modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'login_success' | 'register_success' | 'logout_confirm';
    userEmail?: string | null;
    userPhoto?: string | null;
    userName?: string | null;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !isEmailAllowed(currentUser.email)) {
        console.warn(`Unauthorized login attempt detected for ${currentUser.email}. Logging out.`);
        await logoutFirebase();
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        if (!isEmailAllowed(loggedUser.email)) {
          await logoutFirebase();
          setUser(null);
          const err = new Error('UNAUTHORIZED_EMAIL');
          (err as any).code = 'auth/unauthorized-email';
          throw err;
        }

        setModalState({
          isOpen: true,
          type: 'login_success',
          userEmail: loggedUser.email,
          userPhoto: loggedUser.photoURL,
          userName: loggedUser.displayName
        });
      }
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (!isEmailAllowed(email)) {
        const err = new Error('UNAUTHORIZED_EMAIL');
        (err as any).code = 'auth/unauthorized-email';
        throw err;
      }

      const loggedUser = await signInWithEmail(email, pass);
      if (loggedUser) {
        if (!isEmailAllowed(loggedUser.email)) {
          await logoutFirebase();
          setUser(null);
          const err = new Error('UNAUTHORIZED_EMAIL');
          (err as any).code = 'auth/unauthorized-email';
          throw err;
        }

        setModalState({
          isOpen: true,
          type: 'login_success',
          userEmail: loggedUser.email,
          userPhoto: loggedUser.photoURL,
          userName: loggedUser.displayName
        });
      }
    } catch (err) {
      console.error('Email login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (!isEmailAllowed(email)) {
        const err = new Error('UNAUTHORIZED_EMAIL');
        (err as any).code = 'auth/unauthorized-email';
        throw err;
      }

      const newUser = await signUpWithEmail(email, pass);
      if (newUser) {
        if (!isEmailAllowed(newUser.email)) {
          await logoutFirebase();
          setUser(null);
          const err = new Error('UNAUTHORIZED_EMAIL');
          (err as any).code = 'auth/unauthorized-email';
          throw err;
        }

        setModalState({
          isOpen: true,
          type: 'register_success',
          userEmail: newUser.email,
          userPhoto: newUser.photoURL,
          userName: newUser.displayName
        });
      }
    } catch (err) {
      console.error('Email register error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const logout = async () => {
    setLoading(true);
    try {
      await logoutFirebase();
      setModalState(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestLogoutConfirmation = () => {
    if (!user) return;
    setModalState({
      isOpen: true,
      type: 'logout_confirm',
      userEmail: user.email,
      userPhoto: user.photoURL,
      userName: user.displayName
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle, 
      loginWithEmail, 
      registerWithEmail, 
      logout,
      requestLogoutConfirmation
    }}>
      {loading ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: '1.25rem', fontSize: '0.95rem', color: '#94a3b8', fontWeight: 600 }}>
            যাচাইকরণ করা হচ্ছে... (Authenticating...)
          </p>
        </div>
      ) : !user ? (
        <LoginPage 
          onGoogleLogin={loginWithGoogle}
          onEmailLogin={loginWithEmail}
          onEmailRegister={registerWithEmail}
        />
      ) : (
        <>
          {children}
          {modalState && (
            <AuthNotificationModal
              isOpen={modalState.isOpen}
              type={modalState.type}
              userEmail={modalState.userEmail}
              userPhoto={modalState.userPhoto}
              userName={modalState.userName}
              onClose={() => setModalState(null)}
              onConfirmLogout={logout}
            />
          )}
        </>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
