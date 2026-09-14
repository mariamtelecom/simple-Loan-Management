import { Member, Transaction, Loan, LedgerRowCalculation, FinancialSummary, EnrichedTransaction } from './types';
import {
  supabasePrimary,
  isPrimaryConfigured
} from './supabaseClient';

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

export function isUuid(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Automatically purge any legacy local storage data cache on client load.
 * Ensures no member, loan, or transaction data remains cached in browser memory.
 */
export function purgeLocalDataCache() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove = [
      'loan_mgmt_members_v4', 'loan_mgmt_transactions_v4', 'loan_mgmt_loans_v4',
      'loan_mgmt_members_v3', 'loan_mgmt_transactions_v3', 'loan_mgmt_loans_v3',
      'loan_mgmt_members_v2', 'loan_mgmt_transactions_v2', 'loan_mgmt_members_v1',
      'loan_mgmt_transactions_v1'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

function getNormalizedMemberKeys(m: Member): string[] {
  const keys: string[] = [];
  if (m.id) {
    keys.push(`id:${m.id}`);
  }
  if (m.member_no) {
    const normNo = parseNumeral(m.member_no);
    if (normNo > 0) {
      keys.push(`no:${normNo}`);
    } else {
      keys.push(`no:${m.member_no.trim().toLowerCase()}`);
    }
  }
  if (m.nid_number && m.nid_number.trim().length > 3) {
    keys.push(`nid:${m.nid_number.trim()}`);
  }
  if (m.mobile && m.name) {
    keys.push(`mob_name:${m.mobile.trim()}_${m.name.trim().toLowerCase()}`);
  }
  return keys;
}

// ----------------------------------------------------------------------
// ONLINE DATABASE API FUNCTIONS (SUPABASE CLOUD DB)
// ----------------------------------------------------------------------

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
  purgeLocalDataCache();
  if (!isPrimaryConfigured || !supabasePrimary) {
    return [];
  }

  try {
    const { data, error } = await supabasePrimary
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data as Member[];
    }
  } catch (e) {
    console.warn('Primary Supabase fetch failed', e);
  }

  return [];
}

export async function getMemberById(id: string): Promise<Member | null> {
  const members = await getMembers();
  if (!id) return null;
  const normIdNo = parseNumeral(id);
  return members.find(m =>
    m.id === id ||
    m.member_no === id ||
    (normIdNo > 0 && parseNumeral(m.member_no) === normIdNo)
  ) || null;
}

export async function createMember(member: Omit<Member, 'id' | 'created_at'>): Promise<Member> {
  purgeLocalDataCache();
  let finalMemberNo = member.member_no;
  let finalBookNo = member.book_no;

  if (!finalMemberNo || !finalBookNo) {
    const autoGen = await getNextAutoMemberAndBookNo();
    if (!finalMemberNo) finalMemberNo = autoGen.nextMemberNo;
    if (!finalBookNo) finalBookNo = autoGen.nextBookNo;
  }

  let newMember: Member = {
    ...member,
    member_no: finalMemberNo,
    book_no: finalBookNo,
    id: 'm-' + Date.now(),
    created_at: new Date().toISOString()
  };

  const memberPayload = {
    member_no: newMember.member_no,
    name: newMember.name,
    father_mother_spouse: newMember.father_mother_spouse || '',
    loan_amount: Number(newMember.loan_amount),
    savings_initial: Number(newMember.savings_initial),
    loan_purpose: newMember.loan_purpose,
    admission_date: newMember.admission_date,
    total_installments: Number(newMember.total_installments),
    mobile: newMember.mobile,
    address: newMember.address || '',
    book_no: newMember.book_no,
    guarantor_name: newMember.guarantor_name || '',
    guarantor_father_mother_spouse: newMember.guarantor_father_mother_spouse || '',
    guarantor_mobile: newMember.guarantor_mobile || '',
    guarantor_address: newMember.guarantor_address || '',
    guarantor_nid: newMember.guarantor_nid || '',
    nid_number: newMember.nid_number || '',
    photo_url: newMember.photo_url || '',
    nid_front_url: newMember.nid_front_url || newMember.nid_image_url || '',
    nid_back_url: newMember.nid_back_url || '',
    nid_image_url: newMember.nid_image_url || newMember.nid_front_url || '',
    guarantor_nid_front_url: newMember.guarantor_nid_front_url || '',
    guarantor_nid_back_url: newMember.guarantor_nid_back_url || '',
    guarantor_photo_url: newMember.guarantor_photo_url || '',
    drive_folder_url: newMember.drive_folder_url || '',
    // New: Father / Spouse relationship type and contact details
    father_spouse_type: newMember.father_spouse_type || '',
    father_spouse_name: newMember.father_spouse_name || '',
    father_spouse_address: newMember.father_spouse_address || '',
    father_spouse_nid: newMember.father_spouse_nid || '',
    father_spouse_phone: newMember.father_spouse_phone || '',
    father_spouse_father_name: newMember.father_spouse_father_name || '',
    status: 'active'
  };

  if (isPrimaryConfigured && supabasePrimary) {
    try {
      const { data, error } = await supabasePrimary
        .from('members')
        .insert([memberPayload])
        .select()
        .single();
      if (!error && data) {
        newMember = data as Member;
      } else if (error) {
        console.warn('Primary Supabase insert warning, trying basic payload fallback:', error.message);
        const basicPayload = { ...memberPayload };
        delete (basicPayload as Record<string, unknown>).father_mother_spouse;
        delete (basicPayload as Record<string, unknown>).guarantor_father_mother_spouse;

        const { data: fbData } = await supabasePrimary
          .from('members')
          .insert([basicPayload])
          .select()
          .single();
        if (fbData) {
          newMember = { ...newMember, ...fbData };
        }
      }

      if (isUuid(newMember.id)) {
        try {
          const initialLoanPayload = {
            member_id: newMember.id,
            loan_no: 1,
            loan_amount: Number(newMember.loan_amount || 0),
            loan_purpose: newMember.loan_purpose || 'সাধারণ ঋণ',
            total_installments: Number(newMember.total_installments || 44),
            admission_date: newMember.admission_date || new Date().toISOString().split('T')[0],
            status: 'active'
          };
          await supabasePrimary.from('loans').insert([initialLoanPayload]);
        } catch (loanErr) {
          console.warn('Initial Supabase loan insert error:', loanErr);
        }
      }
    } catch (e) {
      console.warn('Primary Supabase write failed', e);
    }
  }

  return newMember;
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  purgeLocalDataCache();
  let updatedMember: Member | null = null;

  if (isPrimaryConfigured && supabasePrimary) {
    try {
      const { data, error } = await supabasePrimary
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        updatedMember = data as Member;
      }
    } catch (e) {
      console.warn('Primary Supabase update failed', e);
    }
  }

  return updatedMember;
}

export async function deleteMember(id: string): Promise<boolean> {
  purgeLocalDataCache();
  if (isPrimaryConfigured && supabasePrimary) {
    try {
      await supabasePrimary.from('members').delete().eq('id', id);
    } catch (e) {
      console.warn('Primary Supabase delete failed', e);
    }
  }
  return true;
}

// ----------------------------------------------------------------------
// TRANSACTIONS ONLINE API (SUPABASE CLOUD DB)
// ----------------------------------------------------------------------

export async function getTransactionsForMember(memberId: string): Promise<Transaction[]> {
  purgeLocalDataCache();
  const member = await getMemberById(memberId);
  const memberIdsToMatch = new Set<string>();
  if (memberId) memberIdsToMatch.add(memberId);
  if (member?.id) memberIdsToMatch.add(member.id);

  const uuidIdsToMatch = Array.from(memberIdsToMatch).filter(id => isUuid(id));

  if (!isPrimaryConfigured || !supabasePrimary || uuidIdsToMatch.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabasePrimary
      .from('transactions')
      .select('*')
      .in('member_id', uuidIdsToMatch)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });
    if (!error && data) {
      return data as Transaction[];
    }
  } catch (e) {
    console.warn('Primary Supabase transactions fetch failed', e);
  }

  return [];
}

export async function getAllRecentTransactions(): Promise<EnrichedTransaction[]> {
  purgeLocalDataCache();
  const members = await getMembers();
  const memberMap = new Map<string, Member>();
  members.forEach(m => {
    if (m.id) memberMap.set(m.id, m);
    if (m.member_no) memberMap.set(m.member_no, m);
  });

  if (!isPrimaryConfigured || !supabasePrimary) {
    return [];
  }

  let rawTxs: Transaction[] = [];
  let dbLoans: Loan[] = [];

  try {
    const [txRes, loanRes] = await Promise.all([
      supabasePrimary.from('transactions').select('*').order('created_at', { ascending: false }),
      supabasePrimary.from('loans').select('*')
    ]);
    if (!txRes.error && txRes.data) {
      rawTxs = txRes.data as Transaction[];
    }
    if (!loanRes.error && loanRes.data) {
      dbLoans = loanRes.data as Loan[];
    }
  } catch (e) {
    console.warn('Primary Supabase fetch all transactions failed', e);
  }

  const loansByMemberMap = new Map<string, Loan[]>();
  dbLoans.forEach(l => {
    if (!l || !l.member_id) return;
    if (!loansByMemberMap.has(l.member_id)) loansByMemberMap.set(l.member_id, []);
    loansByMemberMap.get(l.member_id)!.push(l);
  });

  const enriched: EnrichedTransaction[] = [];

  for (const t of rawTxs) {
    const member = memberMap.get(t.member_id) || null;
    let loanNo = 1;

    if (member) {
      const mLoans = loansByMemberMap.get(member.id) || [];
      if (t.loan_id) {
        const found = mLoans.find(l => l.id === t.loan_id || String(l.loan_no) === String(t.loan_id));
        if (found) loanNo = found.loan_no;
      }
    }

    enriched.push({
      ...t,
      memberName: member ? member.name : 'অজানা সদস্য',
      memberNo: member ? member.member_no : t.member_id,
      bookNo: member?.book_no || '১',
      loanNo
    });
  }

  return enriched.sort((a, b) => {
    const timeA = new Date(a.created_at || a.date).getTime();
    const timeB = new Date(b.created_at || b.date).getTime();
    return timeB - timeA;
  });
}

// ----------------------------------------------------------------------
// LOANS ONLINE API & MULTI-LOAN FUNCTIONS (SUPABASE CLOUD DB)
// ----------------------------------------------------------------------

export async function getLoansForMember(memberId: string): Promise<Loan[]> {
  purgeLocalDataCache();
  const member = await getMemberById(memberId);
  if (!member) return [];

  const uuidIdsToMatch = [memberId, member.id].filter(id => Boolean(id) && isUuid(id));
  const loanMap = new Map<string, Loan>();

  const defaultLoan1: Loan = {
    id: member.id,
    member_id: member.id,
    loan_no: 1,
    loan_amount: Number(member.loan_amount || 0),
    loan_purpose: member.loan_purpose || 'সাধারণ ঋণ',
    total_installments: Number(member.total_installments || 44),
    admission_date: member.admission_date || new Date().toISOString().split('T')[0],
    status: member.status || 'active',
    created_at: member.created_at
  };
  loanMap.set('loan_no_1', defaultLoan1);

  if (isPrimaryConfigured && supabasePrimary && uuidIdsToMatch.length > 0) {
    try {
      const { data, error } = await supabasePrimary
        .from('loans')
        .select('*')
        .in('member_id', uuidIdsToMatch)
        .order('loan_no', { ascending: true });
      if (!error && data && data.length > 0) {
        data.forEach((l: Loan) => {
          const lNo = l.loan_no || 1;
          const key = `loan_no_${lNo}`;
          if (lNo === 1) {
            loanMap.set(key, { ...defaultLoan1, ...l, loan_no: 1 });
          } else {
            loanMap.set(key, l);
          }
        });
      }
    } catch (e) {
      console.warn('Primary Supabase loans fetch warning', e);
    }
  }

  const sortedLoans = Array.from(loanMap.values()).sort((a, b) => (a.loan_no || 1) - (b.loan_no || 1));
  return sortedLoans.map((l, index) => ({
    ...l,
    loan_no: index + 1
  }));
}

export async function getLoanById(memberId: string, loanId: string): Promise<Loan | null> {
  const loans = await getLoansForMember(memberId);
  if (!loanId || loanId === 'default') {
    return loans[0] || null;
  }
  const matched = loans.find(l =>
    l.id === loanId ||
    String(l.loan_no) === String(loanId) ||
    (loanId === memberId && l.loan_no === 1)
  );
  return matched || loans[0] || null;
}

export async function updateLoanStatus(memberId: string, loanId: string, status: 'active' | 'closed'): Promise<Loan | null> {
  purgeLocalDataCache();
  const loans = await getLoansForMember(memberId);
  const targetLoan = loans.find(l => l.id === loanId || String(l.loan_no) === String(loanId));
  if (!targetLoan) return null;

  const updatedLoan: Loan = {
    ...targetLoan,
    status,
    updated_at: new Date().toISOString()
  };

  if (isPrimaryConfigured && supabasePrimary && isUuid(targetLoan.id)) {
    try {
      await supabasePrimary
        .from('loans')
        .update({ status, updated_at: updatedLoan.updated_at })
        .eq('id', targetLoan.id);
    } catch (e) {
      console.warn('Primary Supabase loan status update warning', e);
    }
  }

  return updatedLoan;
}

export async function createLoan(
  loanData: Omit<Loan, 'id' | 'created_at'>,
  initialSavingsDeposit: number = 0
): Promise<Loan> {
  purgeLocalDataCache();
  const existingLoans = await getLoansForMember(loanData.member_id);
  const nextLoanNo = loanData.loan_no || (existingLoans.length + 1);

  let newLoan: Loan = {
    ...loanData,
    loan_no: nextLoanNo,
    id: 'l-' + Date.now(),
    created_at: new Date().toISOString()
  };

  let dbMemberId = loanData.member_id;
  if (!isUuid(dbMemberId)) {
    const member = await getMemberById(loanData.member_id);
    if (member && isUuid(member.id)) {
      dbMemberId = member.id;
    }
  }

  const payload = {
    member_id: dbMemberId,
    loan_no: newLoan.loan_no,
    loan_amount: Number(newLoan.loan_amount),
    loan_purpose: newLoan.loan_purpose,
    total_installments: Number(newLoan.total_installments),
    admission_date: newLoan.admission_date,
    status: 'active'
  };

  if (isPrimaryConfigured && supabasePrimary && isUuid(dbMemberId)) {
    try {
      const { data, error } = await supabasePrimary.from('loans').insert([payload]).select().single();
      if (!error && data) {
        newLoan = data as Loan;
      } else if (error) {
        console.warn('Primary Supabase loan insert error:', error.message);
      }
    } catch (e) {
      console.warn('Primary Supabase loan insert warning', e);
    }
  }

  if (initialSavingsDeposit > 0) {
    await addTransaction({
      member_id: newLoan.member_id,
      loan_id: newLoan.id,
      date: newLoan.admission_date,
      savings_deposit: Number(initialSavingsDeposit),
      savings_withdraw: 0,
      installment_no: null,
      loan_repayment: 0,
      collector_signature: 'mariamtelecom',
      notes: `নতুন ঋণ (ঋণ ${newLoan.loan_no}) গ্রহণের সময় সঞ্চয় জমা`
    });
  }

  return newLoan;
}

export async function getCalculatedLedgerForLoan(member: Member, loan: Loan): Promise<{
  rows: LedgerRowCalculation[];
  summary: FinancialSummary;
}> {
  const allTxs = await getTransactionsForMember(member.id);

  const loanTxs = allTxs.filter((t) => {
    if (t.loan_id) {
      return (
        t.loan_id === loan.id ||
        (t.loan_id === member.id && loan.loan_no === 1) ||
        String(t.loan_id) === String(loan.loan_no)
      );
    }
    return loan.loan_no === 1 || loan.id === member.id;
  });

  let currentLoanBalance = Number(loan.loan_amount || 0);
  let totalLoanPaid = 0;

  const isFirstLoan = loan.loan_no === 1 || loan.id === member.id;
  let runningLoanSavings = isFirstLoan ? Number(member.savings_initial || 0) : 0;

  const rows: LedgerRowCalculation[] = loanTxs.map((t) => {
    const repayment = Number(t.loan_repayment || 0);
    currentLoanBalance = Math.max(0, currentLoanBalance - repayment);
    totalLoanPaid += repayment;

    const deposit = Number(t.savings_deposit || 0);
    const withdraw = Number(t.savings_withdraw || 0);
    runningLoanSavings += deposit - withdraw;

    return {
      ...t,
      running_total_savings: runningLoanSavings,
      running_loan_balance: currentLoanBalance
    };
  });

  const summary: FinancialSummary = {
    total_loan: Number(loan.loan_amount || 0),
    total_repaid: totalLoanPaid,
    remaining_loan: currentLoanBalance,
    total_savings: runningLoanSavings,
    repayment_progress: Number(loan.loan_amount) > 0
      ? Math.min(100, Math.round((totalLoanPaid / Number(loan.loan_amount)) * 100))
      : 100
  };

  return { rows, summary };
}

export async function getMemberTotalSummary(member: Member): Promise<{
  total_remaining_loan: number;
  total_savings: number;
  loan_count: number;
  completed_loan_count: number;
  active_loan_count: number;
}> {
  const loans = await getLoansForMember(member.id);
  let totalRemaining = 0;
  let totalSavings = 0;
  let completedCount = 0;
  let activeCount = 0;

  for (const loan of loans) {
    const { summary } = await getCalculatedLedgerForLoan(member, loan);
    totalRemaining += summary.remaining_loan;
    totalSavings += summary.total_savings;
    if (summary.remaining_loan <= 0 && summary.total_loan > 0) {
      completedCount++;
    } else {
      activeCount++;
    }
  }

  return {
    total_remaining_loan: totalRemaining,
    total_savings: totalSavings,
    loan_count: loans.length,
    completed_loan_count: completedCount,
    active_loan_count: activeCount
  };
}

export async function getCalculatedLedger(member: Member): Promise<{
  rows: LedgerRowCalculation[];
  summary: FinancialSummary;
}> {
  const loans = await getLoansForMember(member.id);
  const activeLoan = loans[0];
  if (activeLoan) {
    return getCalculatedLedgerForLoan(member, activeLoan);
  }

  return {
    rows: [],
    summary: {
      total_loan: Number(member.loan_amount || 0),
      total_repaid: 0,
      remaining_loan: Number(member.loan_amount || 0),
      total_savings: Number(member.savings_initial || 0),
      repayment_progress: 0
    }
  };
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  purgeLocalDataCache();
  let dbMemberId = transaction.member_id;
  if (!isUuid(dbMemberId)) {
    const member = await getMemberById(transaction.member_id);
    if (member && isUuid(member.id)) {
      dbMemberId = member.id;
    }
  }

  let dbLoanId: string | null = null;
  let localLoanId: string | undefined = transaction.loan_id;

  if (transaction.loan_id) {
    const targetLoan = await getLoanById(transaction.member_id, transaction.loan_id);
    if (targetLoan) {
      localLoanId = targetLoan.id;
      if (isUuid(targetLoan.id)) {
        dbLoanId = targetLoan.id;
      }
    } else if (isUuid(transaction.loan_id)) {
      dbLoanId = transaction.loan_id;
    }
  }

  let newTx: Transaction = {
    ...transaction,
    loan_id: localLoanId,
    id: 't-' + Date.now(),
    created_at: new Date().toISOString()
  };

  let cleanDate = transaction.date;
  if (cleanDate) {
    const dtParsed = new Date(cleanDate);
    if (!isNaN(dtParsed.getTime())) {
      cleanDate = dtParsed.toISOString().split('T')[0];
    } else {
      const match = cleanDate.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) cleanDate = match[1];
    }
  }
  if (!cleanDate) {
    cleanDate = new Date().toISOString().split('T')[0];
  }

  const txPayload = {
    member_id: dbMemberId,
    loan_id: dbLoanId,
    date: cleanDate,
    savings_deposit: Number(transaction.savings_deposit || 0),
    savings_withdraw: Number(transaction.savings_withdraw || 0),
    installment_no: transaction.installment_no ? Number(transaction.installment_no) : null,
    loan_repayment: Number(transaction.loan_repayment || 0),
    collector_signature: transaction.collector_signature || '',
    notes: transaction.notes || ''
  };

  if (isPrimaryConfigured && supabasePrimary && isUuid(dbMemberId)) {
    try {
      const { data, error } = await supabasePrimary
        .from('transactions')
        .insert([txPayload])
        .select()
        .single();
      if (!error && data) {
        newTx = data as Transaction;
      } else if (error) {
        console.warn('Primary Supabase transaction insert failed:', error.message);
        const fallbackPayload = { ...txPayload };
        delete (fallbackPayload as Record<string, unknown>).loan_id;
        const { data: fbData, error: fbError } = await supabasePrimary
          .from('transactions')
          .insert([fallbackPayload])
          .select()
          .single();
        if (!fbError && fbData) {
          newTx = fbData as Transaction;
        } else if (fbError) {
          console.error('Supabase transaction fallback insert error:', fbError.message);
        }
      }
    } catch (e) {
      console.warn('Primary Supabase transaction insert exception:', e);
    }
  }

  return newTx;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  purgeLocalDataCache();
  if (isPrimaryConfigured && supabasePrimary) {
    try {
      await supabasePrimary.from('transactions').delete().eq('id', id);
    } catch (e) {
      console.warn('Primary Supabase transaction delete failed', e);
    }
  }

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
    const loans = await getLoansForMember(member.id);
    for (const loan of loans) {
      const { summary } = await getCalculatedLedgerForLoan(member, loan);
      totalGranted += summary.total_loan;
      totalCollected += summary.total_repaid;
      totalRemaining += summary.remaining_loan;
      totalSavings += summary.total_savings;
    }
  }

  return {
    totalGranted,
    totalCollected,
    totalRemaining,
    totalSavings,
    activeCount: members.length
  };
}

export async function getDashboardDataBatch(): Promise<{
  members: Member[];
  stats: {
    totalGranted: number;
    totalCollected: number;
    totalRemaining: number;
    totalSavings: number;
    activeCount: number;
  };
  memberSummaries: {
    [id: string]: {
      remaining: number;
      savings: number;
      loanCount: number;
      completedLoanCount: number;
      activeLoanCount: number;
    };
  };
}> {
  purgeLocalDataCache();
  const members = await getMembers();

  let dbLoans: Loan[] = [];
  let dbTxs: Transaction[] = [];

  if (isPrimaryConfigured && supabasePrimary) {
    try {
      const [loansRes, txsRes] = await Promise.all([
        supabasePrimary.from('loans').select('*').order('loan_no', { ascending: true }),
        supabasePrimary.from('transactions').select('*').order('date', { ascending: true })
      ]);
      if (loansRes.data) dbLoans = loansRes.data as Loan[];
      if (txsRes.data) dbTxs = txsRes.data as Transaction[];
    } catch (e) {
      console.warn('Batch Supabase fetch failed', e);
    }
  }

  const txsByMemberMap = new Map<string, Transaction[]>();
  const seenTxKeys = new Set<string>();

  function addTxToMap(t: Transaction) {
    if (!t || !t.member_id) return;
    const dateStr = t.date ? t.date.split('T')[0] : '';
    const instNo = t.installment_no ?? 'null';
    const dep = Number(t.savings_deposit || 0);
    const withd = Number(t.savings_withdraw || 0);
    const rep = Number(t.loan_repayment || 0);
    const key = t.id ? `id:${t.id}` : `content:${t.member_id}_${dateStr}_inst:${instNo}_dep:${dep}_wth:${withd}_rep:${rep}`;
    if (seenTxKeys.has(key)) return;
    seenTxKeys.add(key);

    const mId = t.member_id;
    if (!txsByMemberMap.has(mId)) txsByMemberMap.set(mId, []);
    txsByMemberMap.get(mId)!.push(t);
  }

  dbTxs.forEach(addTxToMap);

  const loansByMemberMap = new Map<string, Map<string, Loan>>();

  function addLoanToMap(l: Loan) {
    if (!l || !l.member_id) return;
    const mId = l.member_id;
    if (!loansByMemberMap.has(mId)) loansByMemberMap.set(mId, new Map());
    const lNo = l.loan_no || 1;
    loansByMemberMap.get(mId)!.set(`loan_no_${lNo}`, l);
  }

  dbLoans.forEach(addLoanToMap);

  let totalGranted = 0;
  let totalCollected = 0;
  let totalRemaining = 0;
  let totalSavings = 0;

  const memberSummaries: {
    [id: string]: {
      remaining: number;
      savings: number;
      loanCount: number;
      completedLoanCount: number;
      activeLoanCount: number;
    };
  } = {};

  for (const member of members) {
    const mLoansMap = loansByMemberMap.get(member.id) || new Map<string, Loan>();
    const defaultLoan1: Loan = {
      id: member.id,
      member_id: member.id,
      loan_no: 1,
      loan_amount: Number(member.loan_amount || 0),
      loan_purpose: member.loan_purpose || 'সাধারণ ঋণ',
      total_installments: Number(member.total_installments || 44),
      admission_date: member.admission_date || new Date().toISOString().split('T')[0],
      status: member.status || 'active',
      created_at: member.created_at
    };
    if (!mLoansMap.has('loan_no_1')) {
      mLoansMap.set('loan_no_1', defaultLoan1);
    }

    const loansList = Array.from(mLoansMap.values());

    const mTxs = [
      ...(txsByMemberMap.get(member.id) || []),
      ...(member.member_no ? (txsByMemberMap.get(member.member_no) || []) : [])
    ];

    let mTotalRemaining = 0;
    let mTotalSavings = 0;
    let completedCount = 0;
    let activeCount = 0;

    for (const loan of loansList) {
      const loanTxs = mTxs.filter((t) => {
        if (t.loan_id) {
          return (
            t.loan_id === loan.id ||
            (t.loan_id === member.id && loan.loan_no === 1) ||
            String(t.loan_id) === String(loan.loan_no)
          );
        }
        return loan.loan_no === 1 || loan.id === member.id;
      });

      let currentLoanBalance = Number(loan.loan_amount || 0);
      let totalLoanPaid = 0;
      const isFirstLoan = loan.loan_no === 1 || loan.id === member.id;
      let runningLoanSavings = isFirstLoan ? Number(member.savings_initial || 0) : 0;

      for (const t of loanTxs) {
        const repayment = Number(t.loan_repayment || 0);
        currentLoanBalance = Math.max(0, currentLoanBalance - repayment);
        totalLoanPaid += repayment;

        const deposit = Number(t.savings_deposit || 0);
        const withdraw = Number(t.savings_withdraw || 0);
        runningLoanSavings += deposit - withdraw;
      }

      totalGranted += Number(loan.loan_amount || 0);
      totalCollected += totalLoanPaid;
      totalRemaining += currentLoanBalance;
      totalSavings += runningLoanSavings;

      mTotalRemaining += currentLoanBalance;
      mTotalSavings += runningLoanSavings;

      if (currentLoanBalance <= 0 && Number(loan.loan_amount || 0) > 0) {
        completedCount++;
      } else {
        activeCount++;
      }
    }

    memberSummaries[member.id] = {
      remaining: mTotalRemaining,
      savings: mTotalSavings,
      loanCount: loansList.length,
      completedLoanCount: completedCount,
      activeLoanCount: activeCount
    };
  }

  return {
    members,
    stats: {
      totalGranted,
      totalCollected,
      totalRemaining,
      totalSavings,
      activeCount: members.length
    },
    memberSummaries
  };
}

export async function getMemberPassbookDataBatch(memberId: string) {
  const m = await getMemberById(memberId);
  if (!m) return null;
  const memberLoans = await getLoansForMember(m.id);
  const loanSummaries: { loan: Loan; rows: LedgerRowCalculation[]; summary: FinancialSummary }[] = [];

  for (const l of memberLoans) {
    const { rows, summary } = await getCalculatedLedgerForLoan(m, l);
    loanSummaries.push({ loan: l, rows, summary });
  }

  return { member: m, loans: memberLoans, loanSummaries };
}

export async function exportFullBackupJSON() {
  const members = await getMembers();
  let allTransactions: Transaction[] = [];

  for (const m of members) {
    const txs = await getTransactionsForMember(m.id);
    allTransactions = [...allTransactions, ...txs];
  }

  const backupData = {
    app: 'Simple Loan Management System',
    timestamp: new Date().toISOString(),
    primary_db: 'https://ddhmleulfdspdgnbkhda.supabase.co',
    members_count: members.length,
    transactions_count: allTransactions.length,
    members,
    transactions: allTransactions
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `loan_management_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteAllData(): Promise<boolean> {
  if (isPrimaryConfigured && supabasePrimary) {
    try {
      await supabasePrimary.from('transactions').delete().neq('id', '');
      await supabasePrimary.from('loans').delete().neq('id', '');
      await supabasePrimary.from('members').delete().neq('id', '');
    } catch (e) {
      console.warn('Primary Supabase wipe failed', e);
    }
  }

  purgeLocalDataCache();
  return true;
}
