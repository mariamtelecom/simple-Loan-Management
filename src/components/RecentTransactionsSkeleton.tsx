'use client';

import React from 'react';
import styles from './RecentTransactionsSkeleton.module.css';

export const RecentTransactionsSkeleton: React.FC = () => {
  return (
    <div className={styles.skeletonContainer}>
      {/* Top Bar Navigation Skeleton */}
      <div className={styles.topBarSkeleton}>
        <div className={styles.skeleton} style={{ width: '140px', height: '36px' }} />
        <div className={styles.skeleton} style={{ width: '180px', height: '36px' }} />
      </div>

      {/* Transactions Table Card Skeleton */}
      <div className={styles.tableCardSkeleton}>
        <div className={styles.headerBarSkeleton}>
          <div className={styles.titleAreaSkeleton}>
            <div className={styles.skeleton} style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div className={styles.skeleton} style={{ width: '260px', height: '22px' }} />
              <div className={styles.skeleton} style={{ width: '320px', height: '14px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className={styles.skeleton} style={{ width: '120px', height: '28px', borderRadius: '12px' }} />
            <div className={styles.skeleton} style={{ width: '110px', height: '32px' }} />
          </div>
        </div>

        <table className={styles.tableSkeleton}>
          <thead>
            <tr>
              <th><div className={styles.skeleton} style={{ width: '80px', height: '16px' }} /></th>
              <th><div className={styles.skeleton} style={{ width: '140px', height: '16px' }} /></th>
              <th><div className={styles.skeleton} style={{ width: '60px', height: '16px' }} /></th>
              <th><div className={styles.skeleton} style={{ width: '70px', height: '16px' }} /></th>
              <th><div className={styles.skeleton} style={{ width: '70px', height: '16px' }} /></th>
              <th><div className={styles.skeleton} style={{ width: '80px', height: '16px' }} /></th>
              <th><div className={styles.skeleton} style={{ width: '60px', height: '16px' }} /></th>
              <th><div className={styles.skeleton} style={{ width: '80px', height: '16px' }} /></th>
              <th><div className={styles.skeleton} style={{ width: '70px', height: '16px' }} /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}>
                <td><div className={styles.skeleton} style={{ width: '100px', height: '18px' }} /></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div className={styles.skeleton} style={{ width: '130px', height: '18px' }} />
                    <div className={styles.skeleton} style={{ width: '160px', height: '13px' }} />
                  </div>
                </td>
                <td><div className={styles.skeleton} style={{ width: '55px', height: '22px', borderRadius: '10px' }} /></td>
                <td><div className={styles.skeleton} style={{ width: '65px', height: '18px' }} /></td>
                <td><div className={styles.skeleton} style={{ width: '65px', height: '18px' }} /></td>
                <td><div className={styles.skeleton} style={{ width: '75px', height: '18px' }} /></td>
                <td><div className={styles.skeleton} style={{ width: '50px', height: '18px' }} /></td>
                <td><div className={styles.skeleton} style={{ width: '70px', height: '18px' }} /></td>
                <td style={{ textAlign: 'center' }}>
                  <div className={styles.skeleton} style={{ width: '60px', height: '28px', borderRadius: '6px' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.paginationBarSkeleton}>
          <div className={styles.skeleton} style={{ width: '240px', height: '16px' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className={styles.skeleton} style={{ width: '70px', height: '32px' }} />
            <div className={styles.skeleton} style={{ width: '70px', height: '32px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
