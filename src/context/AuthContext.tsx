'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
import { AuthNotificationModal, AuthModalType } from '@/components/AuthNotificationModal';

export const MAX_FAILED_ATTEMPTS = 3;
export const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isBlocked: boolean;
  failedAttempts: number;
  maxAttempts: number;
  remainingBlockSeconds: number;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  requestLogoutConfirmation: () => void;
  triggerUnauthorizedModal: (email?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isBlocked: false,
  failedAttempts: 0,
  maxAttempts: MAX_FAILED_ATTEMPTS,
  remainingBlockSeconds: 0,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  requestLogoutConfirmation: () => {},
  triggerUnauthorizedModal: () => {}
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

  // Lockout and Rate Limiting state
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [remainingBlockSeconds, setRemainingBlockSeconds] = useState<number>(0);

  // Success / Lockout / Logout Confirmation modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: AuthModalType;
    userEmail?: string | null;
    userPhoto?: string | null;
    userName?: string | null;
    attemptsCount?: number;
  } | null>(null);

  // Restore lockout state from localStorage on initial client mount
  useEffect(() => {
    try {
      const storedAttempts = localStorage.getItem('app_login_failed_attempts');
      const storedBlockedUntil = localStorage.getItem('app_login_blocked_until');

      if (storedAttempts) {
        const parsedCount = parseInt(storedAttempts, 10);
        if (!isNaN(parsedCount)) setFailedAttempts(parsedCount);
      }

      if (storedBlockedUntil) {
        const parsedTime = parseInt(storedBlockedUntil, 10);
        if (!isNaN(parsedTime) && parsedTime > Date.now()) {
          setBlockedUntil(parsedTime);
        } else {
          // Expiry passed
          localStorage.removeItem('app_login_blocked_until');
          localStorage.removeItem('app_login_failed_attempts');
        }
      }
    } catch (e) {
      console.error('Failed to load login lock state from localStorage:', e);
    }
  }, []);

  // Timer interval for countdown when blocked
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (blockedUntil && blockedUntil > Date.now()) {
      const updateTimer = () => {
        const diffMs = blockedUntil - Date.now();
        if (diffMs <= 0) {
          setBlockedUntil(null);
          setFailedAttempts(0);
          setRemainingBlockSeconds(0);
          try {
            localStorage.removeItem('app_login_blocked_until');
            localStorage.removeItem('app_login_failed_attempts');
          } catch (e) {}
        } else {
          setRemainingBlockSeconds(Math.ceil(diffMs / 1000));
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setRemainingBlockSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [blockedUntil]);

  const isBlocked = Boolean(blockedUntil && blockedUntil > Date.now());

  // Register failed/unauthorized attempt
  const handleFailedAttempt = useCallback((email?: string) => {
    let newCount = failedAttempts + 1;
    setFailedAttempts(newCount);

    try {
      localStorage.setItem('app_login_failed_attempts', newCount.toString());
    } catch (e) {}

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      const lockTime = Date.now() + LOCKOUT_DURATION_MS;
      setBlockedUntil(lockTime);
      setRemainingBlockSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
      try {
        localStorage.setItem('app_login_blocked_until', lockTime.toString());
      } catch (e) {}

      setModalState({
        isOpen: true,
        type: 'blocked_lockout',
        userEmail: email
      });
    } else {
      setModalState({
        isOpen: true,
        type: 'unauthorized_owner',
        userEmail: email,
        attemptsCount: newCount
      });
    }
  }, [failedAttempts]);

  // Reset failed attempt count on successful login
  const resetLockState = useCallback(() => {
    setFailedAttempts(0);
    setBlockedUntil(null);
    setRemainingBlockSeconds(0);
    try {
      localStorage.removeItem('app_login_failed_attempts');
      localStorage.removeItem('app_login_blocked_until');
    } catch (e) {}
  }, []);

  const triggerUnauthorizedModal = useCallback((email?: string) => {
    handleFailedAttempt(email);
  }, [handleFailedAttempt]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !isEmailAllowed(currentUser.email)) {
        console.warn(`Unauthorized login attempt detected for ${currentUser.email}. Logging out.`);
        await logoutFirebase();
        setUser(null);
        handleFailedAttempt(currentUser.email || undefined);
      } else {
        if (currentUser) {
          resetLockState();
        }
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleFailedAttempt, resetLockState]);

  const loginWithGoogle = async () => {
    if (isBlocked) {
      setModalState({
        isOpen: true,
        type: 'blocked_lockout'
      });
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        if (!isEmailAllowed(loggedUser.email)) {
          await logoutFirebase();
          setUser(null);
          handleFailedAttempt(loggedUser.email || undefined);
          const err = new Error('UNAUTHORIZED_EMAIL');
          (err as any).code = 'auth/unauthorized-email';
          throw err;
        }

        resetLockState();
        setModalState({
          isOpen: true,
          type: 'login_success',
          userEmail: loggedUser.email,
          userPhoto: loggedUser.photoURL,
          userName: loggedUser.displayName
        });
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/unauthorized-email') {
        handleFailedAttempt();
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (isBlocked) {
      setModalState({
        isOpen: true,
        type: 'blocked_lockout',
        userEmail: email
      });
      return;
    }

    setLoading(true);
    try {
      if (!isEmailAllowed(email)) {
        handleFailedAttempt(email);
        const err = new Error('UNAUTHORIZED_EMAIL');
        (err as any).code = 'auth/unauthorized-email';
        throw err;
      }

      const loggedUser = await signInWithEmail(email, pass);
      if (loggedUser) {
        if (!isEmailAllowed(loggedUser.email)) {
          await logoutFirebase();
          setUser(null);
          handleFailedAttempt(loggedUser.email || undefined);
          const err = new Error('UNAUTHORIZED_EMAIL');
          (err as any).code = 'auth/unauthorized-email';
          throw err;
        }

        resetLockState();
        setModalState({
          isOpen: true,
          type: 'login_success',
          userEmail: loggedUser.email,
          userPhoto: loggedUser.photoURL,
          userName: loggedUser.displayName
        });
      }
    } catch (err: any) {
      console.error('Email login error:', err);
      if (err?.code !== 'auth/unauthorized-email') {
        handleFailedAttempt(email);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    if (isBlocked) {
      setModalState({
        isOpen: true,
        type: 'blocked_lockout',
        userEmail: email
      });
      return;
    }

    setLoading(true);
    try {
      if (!isEmailAllowed(email)) {
        handleFailedAttempt(email);
        const err = new Error('UNAUTHORIZED_EMAIL');
        (err as any).code = 'auth/unauthorized-email';
        throw err;
      }

      const newUser = await signUpWithEmail(email, pass);
      if (newUser) {
        if (!isEmailAllowed(newUser.email)) {
          await logoutFirebase();
          setUser(null);
          handleFailedAttempt(newUser.email || undefined);
          const err = new Error('UNAUTHORIZED_EMAIL');
          (err as any).code = 'auth/unauthorized-email';
          throw err;
        }

        resetLockState();
        setModalState({
          isOpen: true,
          type: 'register_success',
          userEmail: newUser.email,
          userPhoto: newUser.photoURL,
          userName: newUser.displayName
        });
      }
    } catch (err: any) {
      console.error('Email register error:', err);
      if (err?.code !== 'auth/unauthorized-email') {
        handleFailedAttempt(email);
      }
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
      isBlocked,
      failedAttempts,
      maxAttempts: MAX_FAILED_ATTEMPTS,
      remainingBlockSeconds,
      loginWithGoogle, 
      loginWithEmail, 
      registerWithEmail, 
      logout,
      requestLogoutConfirmation,
      triggerUnauthorizedModal
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
        children
      )}

      {modalState && (
        <AuthNotificationModal
          isOpen={modalState.isOpen}
          type={modalState.type}
          userEmail={modalState.userEmail}
          userPhoto={modalState.userPhoto}
          userName={modalState.userName}
          attemptsCount={modalState.attemptsCount ?? failedAttempts}
          maxAttempts={MAX_FAILED_ATTEMPTS}
          remainingSeconds={remainingBlockSeconds}
          onClose={() => setModalState(null)}
          onConfirmLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

