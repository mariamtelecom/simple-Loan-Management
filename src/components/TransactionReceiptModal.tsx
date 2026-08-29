'use client';

import React from 'react';
import { X, Printer, CheckCircle, Landmark, Receipt } from 'lucide-react';
import styles from './TransactionReceiptModal.module.css';
import { EnrichedTransaction } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';
import { toBengaliNumber } from '@/lib/db';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  transaction: EnrichedTransaction | null;
  onClose: () => void;
  lang: Language;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  transaction,
  onClose,
  lang
}) => {
  const t = translations[lang];

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={`${styles.overlay} print-container`} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`${styles.header} no-print`}>
          <h2 className={styles.title}>
            <Receipt size={20} style={{ color: 'var(--primary)' }} />
            <span>লেনদেন রসিদ / জমা খতিয়ান</span>
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Voucher Content */}
        <div className={styles.receiptCard}>
          <div className={styles.receiptHeader}>
            <h1 className={styles.orgTitle}>{t.appTitle}</h1>
            <p className={styles.orgSub}>{t.appSubtitle}</p>
            <span className={styles.receiptBadge}>
              অফিসিয়াল লেনদেন রসিদ (Transaction Receipt)
            </span>
          </div>

          {/* Member & Transaction Meta Info */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCell}>
              <span className={styles.cellLabel}>তারিখ ও সময়:</span>
              <span className={styles.cellValue}>{transaction.date}</span>
            </div>

            <div className={styles.infoCell}>
              <span className={styles.cellLabel}>রসিদ নম্বর / ID:</span>
              <span className={styles.cellValue} style={{ fontSize: '0.8rem' }}>
                {transaction.id || 'N/A'}
              </span>
            </div>

            <div className={styles.infoCell}>
              <span className={styles.cellLabel}>সদস্যের নাম:</span>
              <span className={styles.cellValue}>{transaction.memberName}</span>
            </div>

            <div className={styles.infoCell}>
              <span className={styles.cellLabel}>সদস্য নম্বর & বই নং:</span>
              <span className={styles.cellValue}>
                {transaction.memberNo} (বই নং: {transaction.bookNo || '১'})
              </span>
            </div>

            <div className={styles.infoCell}>
              <span className={styles.cellLabel}>ঋণ অ্যাকাউন্ট:</span>
              <span className={styles.cellValue}>
                ঋণ নং {toBengaliNumber(transaction.loanNo)}
              </span>
            </div>

            <div className={styles.infoCell}>
              <span className={styles.cellLabel}>কিস্তি নম্বর:</span>
              <span className={styles.cellValue}>
                {transaction.installment_no ? `কিস্তি নং ${toBengaliNumber(transaction.installment_no)}` : 'সাধারণ জমা/উত্তোলন'}
              </span>
            </div>
          </div>

          {/* Transaction Breakdowns Table */}
          <table className={styles.amountTable}>
            <thead>
              <tr>
                <th>লেনদেনের বিবরণ (Item)</th>
                <th style={{ textAlign: 'right' }}>পরিমাণ (Amount)</th>
              </tr>
            </thead>
            <tbody>
              {transaction.savings_deposit > 0 && (
                <tr>
                  <td style={{ color: '#047857', fontWeight: 600 }}>🟢 সঞ্চয় জমা (Savings Deposit)</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                    ৳ {transaction.savings_deposit.toLocaleString()}
                  </td>
                </tr>
              )}

              {transaction.savings_withdraw > 0 && (
                <tr>
                  <td style={{ color: '#e11d48', fontWeight: 600 }}>🔴 সঞ্চয় উত্তোলন (Savings Withdrawal)</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#e11d48' }}>
                    ৳ {transaction.savings_withdraw.toLocaleString()}
                  </td>
                </tr>
              )}

              {transaction.loan_repayment > 0 && (
                <tr>
                  <td style={{ color: '#2563eb', fontWeight: 600 }}>🔵 ঋণের কিস্তি আদায় (Loan Repayment)</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                    ৳ {transaction.loan_repayment.toLocaleString()}
                  </td>
                </tr>
              )}

              {transaction.notes && (
                <tr>
                  <td colSpan={2} style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                    মন্তব্য: {transaction.notes}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Signature Lines */}
          <div className={styles.signatureRow}>
            <div className={styles.sigLine}>
              সদস্যের স্বাক্ষর
            </div>

            <div className={styles.sigLine}>
              আদায়কারীর স্বাক্ষর
              <br />
              <strong style={{ color: '#0f172a' }}>({transaction.collector_signature || 'জসিম'})</strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`${styles.footer} no-print`}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            {t.cancel}
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={16} />
            <span>প্রিন্ট রসিদ (Print Receipt)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
