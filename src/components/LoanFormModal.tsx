'use client';

import React, { useState } from 'react';
import { X, PlusCircle, UserCheck } from 'lucide-react';
import styles from './LoanFormModal.module.css';
import { Member, Loan } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

import { ExistingLoanSummary } from './ExistingLoansAlertModal';
import { toBengaliNumber } from '@/lib/db';

interface LoanFormModalProps {
  isOpen: boolean;
  member: Member;
  existingLoanSummaries?: ExistingLoanSummary[];
  onClose: () => void;
  onSave: (loan: Omit<Loan, 'id' | 'created_at'>, initialSavings: number) => Promise<void>;
  lang: Language;
}

export const LoanFormModal: React.FC<LoanFormModalProps> = ({
  isOpen,
  member,
  existingLoanSummaries = [],
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

  const [loanAmount, setLoanAmount] = useState('');
  const [savingsInitial, setSavingsInitial] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('ব্যবসা সম্প্রসারণ');
  const [totalInstallments, setTotalInstallments] = useState('44');
  const [admissionDate, setAdmissionDate] = useState(getNowDateTimeLocal());
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanAmount || Number(loanAmount) <= 0) {
      alert('অনুগ্রহ করে সঠিক ঋণের পরিমাণ লিখুন');
      return;
    }

    // Format ISO/Readable DateTime String (e.g., 2026-08-29 01:04 PM)
    const dt = new Date(admissionDate);
    const dateFormatted = isNaN(dt.getTime()) 
      ? admissionDate 
      : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setSubmitting(true);
    try {
      await onSave({
        member_id: member.id,
        loan_no: 0, // Auto calculated in db helper
        loan_amount: Number(loanAmount),
        loan_purpose: loanPurpose,
        total_installments: Number(totalInstallments || 44),
        admission_date: dateFormatted,
        status: 'active'
      }, Number(savingsInitial || 0));
      onClose();
    } catch (err) {
      console.error('Failed to create new loan', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{t.takeNewLoanTitle}</h2>
            <p className={styles.subtitle}>{t.takeNewLoanSubtitle}</p>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.form}>
            {/* Member Info Display */}
            <div className={styles.memberInfoBox}>
              <UserCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {member.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t.memberNo}: {member.member_no} | {t.bookNo}: {member.book_no || '১'}
                </div>
              </div>
            </div>

            {/* Existing Loans Completion Summary Box */}
            {existingLoanSummaries && existingLoanSummaries.length > 0 && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  📊 পূর্ববর্তী ঋণের অগ্রগতি:
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {existingLoanSummaries.map(({ loan, summary }) => (
                    <span key={loan.id} className="badge badge-info" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', fontWeight: 600 }}>
                      🏦 ঋণ {toBengaliNumber(loan.loan_no)}: {summary.repayment_progress}% পরিশোধিত ({summary.remaining_loan <= 0 ? 'Closed' : `অবশিষ্ট ৳${summary.remaining_loan.toLocaleString()}`})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Loan Amount & Savings Initial */}
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>{t.loanAmount} (৳) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  className={styles.input}
                  placeholder="e.g. 500000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t.savingsInitial} (৳)</label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  placeholder="e.g. 10000"
                  value={savingsInitial}
                  onChange={(e) => setSavingsInitial(e.target.value)}
                />
              </div>
            </div>

            {/* Loan Purpose & Installments */}
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>{t.loanPurpose} *</label>
                <input
                  type="text"
                  required
                  className={styles.input}
                  placeholder="e.g. নতুন ব্যবসা সম্প্রসারণ..."
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t.totalInstallments} *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className={styles.input}
                  placeholder="e.g. 44"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value)}
                />
              </div>
            </div>

            {/* Loan Admission Date & Time */}
            <div className={styles.field}>
              <label className={styles.label}>{t.admissionDate} (তারিখ ও সময়) *</label>
              <input
                type="datetime-local"
                required
                className={styles.input}
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
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
              <span>{submitting ? 'সংরক্ষণ হচ্ছে...' : t.takeNewLoan}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

