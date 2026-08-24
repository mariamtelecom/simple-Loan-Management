import { Member, Transaction, LedgerRowCalculation, FinancialSummary } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const LOCAL_STORAGE_MEMBERS_KEY = 'loan_mgmt_members_v3';
const LOCAL_STORAGE_TRANSACTIONS_KEY = 'loan_mgmt_transactions_v3';

// Helper to convert English digits to Bengali numerals
export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)]);
}

// Helper to parse both English and Bengali number strings into integers
export function parseNumeral(str: string): number {
  if (!str) return 0;
  const bengaliToEnglish: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const normalized = str.replace(/[০-৯]/g, (b) => bengaliToEnglish[b] || b);
  const num = parseInt(normalized.replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

// Initial realistic Bengali seed data based on handwritten image
const SEED_MEMBERS: Member[] = [
  {
    id: 'm-125',
    member_no: '১২৫',
    name: 'আনোয়ার হোসেন',
    loan_amount: 100000,
    savings_initial: 10000,
    loan_purpose: 'ব্যবসা সম্প্রসারণ',
    admission_date: '2024-06-20',
    total_installments: 44,
    mobile: '01712345678',
    book_no: '১',
    guarantor_name: 'মোঃ রফিকুল ইসলাম',
    nid_number: '19922694152000125',
    photo_url: '',
    nid_image_url: '',
    status: 'active',
    created_at: new Date('2024-06-20').toISOString()
  },
  {
    id: 'm-102',
    member_no: '১০২',
    name: 'মোছাঃ রহিমা বেগম',
    loan_amount: 50000,
    savings_initial: 5000,
    loan_purpose: 'গবাদিপশু পালন',
    admission_date: '2024-05-15',
    total_installments: 44,
    mobile: '01898765432',
    book_no: '১',
    guarantor_name: 'আব্দুল কুদ্দুস',
    nid_number: '19882694152000102',
    photo_url: '',
    nid_image_url: '',
    status: 'active',
    created_at: new Date('2024-05-15').toISOString()
  },
  {
    id: 'm-140',
    member_no: '১৪০',
    name: 'মোঃ কবির মিয়া',
    loan_amount: 75000,
    savings_initial: 8000,
    loan_purpose: 'দোকান মেরামত',
    admission_date: '2024-07-01',
    total_installments: 44,
    mobile: '01911223344',
    book_no: '২',
    guarantor_name: 'মোঃ শাহ আলম',
    nid_number: '19952694152000140',
    photo_url: '',
    nid_image_url: '',
    status: 'active',
    created_at: new Date('2024-07-01').toISOString()
  }
];

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 't-1',
    member_id: 'm-125',
    date: '2024-06-10',
    savings_deposit: 10000,
    savings_withdraw: 0,
    installment_no: null,
    loan_repayment: 0,
    collector_signature: 'জসিম',
    notes: 'প্রাথমিক সঞ্চয় জমা',
    created_at: '2024-06-10T10:00:00Z'
  },
  {
    id: 't-2',
    member_id: 'm-125',
    date: '2024-06-10',
    savings_deposit: 10000,
    savings_withdraw: 0,
    installment_no: null,
    loan_repayment: 10000,
    collector_signature: 'জসিম',
    notes: 'ঋণ বিতরণের সময় সঞ্চয় ও প্রাথমিক জমা',
    created_at: '2024-06-10T11:00:00Z'
  },
  {
    id: 't-3',
    member_id: 'm-125',
    date: '2024-07-10',
    savings_deposit: 500,
    savings_withdraw: 0,
    installment_no: 1,
    loan_repayment: 3000,
    collector_signature: 'জসিম',
    notes: 'প্রথম কিস্তি',
    created_at: '2024-07-10T10:00:00Z'
  },
  {
    id: 't-4',
    member_id: 'm-125',
    date: '2024-08-10',
    savings_deposit: 500,
    savings_withdraw: 2000,
    installment_no: 2,
    loan_repayment: 3000,
    collector_signature: 'জসিম',
    notes: 'দ্বিতীয় কিস্তি ও সঞ্চয় উত্তোলন',
    created_at: '2024-08-10T10:00:00Z'
  }
];

function initializeLocalStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(SEED_MEMBERS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
  }
}

export async function getNextAutoMemberAndBookNo(): Promise<{
  nextMemberNo: string;
  nextBookNo: string;
}> {
  const members = await getMembers();
  let maxMemberNo = 125;

  for (const m of members) {
    const parsed = parseNumeral(m.member_no);
    if (parsed > maxMemberNo) {
      maxMemberNo = parsed;
    }
  }

  const nextVal = maxMemberNo + 1;
  const nextMemberNo = toBengaliNumber(nextVal);

  const memberCount = members.length;
  const bookNum = Math.max(1, Math.floor(memberCount / 20) + 1);
  const nextBookNo = toBengaliNumber(bookNum);

  return {
    nextMemberNo,
    nextBookNo
  };
}

export async function getMembers(): Promise<Member[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as Member[];
    } catch (e) {
      console.warn('Supabase fetch failed, using local storage fallback', e);
    }
  }

  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
  return raw ? JSON.parse(raw) : SEED_MEMBERS;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const members = await getMembers();
  return members.find(m => m.id === id || m.member_no === id) || null;
}

export async function createMember(member: Omit<Member, 'id' | 'created_at'>): Promise<Member> {
  let finalMemberNo = member.member_no;
  let finalBookNo = member.book_no;

  if (!finalMemberNo || !finalBookNo) {
    const autoGen = await getNextAutoMemberAndBookNo();
    if (!finalMemberNo) finalMemberNo = autoGen.nextMemberNo;
    if (!finalBookNo) finalBookNo = autoGen.nextBookNo;
  }

  const newMember: Member = {
    ...member,
    member_no: finalMemberNo,
    book_no: finalBookNo,
    id: 'm-' + Date.now(),
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([{
          member_no: newMember.member_no,
          name: newMember.name,
          loan_amount: Number(newMember.loan_amount),
          savings_initial: Number(newMember.savings_initial),
          loan_purpose: newMember.loan_purpose,
          admission_date: newMember.admission_date,
          total_installments: Number(newMember.total_installments),
          mobile: newMember.mobile,
          book_no: newMember.book_no,
          guarantor_name: newMember.guarantor_name || '',
          nid_number: newMember.nid_number || '',
          photo_url: newMember.photo_url || '',
          nid_image_url: newMember.nid_image_url || '',
          status: 'active'
        }])
        .select()
        .single();
      if (!error && data) return data as Member;
    } catch (e) {
      console.warn('Supabase insert failed, saving locally', e);
    }
  }

  initializeLocalStorage();
  const members = await getMembers();
  const updated = [newMember, ...members];
  localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(updated));
  return newMember;
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Member;
    } catch (e) {
      console.warn('Supabase update failed, updating locally', e);
    }
  }

  initializeLocalStorage();
  const members = await getMembers();
  const index = members.findIndex(m => m.id === id);
  if (index === -1) return null;

  members[index] = { ...members[index], ...updates, updated_at: new Date().toISOString() };
  localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(members));
  return members[index];
}

export async function deleteMember(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase delete failed', e);
    }
  }

  initializeLocalStorage();
  const members = await getMembers();
  const filtered = members.filter(m => m.id !== id);
  localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(filtered));
  return true;
}

export async function getTransactionsForMember(memberId: string): Promise<Transaction[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', memberId)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });
      if (!error && data) return data as Transaction[];
    } catch (e) {
      console.warn('Supabase fetch transactions failed', e);
    }
  }

  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
  const all: Transaction[] = raw ? JSON.parse(raw) : SEED_TRANSACTIONS;
  return all
    .filter(t => t.member_id === memberId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getCalculatedLedger(member: Member): Promise<{
  rows: LedgerRowCalculation[];
  summary: FinancialSummary;
}> {
  const transactions = await getTransactionsForMember(member.id);

  let currentSavings = Number(member.savings_initial || 0);
  let currentLoanBalance = Number(member.loan_amount || 0);
  let totalLoanPaid = 0;

  const rows: LedgerRowCalculation[] = transactions.map((t) => {
    const deposit = Number(t.savings_deposit || 0);
    const withdraw = Number(t.savings_withdraw || 0);
    const repayment = Number(t.loan_repayment || 0);

    currentSavings = currentSavings + deposit - withdraw;
    currentLoanBalance = Math.max(0, currentLoanBalance - repayment);
    totalLoanPaid += repayment;

    return {
      ...t,
      running_total_savings: currentSavings,
      running_loan_balance: currentLoanBalance
    };
  });

  const summary: FinancialSummary = {
    total_loan: Number(member.loan_amount || 0),
    total_repaid: totalLoanPaid,
    remaining_loan: currentLoanBalance,
    total_savings: currentSavings,
    repayment_progress: Number(member.loan_amount) > 0
      ? Math.min(100, Math.round((totalLoanPaid / Number(member.loan_amount)) * 100))
      : 100
  };

  return { rows, summary };
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const newTx: Transaction = {
    ...transaction,
    id: 't-' + Date.now(),
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          member_id: transaction.member_id,
          date: transaction.date,
          savings_deposit: Number(transaction.savings_deposit || 0),
          savings_withdraw: Number(transaction.savings_withdraw || 0),
          installment_no: transaction.installment_no ? Number(transaction.installment_no) : null,
          loan_repayment: Number(transaction.loan_repayment || 0),
          collector_signature: transaction.collector_signature || '',
          notes: transaction.notes || ''
        }])
        .select()
        .single();
      if (!error && data) return data as Transaction;
    } catch (e) {
      console.warn('Supabase add transaction failed', e);
    }
  }

  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
  const all: Transaction[] = raw ? JSON.parse(raw) : SEED_TRANSACTIONS;
  const updated = [...all, newTx];
  localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(updated));
  return newTx;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase delete transaction failed', e);
    }
  }

  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
  const all: Transaction[] = raw ? JSON.parse(raw) : SEED_TRANSACTIONS;
  const filtered = all.filter(t => t.id !== id);
  localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(filtered));
  return true;
}

export async function getDashboardStats(): Promise<{
  totalGranted: number;
  totalCollected: number;
  totalRemaining: number;
  totalSavings: number;
  activeCount: number;
}> {
  const members = await getMembers();
  let totalGranted = 0;
  let totalCollected = 0;
  let totalRemaining = 0;
  let totalSavings = 0;

  for (const member of members) {
    const { summary } = await getCalculatedLedger(member);
    totalGranted += summary.total_loan;
    totalCollected += summary.total_repaid;
    totalRemaining += summary.remaining_loan;
    totalSavings += summary.total_savings;
  }

  return {
    totalGranted,
    totalCollected,
    totalRemaining,
    totalSavings,
    activeCount: members.length
  };
}
