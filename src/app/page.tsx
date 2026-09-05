'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  Wallet, 
  Plus, 
  ArrowRight, 
  Phone, 
  Search,
  CheckCircle2,
  User,
  ShieldCheck,
  FileText,
  Trash2,
  Landmark,
  Clock
} from 'lucide-react';
import styles from './page.module.css';
import { Navbar } from '@/components/Navbar';
import { MemberFormModal } from '@/components/MemberFormModal';
import { SuccessModal } from '@/components/SuccessModal';
import { DeleteMemberModal } from '@/components/DeleteMemberModal';
import { DeleteSuccessModal } from '@/components/DeleteSuccessModal';
import { DeleteAllDataModal } from '@/components/DeleteAllDataModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Member } from '@/lib/types';
import { getDashboardDataBatch, createMember, deleteMember, deleteAllData } from '@/lib/db';
import { Language, translations } from '@/lib/i18n';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<Language>('bn');
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [createdSuccessMember, setCreatedSuccessMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [deletedSuccessInfo, setDeletedSuccessInfo] = useState<{ name: string; memberNo?: string } | null>(null);

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: getDashboardDataBatch,
    staleTime: 5 * 60 * 1000,
  });

  const members = dashboardData?.members || [];
  const stats = dashboardData?.stats || {
    totalGranted: 0,
    totalCollected: 0,
    totalRemaining: 0,
    totalSavings: 0,
    activeCount: 0
  };
  const memberSummaries = dashboardData?.memberSummaries || {};

  const handleCreateMember = async (data: Omit<Member, 'id' | 'created_at'>) => {
    const newM = await createMember(data);
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    setCreatedSuccessMember(newM);
  };

  const handleConfirmDeleteDashboardMember = async (id: string) => {
    const targetMember = members.find((m) => m.id === id);
    const name = targetMember?.name || '';
    const memberNo = targetMember?.member_no || '';
    await deleteMember(id);
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    setDeletingMember(null);
    setDeletedSuccessInfo({ name, memberNo });
  };

  const handleConfirmDeleteAll = async () => {
    await deleteAllData();
    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    setIsDeleteAllModalOpen(false);
  };

  // Filter members by member_no, name, mobile, nid_number, relative name, or guarantor details
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.member_no.toLowerCase().includes(q) ||
      m.mobile.toLowerCase().includes(q) ||
      (m.nid_number && m.nid_number.toLowerCase().includes(q)) ||
      (m.father_mother_spouse && m.father_mother_spouse.toLowerCase().includes(q)) ||
      (m.guarantor_name && m.guarantor_name.toLowerCase().includes(q)) ||
      (m.guarantor_father_mother_spouse && m.guarantor_father_mother_spouse.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="main-content hasSearch">
        <div className="container">
          {/* Hero Header */}
          <div className={styles.dashboardHeader}>
            <div>
              <h1 className={styles.heroTitle}>{t.dashboard}</h1>
              <p className={styles.heroSub}>{t.appSubtitle}</p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={18} />
              <span>{t.addMember}</span>
            </button>
          </div>

          {/* Top 5 Metrics Overview */}
          <div className={styles.statsGrid}>
            {/* Active Members */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>{t.activeMembers}</span>
                <Users size={18} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div className={styles.statVal}>{stats.activeCount}</div>
            </div>

            {/* Total Granted Loan */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>{t.totalGrantedLoan}</span>
                <img src="/taka.png" alt="৳" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
              </div>
              <div className={styles.statVal}>
                ৳ {stats.totalGranted.toLocaleString()}
              </div>
            </div>

            {/* Total Collected */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>{t.totalCollectedLoan}</span>
                <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="textGreen" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                ৳ {stats.totalCollected.toLocaleString()}
              </div>
            </div>

            {/* Remaining Loan */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>{t.remainingLoanBalance}</span>
                <img src="/taka.png" alt="৳" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
              </div>
              <div className="textRose" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                ৳ {stats.totalRemaining.toLocaleString()}
              </div>
            </div>

            {/* Total Savings */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>{t.totalSavingsBalance}</span>
                <Wallet size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="textGreen" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                ৳ {stats.totalSavings.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Member Grid Title */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Users size={20} style={{ color: 'var(--primary)' }} />
              <span>{t.memberList}</span>
            </h2>
            <span className="badge badge-info">
              {filteredMembers.length} {t.activeMembers}
            </span>
          </div>

          {/* Member Cards Grid */}
          {filteredMembers.length > 0 ? (
            <div className={styles.membersGrid}>
              {filteredMembers.map((m) => {
                const summary = memberSummaries[m.id] || { 
                  remaining: m.loan_amount, 
                  savings: m.savings_initial,
                  loanCount: 1,
                  completedLoanCount: 0,
                  activeLoanCount: 1
                };
                return (
                  <div key={m.id} className={styles.memberCard}>
                    <div className={styles.memberTop}>
                      {/* Avatar Photo (or Default Icon) */}
                      <div className={styles.cardAvatar}>
                        {m.photo_url ? (
                          <img src={m.photo_url} alt={m.name} className={styles.cardAvatarImg} />
                        ) : (
                          <User size={24} />
                        )}
                      </div>

                      <div className={styles.memberMeta}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className={styles.memberNo}>{t.memberNo}: {m.member_no}</span>
                          <span className={styles.bookBadge}>{t.bookNo}: {m.book_no || '১'}</span>
                        </div>
                        <h3 className={styles.memberName}>{m.name}</h3>

                        {m.guarantor_name && (
                          <div className={styles.guarantorText}>
                            <ShieldCheck size={13} style={{ color: 'var(--primary)' }} />
                            <span>জামিনদার: {m.guarantor_name}</span>
                          </div>
                        )}

                        {m.nid_number && (
                          <div className={styles.guarantorText} style={{ color: 'var(--text-muted)' }}>
                            <FileText size={12} />
                            <span>NID: {m.nid_number}</span>
                          </div>
                        )}

                        {/* Loan Count Badges (Total, Completed, Active) */}
                        <div className={styles.loanBadgeRow}>
                          <span className={styles.loanCountPill} title={t.totalLoansCount}>
                            <Landmark size={11} />
                            <span>{t.totalLoansCount}: {summary.loanCount || 1}{t.countSuffix}</span>
                          </span>

                          {summary.completedLoanCount > 0 && (
                            <span className={styles.completedCountPill} title={t.completedLoansCount}>
                              <CheckCircle2 size={11} />
                              <span>{t.completedLoansCount}: {summary.completedLoanCount}{t.countSuffix}</span>
                            </span>
                          )}

                          <span className={styles.activeCountPill} title={t.activeLoansCount}>
                            <Clock size={11} />
                            <span>{t.activeLoansCount}: {summary.activeLoanCount || 1}{t.countSuffix}</span>
                          </span>
                        </div>
                      </div>
                    </div>


                    <div className={styles.financialRow}>
                      <div className={styles.finBox}>
                        <span className={styles.finLabel}>{t.remainingLoanBalance}</span>
                        <span className={`${styles.finVal} textRose`}>
                          ৳ {summary.remaining.toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.finBox}>
                        <span className={styles.finLabel}>{t.totalSavings}</span>
                        <span className={`${styles.finVal} textGreen`}>
                          ৳ {summary.savings.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.mobileText}>
                        <Phone size={13} />
                        <span>{m.mobile || '-'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => setDeletingMember(m)}
                          className="btn btn-danger btn-sm"
                          title="সদস্য স্থায়ীভাবে মুছে ফেলুন"
                          style={{ padding: '0.4rem 0.55rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <Link href={`/members/${m.id}`} className="btn btn-secondary btn-sm">
                          <span>পাসবই দেখুন</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Search size={36} />
              <p>কোনো সদস্য পাওয়া যায়নি। নতুন সদস্য যোগ করতে উপরের বাটনটিতে চাপুন।</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                <span>{t.addMember}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Member Creation Modal */}
      <MemberFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateMember}
        lang={lang}
      />

      {/* New Member Creation Success Confirmation Modal */}
      <SuccessModal
        isOpen={createdSuccessMember !== null}
        member={createdSuccessMember}
        onClose={() => setCreatedSuccessMember(null)}
        lang={lang}
      />

      {/* 2-Step Verification Delete Member Modal */}
      <DeleteMemberModal
        isOpen={deletingMember !== null}
        member={deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirmDelete={handleConfirmDeleteDashboardMember}
        lang={lang}
      />

      {/* Member Delete Success Confirmation Modal */}
      <DeleteSuccessModal
        isOpen={deletedSuccessInfo !== null}
        memberName={deletedSuccessInfo?.name || ''}
        memberNo={deletedSuccessInfo?.memberNo}
        onClose={() => setDeletedSuccessInfo(null)}
        lang={lang}
      />

      {/* 2-Step Verification Delete All Data Modal */}
      <DeleteAllDataModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirmDeleteAll={handleConfirmDeleteAll}
        lang={lang}
      />
    </>
  );
}
