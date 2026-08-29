'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Search, Globe, Database, Download, ShieldCheck, LogOut, Trash2, Receipt } from 'lucide-react';
import styles from './Navbar.module.css';
import { Language, translations } from '@/lib/i18n';
import { isPrimaryConfigured } from '@/lib/supabaseClient';
import { exportFullBackupJSON } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenAddMemberModal?: () => void;
  onScrollToRecentTransactions?: () => void;
  onOpenDeleteAllModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenAddMemberModal,
  onScrollToRecentTransactions,
  onOpenDeleteAllModal,
  searchQuery = '',
  onSearchChange
}) => {
  const t = translations[lang];
  const { requestLogoutConfirmation } = useAuth();

  const dbBadgeLabel = isPrimaryConfigured ? t.dbModeSupabase : t.dbModeLocal;

  return (
    <header className={`${styles.navbar} ${onSearchChange !== undefined ? styles.hasSearch : ''}`}>
      <div className="container">
        <div className={styles.inner}>
          {/* Left Brand */}
          <Link href="/" className={styles.brand}>
            <div className={styles.logoIcon}>
              <BookOpen size={22} />
            </div>
            <div className={styles.titleGroup}>
              <span className={styles.brandTitle}>{t.appTitle}</span>
              <span className={styles.brandSubtitle}>{t.appSubtitle}</span>
            </div>
          </Link>

          {/* Right Controls */}
          <div className={styles.rightGroup}>
            {/* Supabase Sync Status Badge */}
            <div className={styles.dbBadge} title="Supabase Cloud DB + Local Backup">
              <ShieldCheck size={13} style={{ color: 'var(--primary)' }} />
              <span className={styles.dbDot}></span>
              <span>{dbBadgeLabel}</span>
            </div>

            {/* Desktop Search Input */}
            {onSearchChange !== undefined && (
              <div className={`${styles.searchBox} ${styles.desktopSearch}`}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            )}

            {/* Export Backup JSON Button */}
            <button
              onClick={exportFullBackupJSON}
              className="btn btn-secondary btn-sm"
              title="ডাটাবেজ ব্যাকআপ ফাইল ডাউনলোড করুন (JSON Backup)"
            >
              <Download size={14} />
              <span className={styles.btnLabel}>ব্যাকআপ ফাইল</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className={styles.langBtn}
              title="Switch Language / ভাষা পরিবর্তন"
            >
              <Globe size={14} />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Recent Transactions Page Link (Replaces duplicate Add Member button in Navbar) */}
            <Link
              href="/transactions"
              className="btn btn-primary btn-sm"
              title="সকল সদস্যদের সাম্প্রতিক লেনদেন লগে যান"
            >
              <Receipt size={15} />
              <span className={styles.btnLabel}>সাম্প্রতিক লেনদেন</span>
            </Link>

            {/* Firebase Logout */}
            <button
              onClick={requestLogoutConfirmation}
              className="btn btn-secondary btn-sm"
              title="লগআউট করুন (Logout)"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <LogOut size={14} />
              <span className={styles.btnLabel}>লগআউট</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Row (Row 2 on mobile view when search is enabled) */}
        {onSearchChange !== undefined && (
          <div className={styles.mobileSearchRow}>
            <div className={styles.searchBoxMobile}>
              <Search size={16} className={styles.searchIconMobile} />
              <input
                type="text"
                className={styles.searchInputMobile}
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
