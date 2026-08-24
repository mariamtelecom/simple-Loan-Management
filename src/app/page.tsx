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
  CheckCircle2
} from 'lucide-react';
import styles from './page.module.css';
import { Navbar } from '@/components/Navbar';
import { MemberFormModal } from '@/components/MemberFormModal';
import { Member } from '@/lib/types';
import { getMembers, createMember, getCalculatedLedger, getDashboardStats } from '@/lib/db';
import { Language, translations } from '@/lib/i18n';

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>('bn');
  const t = translations[lang];

  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [stats, setStats] = useState({
    totalGranted: 0,
    totalCollected: 0,
    totalRemaining: 0,
    totalSavings: 0,
    activeCount: 0
  });

  const [memberSummaries, setMemberSummaries] = useState<{
    [id: string]: { remaining: number; savings: number };
  }>({});

  const loadData = async () => {
    const list = await getMembers();
    setMembers(list);

    const dbStats = await getDashboardStats();
    setStats(dbStats);

    const summariesMap: { [id: string]: { remaining: number; savings: number } } = {};
    for (const m of list) {
      const { summary } = await getCalculatedLedger(m);
      summariesMap[m.id] = {
        remaining: summary.remaining_loan,
        savings: summary.total_savings
      };
    }
    setMemberSummaries(summariesMap);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMember = async (data: Omit<Member, 'id' | 'created_at'>) => {
    await createMember(data);
    await loadData();
  };

  // Filter members by member_no, name or phone
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.member_no.toLowerCase().includes(q) ||
      m.mobile.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
        onOpenAddMemberModal={() => setIsAddModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="main-content">
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
                <DollarSign size={18} style={{ color: 'var(--accent-amber)' }} />
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
              <div className={`${styles.statVal} textGreen`}>
                ৳ {stats.totalCollected.toLocaleString()}
              </div>
            </div>

            {/* Remaining Loan */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>{t.remainingLoanBalance}</span>
                <DollarSign size={18} style={{ color: 'var(--accent-rose)' }} />
              </div>
              <div className={`${styles.statVal} textRose`}>
                ৳ {stats.totalRemaining.toLocaleString()}
              </div>
            </div>

            {/* Total Savings */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span>{t.totalSavingsBalance}</span>
                <Wallet size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div className={`${styles.statVal} textGreen`}>
                ৳ {stats.totalSavings.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Member Grid Title */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Users size={20} className="textGreen" />
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
                const summary = memberSummaries[m.id] || { remaining: m.loan_amount, savings: m.savings_initial };
                return (
                  <div key={m.id} className={styles.memberCard}>
                    <div className={styles.memberTop}>
                      <div className={styles.memberMeta}>
                        <span className={styles.memberNo}>{t.memberNo}: {m.member_no}</span>
                        <h3 className={styles.memberName}>{m.name}</h3>
                      </div>
                      <span className={styles.bookBadge}>{t.bookNo}: {m.book_no || '১'}</span>
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

                      <Link href={`/members/${m.id}`} className="btn btn-secondary btn-sm">
                        <span>পাসবই দেখুন</span>
                        <ArrowRight size={14} />
                      </Link>
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
    </>
  );
}
