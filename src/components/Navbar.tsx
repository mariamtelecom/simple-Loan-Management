'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Search, Globe, Database } from 'lucide-react';
import styles from './Navbar.module.css';
import { Language, translations } from '@/lib/i18n';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenAddMemberModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenAddMemberModal,
  searchQuery = '',
  onSearchChange
}) => {
  const t = translations[lang];

  return (
    <header className={styles.navbar}>
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
            {/* Supabase / Local Mode Indicator */}
            <div className={styles.dbBadge}>
              <Database size={12} />
              <span className={styles.dbDot}></span>
              <span>{isSupabaseConfigured ? t.dbModeSupabase : t.dbModeLocal}</span>
            </div>

            {/* Search Input if search handler provided */}
            {onSearchChange !== undefined && (
              <div className={styles.searchBox}>
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

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className={styles.langBtn}
              title="Switch Language / ভাষা পরিবর্তন"
            >
              <Globe size={14} />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Add Member CTA */}
            {onOpenAddMemberModal && (
              <button
                onClick={onOpenAddMemberModal}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                <span>{t.addMember}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
