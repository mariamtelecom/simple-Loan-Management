'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, ArrowRight, ShieldAlert } from 'lucide-react';
import styles from './DeleteAllDataModal.module.css';
import { Language } from '@/lib/i18n';

interface DeleteAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeleteAll: () => Promise<void>;
  lang: Language;
}

export const DeleteAllDataModal: React.FC<DeleteAllDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmDeleteAll,
  lang
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [inputVal, setInputVal] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setInputVal('');
      setDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBn = lang === 'bn';
  const isCodeValid = inputVal.trim().toUpperCase() === 'DELETE ALL';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeValid || deleting) return;

    setDeleting(true);
    try {
      await onConfirmDeleteAll();
      onClose();
    } catch (err) {
      console.error('Failed to delete all data', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            <AlertTriangle size={20} />
            <span>{isBn ? 'সকল ডাটা মুছুন (২-ধাপ নিরাপত্তা যাচাই)' : 'Delete All Data (2-Step Verification)'}</span>
          </h3>
          <button onClick={onClose} className={styles.closeBtn} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Step Progress Dots */}
          <div className={styles.stepIndicator}>
            <span className={`${styles.stepDot} ${step >= 1 ? styles.stepActive : ''}`}>1</span>
            <span>{isBn ? 'সতর্কবার্তা' : 'Warning'}</span>
            <span style={{ color: '#cbd5e1' }}>—</span>
            <span className={`${styles.stepDot} ${step === 2 ? styles.stepActive : ''}`}>2</span>
            <span>{isBn ? 'DELETE ALL নিশ্চিতকরণ' : 'Type DELETE ALL'}</span>
          </div>

          {/* STEP 1 VIEW */}
          {step === 1 && (
            <>
              <div className={styles.warningBox}>
                <h4 className={styles.warningTitle}>
                  {isBn ? 'আপনি কি নিশ্চিত যে সমস্ত সদস্য ও লেনদেনের ডাটা মুছে ফেলতে চান?' : 'Are you sure you want to delete ALL members and transactions?'}
                </h4>
                <p className={styles.warningText}>
                  {isBn
                    ? 'এটি করলে ওয়েবসাইট, প্রাইমারি ও সেকেন্ডারি Supabase ডাটাবেজ এবং লোকাল স্টোরেজ থেকে সমস্ত ডেমো/বর্তমান সদস্য এবং তাদের লেনদেনের পাসবই ডাটা চিরতরে মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা সম্ভব নয়!'
                    : 'This action will permanently delete ALL demo & live members and transaction history from Supabase Cloud databases and Local Storage. This action CANNOT be undone!'}
                </p>
              </div>

              <div className={styles.footer} style={{ padding: 0, background: 'none', border: 'none' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-danger btn-sm"
                >
                  <span>{isBn ? 'হ্যাঁ, ২য় ধাপে যান' : 'Proceed to Step 2'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* STEP 2 VIEW */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className={styles.warningBox} style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c', fontWeight: 700, fontSize: '0.9rem' }}>
                  <ShieldAlert size={18} />
                  <span>{isBn ? 'চূড়ান্ত ডাটাবেজ ক্লিয়ার যাচাই (Final Security Check)' : 'Final Security Verification'}</span>
                </div>
                <p className={styles.warningText}>
                  {isBn
                    ? 'সকল ডাটা স্থায়ীভাবে ডিলিট করতে নিচে \'DELETE ALL\' টাইপ করুন:'
                    : 'To permanently erase all system data, type \'DELETE ALL\' below:'}
                </p>
              </div>

              <div className={styles.verificationField} style={{ marginTop: '0.75rem' }}>
                <label className={styles.verificationLabel}>
                  {isBn ? 'টাইপ করুন: DELETE ALL' : 'Type exact phrase: DELETE ALL'}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="DELETE ALL"
                  className={styles.verificationInput}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                />
              </div>

              <div className={styles.footer} style={{ padding: 0, marginTop: '1.25rem', background: 'none', border: 'none' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary btn-sm"
                  disabled={deleting}
                >
                  {isBn ? 'পেছনে যান' : 'Back'}
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={!isCodeValid || deleting}
                  style={{ opacity: isCodeValid ? 1 : 0.5, cursor: isCodeValid ? 'pointer' : 'not-allowed' }}
                >
                  <Trash2 size={16} />
                  <span>{deleting ? 'সকল ডাটা মোছা হচ্ছে...' : (isBn ? 'সব তথ্য স্থায়ীভাবে মুছুন' : 'Delete All Data')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
