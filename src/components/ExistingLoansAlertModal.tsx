'use client';

import React from 'react';
import { X, AlertTriangle, Landmark, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import styles from './ExistingLoansAlertModal.module.css';
import { Member, Loan, FinancialSummary } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';
import { toBengaliNumber } from '@/lib/db';

export interface ExistingLoanSummary {
  loan: Loan;
  summary: FinancialSummary;
}

interface ExistingLoansAlertModalProps {
  isOpen: boolean;
  member: Member;
  loanSummaries: ExistingLoanSummary[];
  onClose: () => void;
  onProceedToNewLoan: () => void;
  lang: Language;
}

export const ExistingLoansAlertModal: React.FC<ExistingLoansAlertModalProps> = ({
  isOpen,
  member,
  loanSummaries,
  onClose,
  onProceedToNewLoan,
  lang
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header Alert */}
        <div className={styles.header}>
          <div className={styles.headerTitleBox}>
            <div className={styles.alertIcon}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className={styles.title}>পূর্ববর্তী ঋণের অগ্রগতি অ্যালার্ট!</h2>
              <p className={styles.subtitle}>
                {member.name} (সদস্য নং: {member.member_no}) এর পূর্ববর্তী ঋণের বর্তমান স্ট্যাটাস
              </p>
            </div>
          </div>

          <button onClick={onClose} className={styles.closeBtn} title={t.cancel}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          <div className={styles.alertNoteBox}>
            <Info size={20} style={{ flexShrink: 0 }} />
            <span>
              এই সদস্যের ইতিমধ্যে <strong>{toBengaliNumber(loanSummaries.length)}টি</strong> ঋণ রয়েছে। নিচে প্রতিটি ঋণের পরিশোধের শতকরা অগ্রগতি (%) বিস্তারিত দেখানো হলো।
            </span>
          </div>

          {/* List of Previous Loans with Progress % */}
          <div className={styles.loansList}>
            {loanSummaries.map(({ loan, summary }) => {
              const isClosed = loan.status === 'closed' || summary.remaining_loan <= 0;
              const pct = summary.repayment_progress || 0;

              let barColor = 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'; // Blue default
              if (isClosed || pct >= 100) {
                barColor = 'linear-gradient(90deg, #10b981 0%, #059669 100%)'; // Emerald Green
              } else if (pct >= 60) {
                barColor = 'linear-gradient(90deg, #059669 0%, #10b981 100%)'; // Green
              } else if (pct >= 30) {
                barColor = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'; // Amber
              } else {
                barColor = 'linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)'; // Rose
              }

              return (
                <div key={loan.id} className={styles.loanCard}>
                  <div className={styles.loanHeaderRow}>
                    <span className={styles.loanTitle}>
                      <Landmark size={16} style={{ color: 'var(--primary)' }} />
                      <span>ঋণ নং {toBengaliNumber(loan.loan_no)} — ৳ {Number(loan.loan_amount).toLocaleString()}</span>
                    </span>

                    {isClosed ? (
                      <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 700, border: '1px solid #fca5a5' }}>
                        🔴 সম্পূর্ণ পরিশোধিত (100% Paid)
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        🟢 চলতি ঋণ (Running)
                      </span>
                    )}
                  </div>

                  <div className={styles.loanMeta}>
                    <span>উদ্দেশ্য: {loan.loan_purpose || 'সাধারণ ঋণ'}</span> • <span>তারিখ: {loan.admission_date}</span>
                  </div>

                  {/* Financial Metrics */}
                  <div className={styles.financialRow}>
                    <div>
                      <span className={styles.finLabel}>আদায়কৃত ঋণ: </span>
                      <span className={`${styles.finVal} textGreen`}>
                        ৳ {summary.total_repaid.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className={styles.finLabel}>অবশিষ্ট স্থিতি: </span>
                      <span className={`${styles.finVal} textRose`}>
                        ৳ {summary.remaining_loan.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Repayment Progress Percentage Bar */}
                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>পরিশোধের অগ্রগতি:</span>
                      <span className={styles.pctBadge}>
                        {pct}% সম্পূর্ণ
                      </span>
                    </div>

                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: `${Math.min(100, Math.max(0, pct))}%`,
                          background: barColor
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            {t.cancel}
          </button>

          <button onClick={onProceedToNewLoan} className="btn btn-primary btn-sm">
            <span>নতুন ঋণ ফরম খুলুন</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
