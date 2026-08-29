'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Landmark, 
  BookOpen, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Clock
} from 'lucide-react';
import styles from './RecentTransactionsTable.module.css';
import { EnrichedTransaction } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';
import { toBengaliNumber } from '@/lib/db';

interface RecentTransactionsTableProps {
  transactions: EnrichedTransaction[];
  lang: Language;
  onPrintReceipt: (tx: EnrichedTransaction) => void;
}

const ROWS_PER_PAGE = 20;

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({
  transactions,
  lang,
  onPrintReceipt
}) => {
  const t = translations[lang];
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(transactions.length / ROWS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);

  // Paginated slice (20 transactions per page)
  const startIndex = (validPage - 1) * ROWS_PER_PAGE;
  const currentRows = transactions.slice(startIndex, startIndex + ROWS_PER_PAGE);

  return (
    <div className={styles.container}>
      {/* Table Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.titleArea}>
          <div className={styles.iconBox}>
            <Receipt size={22} />
          </div>
          <div>
            <h2 className={styles.title}>সাম্প্রতিক লেনদেনসমূহ (Recent Transactions Log)</h2>
            <p className={styles.subtitle}>
              সর্বশেষ সংগৃহীত কিস্তি, জমা ও উত্তোলনের ২০টি করে প্যাগিনেটেড রেকর্ড
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-info" style={{ fontSize: '0.825rem', padding: '0.35rem 0.75rem', fontWeight: 700 }}>
            <Clock size={13} style={{ marginRight: 4 }} />
            মোট লেনদেন: {toBengaliNumber(transactions.length)}টি
          </span>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="btn btn-secondary btn-sm no-print"
            title="সমগ্র সাম্প্রতিক লেনদেন লোগ প্রিন্ট করুন"
          >
            <Printer size={15} />
            <span>লগ প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Table Wrapper */}
      {transactions.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '150px' }}>{t.date}</th>
                <th style={{ width: '220px' }}>সদস্যের নাম ও তথ্য</th>
                <th style={{ width: '90px' }}>{t.loanNo}</th>
                <th style={{ width: '100px' }}>{t.deposit}</th>
                <th style={{ width: '100px' }}>{t.withdraw}</th>
                <th style={{ width: '110px' }}>{t.collection}</th>
                <th style={{ width: '110px' }}>{t.installmentNo}</th>
                <th style={{ width: '130px' }}>{t.collectorSignature}</th>
                <th className="no-print" style={{ width: '120px', textAlign: 'center' }}>
                  রসিদ প্রিন্ট
                </th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((tx, idx) => (
                <tr key={tx.id || idx}>
                  {/* Date */}
                  <td style={{ fontSize: '0.825rem', fontWeight: 600 }}>{tx.date}</td>

                  {/* Member Name, Member No & Passbook Link */}
                  <td>
                    <div className={styles.memberCell}>
                      <div className={styles.memberName}>
                        <User size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span>{tx.memberName}</span>
                      </div>
                      <div className={styles.memberMeta}>
                        সদস্য নং: {tx.memberNo} | বই নং: {tx.bookNo || '১'} •{' '}
                        <Link
                          href={`/members/${tx.member_id}`}
                          className="no-print"
                          style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}
                        >
                          <span>পাসবই</span>
                          <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>
                  </td>

                  {/* Loan No */}
                  <td>
                    <span className="badge badge-info" style={{ fontWeight: 700 }}>
                      <Landmark size={11} style={{ marginRight: 2 }} />
                      ঋণ {toBengaliNumber(tx.loanNo)}
                    </span>
                  </td>

                  {/* Savings Deposit */}
                  <td className={tx.savings_deposit > 0 ? styles.textGreen : ''}>
                    {tx.savings_deposit > 0 ? `৳ ${tx.savings_deposit.toLocaleString()}` : '-'}
                  </td>

                  {/* Savings Withdraw */}
                  <td className={tx.savings_withdraw > 0 ? styles.textRose : ''}>
                    {tx.savings_withdraw > 0 ? `৳ ${tx.savings_withdraw.toLocaleString()}` : '-'}
                  </td>

                  {/* Loan Repayment */}
                  <td className={tx.loan_repayment > 0 ? styles.textBold : ''}>
                    {tx.loan_repayment > 0 ? `৳ ${tx.loan_repayment.toLocaleString()}` : '-'}
                  </td>

                  {/* Installment No */}
                  <td>
                    {tx.installment_no ? (
                      <span className="badge badge-info">কিস্তি {toBengaliNumber(tx.installment_no)}</span>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* Collector Signature */}
                  <td style={{ fontSize: '0.825rem' }}>{tx.collector_signature || '-'}</td>

                  {/* Print Receipt Action */}
                  <td className="no-print" style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => onPrintReceipt(tx)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      title="এই লেনদেনের প্রিন্ট রসিদ দেখুন"
                    >
                      <Printer size={13} />
                      <span>রসিদ</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Receipt size={36} style={{ margin: '0 auto 0.5rem', color: '#94a3b8' }} />
          <p>এখনো কোনো সাম্প্রতিক লেনদেন রেকর্ড করা হয়নি।</p>
        </div>
      )}

      {/* Pagination Footer Controls (20 Items Per Page) */}
      <div className={`${styles.paginationBar} no-print`}>
        <div className={styles.paginationInfo}>
          {t.page} {validPage} {t.of} {totalPages} • (প্রতি পৃষ্ঠায় ২০টি সাম্প্রতিক লেনদেন প্রদর্শিত)
        </div>

        <div className={styles.paginationControls}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validPage === 1}
            className={styles.pageBtn}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <span>
            {validPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validPage >= totalPages}
            className={styles.pageBtn}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
