'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, X, UserCheck } from 'lucide-react';
import styles from './SuccessModal.module.css';
import { Member } from '@/lib/types';
import { Language } from '@/lib/i18n';

interface SuccessModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  lang: Language;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  member,
  onClose,
  lang
}) => {
  if (!isOpen || !member) return null;

  const isBn = lang === 'bn';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconRing}>
          <CheckCircle2 size={38} />
        </div>

        <h3 className={styles.title}>
          {isBn ? 'সদস্য সফলভাবে যুক্ত করা হয়েছে!' : 'Member Created Successfully!'}
        </h3>
        <p className={styles.subtitle}>
          {isBn 
            ? 'নতুন সদস্যের সকল তথ্য সফলভাবে ডাটাবেজ ও ড্যাশবোর্ডে সংরক্ষিত হয়েছে।' 
            : 'New member details have been saved to the database & dashboard.'}
        </p>

        <div className={styles.cardDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{isBn ? 'সদস্য নম্বর:' : 'Member No:'}</span>
            <span className={styles.badge}>{member.member_no}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{isBn ? 'বই নং / পৃষ্ঠা:' : 'Book No:'}</span>
            <span className={styles.detailVal}>{member.book_no || '১'}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{isBn ? 'সদস্যের নাম:' : 'Name:'}</span>
            <span className={styles.detailVal}>{member.name}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{isBn ? 'মোবাইল নম্বর:' : 'Mobile:'}</span>
            <span className={styles.detailVal}>{member.mobile}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{isBn ? 'ঋণের পরিমাণ:' : 'Loan Amount:'}</span>
            <span className={styles.detailVal} style={{ color: 'var(--primary)' }}>
              ৳ {Number(member.loan_amount || 0).toLocaleString()}
            </span>
          </div>

          {member.guarantor_name && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{isBn ? 'জামিনদারের নাম:' : 'Guarantor:'}</span>
              <span className={styles.detailVal}>{member.guarantor_name}</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className="btn btn-secondary">
            <span>{isBn ? 'ড্যাশবোর্ডে থাকুন' : 'Stay on Dashboard'}</span>
          </button>

          <Link href={`/members/${member.id}`} className="btn btn-primary">
            <span>{isBn ? 'পাসবই দেখুন' : 'View Passbook'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
