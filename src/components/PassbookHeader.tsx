import React, { useState } from 'react';
import { User, Edit, Printer, Phone, Calendar, Target, Hash, ShieldCheck, CreditCard, X, FileText, MapPin, Folder, Plus, Landmark, CheckCircle, RotateCcw } from 'lucide-react';
import styles from './PassbookHeader.module.css';
import { Member, Loan } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';
import { toBengaliNumber } from '@/lib/db';

interface PassbookHeaderProps {
  member: Member;
  loans?: Loan[];
  activeLoan?: Loan | null;
  lang: Language;
  onSelectLoan?: (loanId: string) => void;
  onOpenNewLoanModal?: () => void;
  onToggleLoanStatus?: (loanId: string, currentStatus?: 'active' | 'closed') => void;
  onEdit?: () => void;
  onPrint?: () => void;
}

export const PassbookHeader: React.FC<PassbookHeaderProps> = ({
  member,
  loans = [],
  activeLoan,
  lang,
  onSelectLoan,
  onOpenNewLoanModal,
  onToggleLoanStatus,
  onEdit,
  onPrint
}) => {
  const t = translations[lang];
  
  // NID Modal View state: 'member' | 'guarantor' | null
  const [nidViewType, setNidViewType] = useState<'member' | 'guarantor' | null>(null);

  const hasMemberNid = !!(member.nid_front_url || member.nid_back_url || member.nid_image_url);
  const hasGuarantorNid = !!(member.guarantor_nid_front_url || member.guarantor_nid_back_url || member.guarantor_photo_url);

  // Active Loan fallback to member defaults if activeLoan not passed
  const currentLoanAmount = activeLoan ? activeLoan.loan_amount : (member.loan_amount || 0);
  const currentLoanPurpose = activeLoan ? activeLoan.loan_purpose : (member.loan_purpose || '-');
  const currentTotalInstallments = activeLoan ? activeLoan.total_installments : (member.total_installments || 44);
  const currentAdmissionDate = activeLoan ? activeLoan.admission_date : (member.admission_date || '-');
  const currentLoanNo = activeLoan ? activeLoan.loan_no : 1;
  const isCurrentLoanClosed = activeLoan?.status === 'closed';

  // Multi-Loan Summaries Calculation
  const totalLoansCount = loans.length || 1;
  const completedLoansCount = loans.filter(l => l.status === 'closed').length;
  const activeLoansCount = Math.max(0, totalLoansCount - completedLoansCount);

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
                <span className="badge badge-info" style={{ marginLeft: 4 }}>
                  <Landmark size={12} style={{ display: 'inline', marginRight: 3 }} />
                  {t.loanNo} {toBengaliNumber(currentLoanNo)}
                </span>
              </div>

              {/* Total Loans, Active Loans & Completed Loans Count Badges Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <span className="badge badge-info" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', fontWeight: 600 }}>
                  📊 {t.totalLoansCount}: {toBengaliNumber(totalLoansCount)}{t.countSuffix || 'টি'}
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', fontWeight: 600 }}>
                  🟢 {t.activeLoansCount}: {toBengaliNumber(activeLoansCount)}{t.countSuffix || 'টি'}
                </span>
                {completedLoansCount > 0 && (
                  <span className="badge" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 600 }}>
                    ✅ {t.completedLoansCount}: {toBengaliNumber(completedLoansCount)}{t.countSuffix || 'টি'}
                  </span>
                )}
                {isCurrentLoanClosed ? (
                  <span className="badge" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 700, border: '1px solid #86efac' }}>
                    ✅ ঋণ পরিশোধিত (Closed)
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', fontWeight: 700 }}>
                    ⚡ চলতি ঋণ (Active)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={`${styles.actionsGroup} no-print`}>
            {/* Toggle Loan Completion Status Button */}
            {onToggleLoanStatus && activeLoan && (
              <button
                onClick={() => onToggleLoanStatus(activeLoan.id, activeLoan.status)}
                className={`btn btn-sm ${isCurrentLoanClosed ? 'btn-secondary' : 'btn-primary'}`}
                style={{
                  borderColor: isCurrentLoanClosed ? '#10b981' : '#f59e0b',
                  backgroundColor: isCurrentLoanClosed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: isCurrentLoanClosed ? '#047857' : '#d97706',
                  fontWeight: 700
                }}
                title={isCurrentLoanClosed ? 'ঋণটি পুনরায় সক্রিয় করুন' : 'ঋণটি পরিশোধিত/সমাপ্ত হিসেবে মার্ক করুন'}
              >
                {isCurrentLoanClosed ? <RotateCcw size={15} /> : <CheckCircle size={15} />}
                <span>{isCurrentLoanClosed ? 'ঋণ পুনরায় সক্রিয় করুন' : 'ঋণ সমাপ্ত (Complete) করুন'}</span>
              </button>
            )}

            {/* Google Drive Folder Link */}
            {member.drive_folder_url && (
              <a
                href={member.drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                title="গুগল ড্রাইভে সদস্যের সকল মূল ছবি ও ডকুমেন্টের ফোল্ডার খুলুন"
                style={{ borderColor: 'rgba(66, 133, 244, 0.4)', color: 'var(--text-main)' }}
              >
                <Folder size={15} style={{ color: '#4285F4' }} />
                <span>ড্রাইভ ফোল্ডার</span>
              </a>
            )}

            {/* View Member NID */}
            {hasMemberNid && (
              <button
                onClick={() => setNidViewType('member')}
                className="btn btn-secondary btn-sm"
                title="সদস্যের NID কার্ড দেখুন (Front & Back)"
              >
                <CreditCard size={15} />
                <span>সদস্য NID</span>
              </button>
            )}

            {/* View Guarantor NID */}
            {hasGuarantorNid && (
              <button
                onClick={() => setNidViewType('guarantor')}
                className="btn btn-secondary btn-sm"
                title="জামিনদারের NID কার্ড দেখুন (Front & Back)"
              >
                <ShieldCheck size={15} style={{ color: 'var(--primary)' }} />
                <span>জামিনদার NID</span>
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
            <span className={styles.label}>
              {t.loanAmount} {loans.length > 1 ? `(ঋণ ${toBengaliNumber(currentLoanNo)})` : ''}
            </span>
            <span className={styles.valueHighlight}>
              ৳ {Number(currentLoanAmount).toLocaleString()}
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.label}>
              {t.savingsInitial} {loans.length > 1 ? `(ঋণ ${toBengaliNumber(currentLoanNo)})` : ''}
            </span>
            <span className={styles.value}>
              ৳ {Number((!activeLoan || activeLoan.loan_no === 1) ? (member.savings_initial || 0) : 0).toLocaleString()}
            </span>
          </div>

          {/* Member Father / Mother / Spouse Details */}
          {member.father_mother_spouse && (
            <div className={styles.infoItem}>
              <span className={styles.label}>{t.fatherMotherSpouse}</span>
              <span className={styles.value}>{member.father_mother_spouse}</span>
            </div>
          )}

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

          {/* Jamindar Father / Mother / Spouse */}
          {member.guarantor_father_mother_spouse && (
            <div className={styles.infoItem}>
              <span className={styles.label}>{t.guarantorFatherMotherSpouse}</span>
              <span className={styles.value}>{member.guarantor_father_mother_spouse}</span>
            </div>
          )}

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
              {currentLoanPurpose}
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.label}>{t.totalInstallments}</span>
            <span className={styles.value}>{currentTotalInstallments}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.label}>{t.admissionDate}</span>
            <span className={styles.value}>
              <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
              {currentAdmissionDate}
            </span>
          </div>
        </div>

        {/* Multi-Loan Navigation Tabs Bar */}
        <div className={`${styles.loanTabsContainer} no-print`}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Landmark size={15} style={{ color: 'var(--primary)' }} />
            <span>{t.loanList}:</span>
          </span>

          {loans.map((l) => {
            const isActive = activeLoan ? (activeLoan.id === l.id || activeLoan.loan_no === l.loan_no) : l.loan_no === 1;
            const isClosed = l.status === 'closed';
            return (
              <button
                key={l.id}
                onClick={() => onSelectLoan && onSelectLoan(l.id)}
                className={`${styles.loanTab} ${isActive ? styles.loanTabActive : ''}`}
                style={{
                  borderLeft: isClosed ? '3px solid #10b981' : undefined
                }}
                title={`ঋণ ${l.loan_no} (৳ ${l.loan_amount.toLocaleString()}) - ${isClosed ? 'পরিশোধিত' : 'চলতি'}`}
              >
                <span>🏦 {t.loanNo} {toBengaliNumber(l.loan_no)} (৳ {l.loan_amount.toLocaleString()}) {isClosed ? '✅' : '🟢'}</span>
              </button>
            );
          })}

          {onOpenNewLoanModal && (
            <button
              onClick={onOpenNewLoanModal}
              className={styles.newLoanTabBtn}
              title={t.takeNewLoan}
            >
              <Plus size={15} />
              <span>{t.takeNewLoan}</span>
            </button>
          )}
        </div>
      </div>

      {/* NID Viewer Modal (Member or Guarantor NID Cards - Front & Rear) */}
      {nidViewType !== null && (
        <div className={styles.nidModalOverlay} onClick={() => setNidViewType(null)}>
          <div className={styles.nidModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={18} style={{ color: 'var(--primary)' }} />
                <span>
                  {nidViewType === 'member'
                    ? `সদস্যের NID কার্ড - ${member.name} (${member.nid_number || ''})`
                    : `জামিনদারের NID কার্ড - ${member.guarantor_name} (${member.guarantor_nid || ''})`}
                </span>
              </h3>
              <button onClick={() => setNidViewType(null)} className="btn btn-secondary btn-sm">
                <X size={18} />
              </button>
            </div>

            {/* Display Front & Rear Part Cards & Guarantor Photo */}
            <div className={styles.nidGrid}>
              {/* Guarantor Photo if present */}
              {nidViewType === 'guarantor' && member.guarantor_photo_url && (
                <div className={styles.nidCardBox} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.nidCardLabel}>
                    <User size={14} />
                    <span>জামিনদারের ছবি (Guarantor Photo)</span>
                  </span>
                  <img src={member.guarantor_photo_url} alt="Guarantor Photo" className={styles.nidImageFull} style={{ maxHeight: '220px', objectFit: 'contain' }} />
                </div>
              )}

              {/* Front Part Image */}
              <div className={styles.nidCardBox}>
                <span className={styles.nidCardLabel}>
                  <CreditCard size={14} />
                  <span>সামনের অংশ (Front Part)</span>
                </span>
                {nidViewType === 'member' ? (
                  (member.nid_front_url || member.nid_image_url) ? (
                    <img src={member.nid_front_url || member.nid_image_url} alt="NID Front" className={styles.nidImageFull} />
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      সামনের অংশের ছবি যুক্ত করা হয়নি
                    </div>
                  )
                ) : (
                  member.guarantor_nid_front_url ? (
                    <img src={member.guarantor_nid_front_url} alt="Guarantor NID Front" className={styles.nidImageFull} />
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      সামনের অংশের ছবি যুক্ত করা হয়নি
                    </div>
                  )
                )}
              </div>

              {/* Rear / Back Part Image */}
              <div className={styles.nidCardBox}>
                <span className={styles.nidCardLabel}>
                  <CreditCard size={14} />
                  <span>পেছনের অংশ (Rear/Back Part)</span>
                </span>
                {nidViewType === 'member' ? (
                  member.nid_back_url ? (
                    <img src={member.nid_back_url} alt="NID Back" className={styles.nidImageFull} />
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      পেছনের অংশের ছবি যুক্ত করা হয়নি
                    </div>
                  )
                ) : (
                  member.guarantor_nid_back_url ? (
                    <img src={member.guarantor_nid_back_url} alt="Guarantor NID Back" className={styles.nidImageFull} />
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      পেছনের অংশের ছবি যুক্ত করা হয়নি
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
