'use client';

import React from 'react';
import styles from './PassbookSkeleton.module.css';

export const PassbookSkeleton: React.FC = () => {
  return (
    <div className={styles.skeletonContainer}>
      {/* Top Bar Skeleton */}
      <div className={styles.topBarSkeleton}>
        <div className={`${styles.skeleton}`} style={{ width: '140px', height: '36px' }} />
        <div className={styles.actionBtnsSkeleton}>
          <div className={`${styles.skeleton}`} style={{ width: '130px', height: '36px' }} />
          <div className={`${styles.skeleton}`} style={{ width: '110px', height: '36px' }} />
          <div className={`${styles.skeleton}`} style={{ width: '120px', height: '36px' }} />
          <div className={`${styles.skeleton}`} style={{ width: '100px', height: '36px' }} />
          <div className={`${styles.skeleton}`} style={{ width: '40px', height: '36px' }} />
        </div>
      </div>

      {/* Member Passbook Top Header Skeleton */}
      <div className={styles.headerCardSkeleton}>
        {/* Top Profile Avatar & Name Area */}
        <div className={styles.topRowSkeleton}>
          <div className={styles.profileAreaSkeleton}>
            <div className={`${styles.skeleton} ${styles.avatarSkeleton}`} />
            <div className={styles.titleBoxSkeleton}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div className={`${styles.skeleton}`} style={{ width: '80px', height: '22px' }} />
                <div className={`${styles.skeleton}`} style={{ width: '180px', height: '28px' }} />
                <div className={`${styles.skeleton}`} style={{ width: '90px', height: '22px' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                <div className={`${styles.skeleton}`} style={{ width: '110px', height: '22px', borderRadius: '12px' }} />
                <div className={`${styles.skeleton}`} style={{ width: '120px', height: '22px', borderRadius: '12px' }} />
                <div className={`${styles.skeleton}`} style={{ width: '100px', height: '22px', borderRadius: '12px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className={`${styles.skeleton}`} style={{ width: '130px', height: '34px' }} />
            <div className={`${styles.skeleton}`} style={{ width: '110px', height: '34px' }} />
          </div>
        </div>

        {/* 12 Grid Detail Items Skeleton */}
        <div className={styles.gridInfoSkeleton}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.infoItemSkeleton}>
              <div className={`${styles.skeleton}`} style={{ width: '60%', height: '14px' }} />
              <div className={`${styles.skeleton}`} style={{ width: '85%', height: '20px' }} />
            </div>
          ))}
        </div>

        {/* Loan Navigation Tabs Skeleton */}
        <div className={styles.loanTabsSkeleton}>
          <div className={`${styles.skeleton}`} style={{ width: '90px', height: '20px' }} />
          <div className={`${styles.skeleton}`} style={{ width: '170px', height: '36px', borderRadius: '8px' }} />
          <div className={`${styles.skeleton}`} style={{ width: '170px', height: '36px', borderRadius: '8px' }} />
          <div className={`${styles.skeleton}`} style={{ width: '130px', height: '36px', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Financial Summary 4 Cards Skeleton */}
      <div className={styles.summaryGridSkeleton}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.summaryCardSkeleton}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className={`${styles.skeleton}`} style={{ width: '60%', height: '16px' }} />
              <div className={`${styles.skeleton}`} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
            </div>
            <div className={`${styles.skeleton}`} style={{ width: '75%', height: '32px' }} />
          </div>
        ))}
      </div>

      {/* 15-Row Ledger Table Skeleton */}
      <div className={styles.tableCardSkeleton}>
        <div className={styles.tableHeaderBarSkeleton}>
          <div className={`${styles.skeleton}`} style={{ width: '240px', height: '24px' }} />
          <div className={`${styles.skeleton}`} style={{ width: '160px', height: '36px', borderRadius: '6px' }} />
        </div>

        <table className={styles.tableSkeleton}>
          <thead>
            <tr>
              <th><div className={`${styles.skeleton}`} style={{ width: '70px', height: '16px' }} /></th>
              <th><div className={`${styles.skeleton}`} style={{ width: '60px', height: '16px' }} /></th>
              <th><div className={`${styles.skeleton}`} style={{ width: '60px', height: '16px' }} /></th>
              <th><div className={`${styles.skeleton}`} style={{ width: '80px', height: '16px' }} /></th>
              <th><div className={`${styles.skeleton}`} style={{ width: '50px', height: '16px' }} /></th>
              <th><div className={`${styles.skeleton}`} style={{ width: '70px', height: '16px' }} /></th>
              <th><div className={`${styles.skeleton}`} style={{ width: '80px', height: '16px' }} /></th>
              <th><div className={`${styles.skeleton}`} style={{ width: '90px', height: '16px' }} /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td><div className={`${styles.skeleton}`} style={{ width: '100px', height: '18px' }} /></td>
                <td><div className={`${styles.skeleton}`} style={{ width: '60px', height: '18px' }} /></td>
                <td><div className={`${styles.skeleton}`} style={{ width: '60px', height: '18px' }} /></td>
                <td><div className={`${styles.skeleton}`} style={{ width: '80px', height: '18px' }} /></td>
                <td><div className={`${styles.skeleton}`} style={{ width: '40px', height: '18px' }} /></td>
                <td><div className={`${styles.skeleton}`} style={{ width: '70px', height: '18px' }} /></td>
                <td><div className={`${styles.skeleton}`} style={{ width: '80px', height: '18px' }} /></td>
                <td><div className={`${styles.skeleton}`} style={{ width: '60px', height: '18px' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
