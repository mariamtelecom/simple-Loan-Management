'use client';

import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import styles from './TransactionModal.module.css';
import { Transaction } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

interface TransactionModalProps {
  isOpen: boolean;
  memberId: string;
  loanId?: string;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  lang: Language;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  memberId,
  loanId,
  onClose,
  onSave,
  lang
}) => {
  const t = translations[lang];

  const getNowDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [date, setDate] = useState(getNowDateTimeLocal());
  const [savingsDeposit, setSavingsDeposit] = useState('');
  const [savingsWithdraw, setSavingsWithdraw] = useState('');
  const [installmentNo, setInstallmentNo] = useState('');
  const [loanRepayment, setLoanRepayment] = useState('');
  const [collectorSignature, setCollectorSignature] = useState('মেহেদুল');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dep = Number(savingsDeposit || 0);
    const wth = Number(savingsWithdraw || 0);
    const rep = Number(loanRepayment || 0);

    // Require at least one amount field to be non-zero
    if (dep <= 0 && wth <= 0 && rep <= 0) {
      setErrorMsg(
        lang === 'bn'
          ? 'কমপক্ষে একটি ঘরে (জমা, উত্তোলন বা আদায়) টাকার পরিমাণ বসান'
          : 'Please enter an amount in at least one field (Deposit, Withdraw, or Collection)'
      );
      return;
    }

    setErrorMsg('');

    // Format ISO/Readable DateTime String (e.g., 2026-08-29 01:04 PM)
    const dt = new Date(date);
    const dateFormatted = isNaN(dt.getTime())
      ? date
      : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setSubmitting(true);
    try {
      await onSave({
        member_id: memberId,
        loan_id: loanId,
        date: dateFormatted,
        savings_deposit: dep,
        savings_withdraw: wth,
        installment_no: installmentNo ? Number(installmentNo) : null,
        loan_repayment: rep,
        collector_signature: collectorSignature,
        notes
      });
      onClose();
    } catch (err) {
      console.error('Failed adding transaction', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t.addTransaction}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.form}>
            {/* Validation Error Banner */}
            {errorMsg && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  marginBottom: '0.5rem',
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date & Time */}
            <div className={styles.field}>
              <label className={styles.label}>{t.date} (তারিখ ও সময়) *</label>
              <input
                type="datetime-local"
                required
                className={styles.input}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Savings Deposit & Withdraw */}
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>{t.deposit} (৳)</label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  placeholder={t.enterAmount || "টাকার পরিমাণ বসান"}
                  value={savingsDeposit}
                  onChange={(e) => {
                    setSavingsDeposit(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t.withdraw} (৳)</label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  placeholder={t.enterAmount || "টাকার পরিমাণ বসান"}
                  value={savingsWithdraw}
                  onChange={(e) => {
                    setSavingsWithdraw(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
              </div>
            </div>

            {/* Installment No & Loan Repayment */}
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>{t.installmentNo}</label>
                <input
                  type="number"
                  min="1"
                  className={styles.input}
                  placeholder={t.enterInstallmentNo || "কিস্তি নম্বর"}
                  value={installmentNo}
                  onChange={(e) => setInstallmentNo(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t.collection} (৳)</label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  placeholder={t.enterAmount || "টাকার পরিমাণ বসান"}
                  value={loanRepayment}
                  onChange={(e) => {
                    setLoanRepayment(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
              </div>
            </div>

            {/* Collector Signature */}
            <div className={styles.field}>
              <label className={styles.label}>{t.collectorName}</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. মেহেদুল / Collector Name"
                value={collectorSignature}
                onChange={(e) => setCollectorSignature(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className={styles.field}>
              <label className={styles.label}>{t.notes}</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. কিস্তি জমা..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              disabled={submitting}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting}
            >
              <PlusCircle size={16} />
              <span>{submitting ? '...' : t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
