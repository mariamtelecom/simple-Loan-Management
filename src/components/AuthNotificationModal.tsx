'use client';

import React from 'react';
import { CheckCircle2, LogOut, User, ShieldCheck, ShieldAlert, Lock, Clock } from 'lucide-react';
import styles from './AuthNotificationModal.module.css';
import { Language } from '@/lib/i18n';

export type AuthModalType = 
  | 'login_success' 
  | 'register_success' 
  | 'logout_confirm' 
  | 'unauthorized_owner' 
  | 'blocked_lockout';

interface AuthNotificationModalProps {
  isOpen: boolean;
  type: AuthModalType;
  userEmail?: string | null;
  userPhoto?: string | null;
  userName?: string | null;
  attemptsCount?: number;
  maxAttempts?: number;
  remainingSeconds?: number;
  onClose: () => void;
  onConfirmLogout?: () => void;
  lang?: Language;
}

export const AuthNotificationModal: React.FC<AuthNotificationModalProps> = ({
  isOpen,
  type,
  userEmail,
  userPhoto,
  userName,
  attemptsCount = 0,
  maxAttempts = 3,
  remainingSeconds = 0,
  onClose,
  onConfirmLogout,
  lang = 'bn'
}) => {
  if (!isOpen) return null;

  const isBn = lang === 'bn';

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Unauthorized User Modal ("You are not the owner of this website...")
  if (type === 'unauthorized_owner') {
    const remaining = Math.max(0, maxAttempts - attemptsCount);
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.iconRingAmber}>
            <ShieldAlert size={38} />
          </div>

          <h3 className={styles.title} style={{ color: '#b45309' }}>
            {isBn ? 'অনুমতি নেই: আপনি এই ওয়েবসাইটের মালিক নন' : 'Access Denied: You are not the owner'}
          </h3>

          <p className={styles.subtitle} style={{ color: '#475569', fontSize: '0.925rem', fontWeight: 500 }}>
            {isBn ? (
              <>
                <strong>আপনি এই ওয়েবসাইটের মালিক নন।</strong> ধন্যবাদ! আর চেষ্টা করবেন না, অন্যথায় আপনাকে এই ওয়েবসাইটে <strong>৩০ মিনিটের জন্য ব্লক</strong> করা হবে।
              </>
            ) : (
              <>
                <strong>You are not the owner of this website.</strong> Thank You. Don't try more, otherwise you will be blocked for this website.
              </>
            )}
          </p>

          {userEmail && (
            <div className={styles.userCard} style={{ background: '#fff7ed', borderColor: '#ffedd5' }}>
              <div className={styles.userAvatar} style={{ background: '#d97706' }}>
                <User size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: 600, display: 'block' }}>
                  {isBn ? 'চেষ্টাকৃত ইমেইল এড্রেস' : 'Attempted Email'}
                </span>
                <span className={styles.userEmail} style={{ color: '#9a3412' }}>{userEmail}</span>
              </div>
            </div>
          )}

          <div className={styles.attemptsWarningBox}>
            ⚠️ {isBn 
              ? `ব্যর্থ / অননুমোদিত চেষ্টা: ${attemptsCount} / ${maxAttempts}। আর ${remaining} বার ভুল চেষ্টা করলে ওয়েবসাইট ৩০ মিনিটের জন্য লক হয়ে যাবে।`
              : `Unauthorized attempts: ${attemptsCount} / ${maxAttempts}. Website will be locked for 30 minutes after ${remaining} more attempt(s).`}
          </div>

          <div className={styles.actions}>
            <button onClick={onClose} className="btn btn-primary" style={{ background: '#d97706', borderColor: '#b45309', width: '100%' }}>
              <span>{isBn ? 'ধন্যবাদ, আমি বুঝেছি' : 'Thank You, Got It'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Blocked / Lockout Modal (30-minute block)
  if (type === 'blocked_lockout') {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.iconRingRose}>
            <Lock size={38} />
          </div>

          <h3 className={styles.title} style={{ color: '#991b1b' }}>
            {isBn ? 'ওয়েবসাইটে এক্সেস ব্লক করা হয়েছে' : 'Website Access Blocked'}
          </h3>

          <p className={styles.subtitle} style={{ color: '#475569', fontSize: '0.9rem' }}>
            {isBn ? (
              <>
                আপনি ৩-৫ বার ভুল বা অননুমোদিত চেষ্টা করেছেন। নিরাপত্তাজনিত কারণে আপনার জন্য লগইন প্রক্রিয়া <strong>৩০ মিনিটের জন্য ব্লক</strong> করা হয়েছে।
              </>
            ) : (
              <>
                You have made multiple failed or unauthorized login attempts. For security reasons, you have been blocked for <strong>30 minutes</strong>.
              </>
            )}
          </p>

          <div className={styles.timerBadge}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Clock size={14} style={{ color: '#f43f5e' }} />
              <span>{isBn ? 'ব্লক অবসান হতে অবশিষ্ট সময়' : 'Remaining Block Time'}</span>
            </div>
            <div className={styles.timerText}>
              {formatTimer(remainingSeconds)}
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <span>{isBn ? 'ঠিক আছে' : 'OK, Close'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'logout_confirm') {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.iconRingRose}>
            <LogOut size={36} />
          </div>

          <h3 className={styles.title} style={{ color: '#991b1b' }}>
            {isBn ? 'লগআউট নিশ্চিতকরণ' : 'Confirm Logout'}
          </h3>

          <p className={styles.subtitle}>
            {isBn
              ? 'আপনি কি নিশ্চিত যে আপনি অ্যাকাউন্ট থেকে লগআউট করতে চান?'
              : 'Are you sure you want to log out of your account?'}
          </p>

          {userEmail && (
            <div className={styles.userCard} style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
              <div className={styles.userAvatar} style={{ background: '#dc2626' }}>
                {userPhoto ? (
                  <img src={userPhoto} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (userName || userEmail).charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600, display: 'block' }}>
                  {userName || (isBn ? 'বর্তমান একাউন্ট' : 'Current Account')}
                </span>
                <span className={styles.userEmail}>{userEmail}</span>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button onClick={onClose} className="btn btn-secondary">
              <span>{isBn ? 'বাতিল' : 'Cancel'}</span>
            </button>
            <button
              onClick={() => {
                onClose();
                if (onConfirmLogout) onConfirmLogout();
              }}
              className="btn btn-danger"
              style={{ background: '#dc2626', borderColor: '#b91c1c' }}
            >
              <LogOut size={16} />
              <span>{isBn ? 'হ্যাঁ, লগআউট করুন' : 'Yes, Log Out'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRegister = type === 'register_success';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconRingGreen}>
          <CheckCircle2 size={38} />
        </div>

        <h3 className={styles.title}>
          {isRegister
            ? (isBn ? 'একাউন্ট সফলভাবে তৈরি হয়েছে!' : 'Account Created Successfully!')
            : (isBn ? 'লগইন সফল হয়েছে!' : 'Login Successful!')}
        </h3>

        <p className={styles.subtitle}>
          {isRegister
            ? (isBn ? 'আপনার নতুন একাউন্ট সফলভাবে নিবন্ধিত হয়েছে। এখন আপনি ড্যাশবোর্ড ব্যবহার করতে পারবেন।' : 'Your account has been registered. You can now access the dashboard.')
            : (isBn ? 'সফলভাবে আপনার একাউন্টে প্রবেশ করা হয়েছে। স্বাগত জানাচ্ছি!' : 'You have successfully logged in. Welcome back!')}
        </p>

        {(userEmail || userName) && (
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {userPhoto ? (
                <img src={userPhoto} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (userName || userEmail || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: 3 }} />
                {isBn ? 'নিরাপদ একাউন্ট' : 'Authenticated User'}
              </span>
              <span className={styles.userEmail}>{userName || userEmail}</span>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className="btn btn-primary" style={{ background: '#059669', borderColor: '#047857' }}>
            <span>{isBn ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Proceed to Dashboard'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

