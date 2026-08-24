'use client';

import React, { useState } from 'react';
import { User, Edit, Printer, Phone, Calendar, Target, Hash, ShieldCheck, CreditCard, X, FileText, MapPin } from 'lucide-react';
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
  const [showNidModal, setShowNidModal] = useState(false);

  return (
    <>
      <div className={styles.passbookCard}>
        {/* Top Title & Profile Avatar */}
        <div className={styles.topRow}>
          <div className={styles.profileArea}>
            <div className={styles.avatarBox}>
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} className={styles.avatarImg} />
              ) : (
                <User size={30} />
              )}
            </div>

            <div className={styles.titleArea}>
              <div className={styles.nameRow}>
                <span className={styles.bookBadge}>
                  {t.bookNo}: {member.book_no || '১'}
                </span>
                <h1 className={styles.memberName}>{member.name}</h1>
                <span className={styles.memberNoTag}>
                  <Hash size={12} style={{ display: 'inline', marginRight: 2 }} />
                  {t.memberNo}: {member.member_no}
                </span>
              </div>
            </div>
          </div>

          <div className={`${styles.actionsGroup} no-print`}>
            {member.nid_image_url && (
              <button
                onClick={() => setShowNidModal(true)}
                className="btn btn-secondary btn-sm"
                title={t.viewNid}
              >
                <CreditCard size={15} />
                <span>{t.viewNid}</span>
              </button>
            )}

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

        {/* Grid of Passbook Header Details */}
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

          {/* Member Mobile */}
          <div className={styles.infoItem}>
            <span className={styles.label}>{t.mobile}</span>
            <span className={styles.value}>
              <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
              {member.mobile || '-'}
            </span>
          </div>

          {/* Member NID Card Number */}
          <div className={styles.infoItem}>
            <span className={styles.label}>{t.nidNumber}</span>
            <span className={styles.value}>
              <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
              {member.nid_number || '-'}
            </span>
          </div>

          {/* Member Address */}
          <div className={styles.infoItem}>
            <span className={styles.label}>{t.memberAddress}</span>
            <span className={styles.value}>
              <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
              {member.address || '-'}
            </span>
          </div>

          {/* Jamindar Name */}
          <div className={styles.infoItem}>
            <span className={styles.label}>{t.guarantorName}</span>
            <span className={styles.value} style={{ color: 'var(--primary)', fontWeight: 700 }}>
              <ShieldCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
              {member.guarantor_name || '-'}
            </span>
          </div>

          {/* Jamindar Mobile */}
          <div className={styles.infoItem}>
            <span className={styles.label}>{t.guarantorMobile}</span>
            <span className={styles.value}>
              <Phone size={14} style={{ display: 'inline', marginRight: 4, color: 'var(--primary)' }} />
              {member.guarantor_mobile || '-'}
            </span>
          </div>

          {/* Jamindar Address / NID */}
          <div className={styles.infoItem}>
            <span className={styles.label}>{t.guarantorAddress}</span>
            <span className={styles.value}>
              <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
              {member.guarantor_address || '-'}
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
        </div>
      </div>

      {/* NID Viewer Modal */}
      {showNidModal && member.nid_image_url && (
        <div className={styles.nidModalOverlay} onClick={() => setShowNidModal(false)}>
          <div className={styles.nidModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {t.nidImage} - {member.name} ({member.nid_number || ''})
              </h3>
              <button onClick={() => setShowNidModal(false)} className="btn btn-secondary btn-sm">
                <X size={18} />
              </button>
            </div>
            <img src={member.nid_image_url} alt="NID Card" className={styles.nidImageFull} />
          </div>
        </div>
      )}
    </>
  );
};
