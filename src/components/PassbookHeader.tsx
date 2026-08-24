'use client';

import React from 'react';
import { User, Edit, Printer, Phone, Calendar, Target, Hash } from 'lucide-react';
import styles from './PassbookHeader.module.css';
import { Member } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

interface PassbookHeaderProps {
  member: Member;
  lang: Language;
  onEdit?: () => void;
  onPrint?: () => void;
}

export const PassbookHeader: React.FC<PassbookHeaderProps> = ({
  member,
  lang,
  onEdit,
  onPrint
}) => {
  const t = translations[lang];

  return (
    <div className={styles.passbookCard}>
      {/* Top Title & Quick Actions */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <span className={styles.bookBadge}>
            {t.bookNo}: {member.book_no || '১'}
          </span>
          <h1 className={styles.memberName}>{member.name}</h1>
          <span className={styles.memberNoTag}>
            <Hash size={12} style={{ display: 'inline', marginRight: 2 }} />
            {t.memberNo}: {member.member_no}
          </span>
        </div>

        <div className={`${styles.actionsGroup} no-print`}>
          {onEdit && (
            <button onClick={onEdit} className="btn btn-secondary btn-sm" title={t.editMember}>
              <Edit size={15} />
              <span>{t.editMember}</span>
            </button>
          )}
          {onPrint && (
            <button onClick={onPrint} className="btn btn-primary btn-sm" title={t.printPassbook}>
              <Printer size={15} />
              <span>{t.printPassbook}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Passbook Info matching physical Bengali book header */}
      <div className={styles.gridInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>{t.loanAmount}</span>
          <span className={styles.valueHighlight}>
            ৳ {Number(member.loan_amount || 0).toLocaleString()}
          </span>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>{t.savingsInitial}</span>
          <span className={styles.value}>
            ৳ {Number(member.savings_initial || 0).toLocaleString()}
          </span>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>{t.loanPurpose}</span>
          <span className={styles.value}>
            <Target size={14} style={{ display: 'inline', marginRight: 4 }} />
            {member.loan_purpose || '-'}
          </span>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>{t.totalInstallments}</span>
          <span className={styles.value}>{member.total_installments || 44}</span>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>{t.admissionDate}</span>
          <span className={styles.value}>
            <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
            {member.admission_date || '-'}
          </span>
        </div>

        <div className={styles.infoItem}>
          <span className={styles.label}>{t.mobile}</span>
          <span className={styles.value}>
            <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
            {member.mobile || '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
