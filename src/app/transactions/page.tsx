'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt, Printer } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { RecentTransactionsTable } from '@/components/RecentTransactionsTable';
import { TransactionReceiptModal } from '@/components/TransactionReceiptModal';
import { EnrichedTransaction } from '@/lib/types';
import { getAllRecentTransactions } from '@/lib/db';
import { Language, translations } from '@/lib/i18n';

import { RecentTransactionsSkeleton } from '@/components/RecentTransactionsSkeleton';

export default function TransactionsPage() {
  const [lang, setLang] = useState<Language>('bn');
  const t = translations[lang];

  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [printingTransaction, setPrintingTransaction] = useState<EnrichedTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const list = await getAllRecentTransactions();
    setTransactions(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
      />

      <main className="main-content">
        <div className="container">
          {loading ? (
            <RecentTransactionsSkeleton />
          ) : (
            <>
              {/* Top Bar Navigation */}
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <Link href="/" className="btn btn-secondary btn-sm">
                  <ArrowLeft size={18} />
                  <span>{t.backToDashboard}</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') window.print();
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <Printer size={16} />
                    <span>সমগ্র লেনদেন পৃষ্ঠা প্রিন্ট করুন</span>
                  </button>
                </div>
              </div>

              {/* Paginated Transactions Table Component */}
              <RecentTransactionsTable
                transactions={transactions}
                lang={lang}
                onPrintReceipt={(tx) => setPrintingTransaction(tx)}
              />
            </>
          )}
        </div>
      </main>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={printingTransaction !== null}
        transaction={printingTransaction}
        onClose={() => setPrintingTransaction(null)}
        lang={lang}
      />
    </>
  );
}
