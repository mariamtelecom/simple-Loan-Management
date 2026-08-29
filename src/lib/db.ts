import { Member, Transaction, Loan, LedgerRowCalculation, FinancialSummary, EnrichedTransaction } from './types';
import { 
  supabasePrimary, 
  isPrimaryConfigured 
} from './supabaseClient';

const LOCAL_STORAGE_MEMBERS_KEY = 'loan_mgmt_members_v4';
const LOCAL_STORAGE_TRANSACTIONS_KEY = 'loan_mgmt_transactions_v4';
const LOCAL_STORAGE_LOANS_KEY = 'loan_mgmt_loans_v4';


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
  // {
  //   id: 'm-125',
  //   member_no: '১২৫',
  //   name: 'আনোয়ার হোসেন',
  //   father_mother_spouse: 'আব্দুল হাশেম / আমেনা বেগম',
  //   loan_amount: 100000,
  //   savings_initial: 10000,
  //   loan_purpose: 'ব্যবসা সম্প্রসারণ',
  //   admission_date: '2024-06-20',
  //   total_installments: 44,
  //   mobile: '01712345678',
  //   address: 'গ্রাম: রামপুর, ডাকঘর: বাজার রোড, থানা: সদর',
  //   book_no: '১',
  //   guarantor_name: 'মোঃ রফিকুল ইসলাম',
  //   guarantor_father_mother_spouse: 'মোঃ শফিকুল ইসলাম',
  //   guarantor_mobile: '01799887766',
  //   guarantor_address: 'রামপুর পশ্চিম পাড়া',
  //   guarantor_nid: '19852694152000999',
  //   nid_number: '19922694152000125',
  //   photo_url: '',
  //   nid_image_url: '',
  //   status: 'active',
  //   created_at: new Date('2024-06-20').toISOString()
  // }
];

const SEED_TRANSACTIONS: Transaction[] = [
  // {
  //   id: 't-1',
  //   member_id: 'm-125',
  //   date: '2024-06-10',
  //   savings_deposit: 10000,
  //   savings_withdraw: 0,
  //   installment_no: null,
  //   loan_repayment: 0,
  //   collector_signature: 'জসিম',
  //   notes: 'প্রাথমিক সঞ্চয় জমা',
  //   created_at: '2024-06-10T10:00:00Z'
  // },
  // {
  //   id: 't-2',
  //   member_id: 'm-125',
  //   date: '2024-06-10',
  //   savings_deposit: 10000,
  //   savings_withdraw: 0,
  //   installment_no: null,
  //   loan_repayment: 10000,
  //   collector_signature: 'জসিম',
  //   notes: 'ঋণ বিতরণের সময় সঞ্চয় ও প্রাথমিক জমা',
  //   created_at: '2024-06-10T11:00:00Z'
  // },
  // {
  //   id: 't-3',
  //   member_id: 'm-125',
  //   date: '2024-07-10',
  //   savings_deposit: 500,
  //   savings_withdraw: 0,
  //   installment_no: 1,
  //   loan_repayment: 3000,
  //   collector_signature: 'জসিম',
  //   notes: 'প্রথম কিস্তি',
  //   created_at: '2024-07-10T10:00:00Z'
  // },
  // {
  //   id: 't-4',
  //   member_id: 'm-125',
  //   date: '2024-08-10',
  //   savings_deposit: 500,
  //   savings_withdraw: 2000,
  //   installment_no: 2,
  //   loan_repayment: 3000,
  //   collector_signature: 'জসিম',
  //   notes: 'দ্বিতীয় কিস্তি ও সঞ্চয় উত্তোলন',
  //   created_at: '2024-08-10T10:00:00Z'
  // }
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

// ----------------------------------------------------------------------
// LOCAL BACKUP WRITE HELPERS
// ----------------------------------------------------------------------

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

function saveMemberToLocalBackup(member: Member) {
  if (typeof window === 'undefined') return;
  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
  const members: Member[] = raw ? JSON.parse(raw) : [];
  const keysToMatch = new Set(getNormalizedMemberKeys(member));

  const idx = members.findIndex(m => {
    const mKeys = getNormalizedMemberKeys(m);
    return mKeys.some(k => keysToMatch.has(k));
  });

  if (idx >= 0) {
    members[idx] = { ...members[idx], ...member };
  } else {
    members.unshift(member);
  }
  localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(members));
}

function removeMemberFromLocalBackup(id: string) {
  if (typeof window === 'undefined') return;
  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
  const members: Member[] = raw ? JSON.parse(raw) : [];
  const filtered = members.filter(m => m.id !== id);
  localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(filtered));
}

function saveTransactionToLocalBackup(tx: Transaction) {
  if (typeof window === 'undefined') return;
  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
  const all: Transaction[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex(t => t.id === tx.id);
  if (idx >= 0) {
    all[idx] = tx;
  } else {
    all.push(tx);
  }
  localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(all));
}

function removeTransactionFromLocalBackup(id: string) {
  if (typeof window === 'undefined') return;
  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
  const all: Transaction[] = raw ? JSON.parse(raw) : [];
  const filtered = all.filter(t => t.id !== id);
  localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(filtered));
}

function saveLoanToLocalBackup(loan: Loan) {
  if (typeof window === 'undefined') return;
  initializeLocalStorage();
  const raw = localStorage.getItem(LOCAL_STORAGE_LOANS_KEY);
  const loans: Loan[] = raw ? JSON.parse(raw) : [];
  const idx = loans.findIndex(l => l.id === loan.id);
  if (idx >= 0) {
    loans[idx] = loan;
  } else {
    loans.push(loan);
  }
  localStorage.setItem(LOCAL_STORAGE_LOANS_KEY, JSON.stringify(loans));
}


// ----------------------------------------------------------------------
// MULTI-CLOUD DUAL SUPABASE API FUNCTIONS
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
  const finalMembers: Member[] = [];
  const seenKeys = new Set<string>();

  function addMemberIfUnique(m: Member) {
    if (!m) return false;
    const keys = getNormalizedMemberKeys(m);
    const isDuplicate = keys.some(k => seenKeys.has(k));
    if (isDuplicate) return false;

    keys.forEach(k => seenKeys.add(k));
    finalMembers.push(m);
    return true;
  }

  // 1. Try Primary Supabase Cloud DB (Main Database)
  if (isPrimaryConfigured && supabasePrimary) {
    try {
      const { data, error } = await supabasePrimary
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        data.forEach((m: Member) => addMemberIfUnique(m));
      }
    } catch (e) {
      console.warn('Primary Supabase fetch failed', e);
    }
  }

  // 2. Try Local Storage Backup / Seed Data
  initializeLocalStorage();
  const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY) : null;
  const localMembers: Member[] = raw ? JSON.parse(raw) : SEED_MEMBERS;

  localMembers.forEach((m: Member) => addMemberIfUnique(m));

  const resultList = finalMembers.length > 0 ? finalMembers : SEED_MEMBERS;

  // Keep final list ordered by created_at descending
  resultList.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  // Save clean deduplicated list to local storage
  if (typeof window !== 'undefined' && resultList.length > 0) {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(resultList));
  }

  return resultList;
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

/**
 * CREATE MEMBER: Parallel Write to Primary Supabase DB + Secondary Supabase DB + Local Storage Backup!
 */
export async function createMember(member: Omit<Member, 'id' | 'created_at'>): Promise<Member> {
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
    status: 'active'
  };

  // 1. Write to Primary Supabase Cloud DB
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
        // Fallback: If new columns fail due to unmigrated DB table schema, retry with basic payload
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

      // Automatically create Loan 1 in Supabase loans table
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

  // 2. Parallel Write to Local Storage Backup
  saveMemberToLocalBackup(newMember);

  return newMember;
}

/**
 * UPDATE MEMBER: Parallel Update to Primary Supabase DB + Secondary Supabase DB + Local Storage Backup!
 */
export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  let updatedMember: Member | null = null;

  // 1. Update Primary Supabase DB
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

  // 2. Update Local Storage Backup
  initializeLocalStorage();
  const members = await getMembers();
  const index = members.findIndex(m => m.id === id);
  if (index >= 0) {
    updatedMember = { ...members[index], ...updates, updated_at: new Date().toISOString() };
    saveMemberToLocalBackup(updatedMember);
  }

  return updatedMember;
}

/**
 * DELETE MEMBER: Parallel Delete from Primary Supabase DB + Secondary Supabase DB + Local Storage Backup!
 */
export async function deleteMember(id: string): Promise<boolean> {
  if (isPrimaryConfigured && supabasePrimary) {
    try {
      await supabasePrimary.from('members').delete().eq('id', id);
    } catch (e) {
      console.warn('Primary Supabase delete failed', e);
    }
  }

  removeMemberFromLocalBackup(id);
  return true;
}

export function isUuid(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

// ----------------------------------------------------------------------
// TRANSACTIONS (PARALLEL DUAL WRITE TO BOTH SUPABASE CLOUDS + LOCAL BACKUP)
// ----------------------------------------------------------------------

export async function getTransactionsForMember(memberId: string): Promise<Transaction[]> {
  const member = await getMemberById(memberId);
  const memberIdsToMatch = new Set<string>();
  if (memberId) memberIdsToMatch.add(memberId);
  if (member?.id) memberIdsToMatch.add(member.id);
  if (member?.member_no) memberIdsToMatch.add(member.member_no);

  const uuidIdsToMatch = Array.from(memberIdsToMatch).filter(id => isUuid(id));

  const finalTransactions: Transaction[] = [];
  const seenTxKeys = new Set<string>();

  function addTxIfUnique(t: Transaction) {
    if (!t) return false;
    const dateStr = t.date ? t.date.split('T')[0] : '';
    const instNo = t.installment_no ?? 'null';
    const dep = Number(t.savings_deposit || 0);
    const withd = Number(t.savings_withdraw || 0);
    const rep = Number(t.loan_repayment || 0);

    const keys: string[] = [];
    if (t.id) keys.push(`id:${t.id}`);
    if (dateStr) {
      keys.push(`content:${dateStr}_inst:${instNo}_dep:${dep}_wth:${withd}_rep:${rep}`);
    }

    const isDuplicate = keys.some(k => seenTxKeys.has(k));
    if (isDuplicate) return false;

    keys.forEach(k => seenTxKeys.add(k));
    finalTransactions.push(t);
    return true;
  }

  // 1. Try Primary Supabase DB (Only query if valid UUIDs exist)
  if (isPrimaryConfigured && supabasePrimary && uuidIdsToMatch.length > 0) {
    try {
      const { data, error } = await supabasePrimary
        .from('transactions')
        .select('*')
        .in('member_id', uuidIdsToMatch)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        data.forEach((t: Transaction) => addTxIfUnique(t));
      }
    } catch (e) {
      console.warn('Primary Supabase transactions fetch failed', e);
    }
  }

  // 2. Try Local Storage Backup
  initializeLocalStorage();
  const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY) : null;
  const allLocal: Transaction[] = raw ? JSON.parse(raw) : SEED_TRANSACTIONS;
  allLocal
    .filter(t => memberIdsToMatch.has(t.member_id))
    .forEach((t: Transaction) => addTxIfUnique(t));

  return finalTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getAllRecentTransactions(): Promise<EnrichedTransaction[]> {
  const members = await getMembers();
  const memberMap = new Map<string, Member>();
  members.forEach(m => {
    if (m.id) memberMap.set(m.id, m);
    if (m.member_no) memberMap.set(m.member_no, m);
  });

  const rawTxs: Transaction[] = [];
  const seenKeys = new Set<string>();

  function addTx(t: Transaction) {
    if (!t) return;
    const dateStr = t.date ? t.date.split('T')[0] : '';
    const instNo = t.installment_no ?? 'null';
    const dep = Number(t.savings_deposit || 0);
    const withd = Number(t.savings_withdraw || 0);
    const rep = Number(t.loan_repayment || 0);
    const key = t.id ? `id:${t.id}` : `content:${t.member_id}_${dateStr}_inst:${instNo}_dep:${dep}_wth:${withd}_rep:${rep}`;

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      rawTxs.push(t);
    }
  }

  // 1. Fetch from Primary Supabase DB
  if (isPrimaryConfigured && supabasePrimary) {
    try {
      const { data, error } = await supabasePrimary
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        data.forEach((t: Transaction) => addTx(t));
      }
    } catch (e) {
      console.warn('Primary Supabase fetch all transactions failed', e);
    }
  }

  // 2. Fetch from Local Storage Backup
  initializeLocalStorage();
  const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY) : null;
  const allLocal: Transaction[] = raw ? JSON.parse(raw) : SEED_TRANSACTIONS;
  allLocal.forEach((t: Transaction) => addTx(t));

  // Build EnrichedTransaction array
  const loanCache = new Map<string, Loan[]>();
  const enriched: EnrichedTransaction[] = [];

  for (const t of rawTxs) {
    const member = memberMap.get(t.member_id) || null;
    let loanNo = 1;

    if (member) {
      if (!loanCache.has(member.id)) {
        const mLoans = await getLoansForMember(member.id);
        loanCache.set(member.id, mLoans);
      }
      const mLoans = loanCache.get(member.id) || [];
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

  // Sort by timestamp/date descending (latest transactions first!)
  return enriched.sort((a, b) => {
    const timeA = new Date(a.created_at || a.date).getTime();
    const timeB = new Date(b.created_at || b.date).getTime();
    return timeB - timeA;
  });
}

// ----------------------------------------------------------------------
// LOANS API & MULTI-LOAN FUNCTIONS
// ----------------------------------------------------------------------

export async function getLoansForMember(memberId: string): Promise<Loan[]> {
  const member = await getMemberById(memberId);
  if (!member) return [];

  const allCandidateIds = Array.from(new Set([memberId, member.id, member.member_no].filter(Boolean)));
  const uuidIdsToMatch = allCandidateIds.filter(id => isUuid(id));
  const loanMap = new Map<string, Loan>();

  // 1. Always include member's original primary loan as Loan 1 (id: member.id)
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

  // 2. Fetch loans from Primary Supabase DB
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

  // 3. Fetch loans from Local Storage Backup
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOANS_KEY);
    const localLoans: Loan[] = raw ? JSON.parse(raw) : [];
    localLoans.filter(l => allCandidateIds.includes(l.member_id)).forEach((l: Loan) => {
      const lNo = l.loan_no || 1;
      const key = `loan_no_${lNo}`;
      if (lNo === 1) {
        loanMap.set(key, { ...defaultLoan1, ...l, loan_no: 1 });
      } else if (!loanMap.has(key)) {
        loanMap.set(key, l);
      }
    });
  }

  // 5. Sort loans strictly by loan_no serial 1, 2, 3...
  const sortedLoans = Array.from(loanMap.values()).sort((a, b) => (a.loan_no || 1) - (b.loan_no || 1));

  // Ensure serial numbers are clean 1, 2, 3...
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
  const loans = await getLoansForMember(memberId);
  const targetLoan = loans.find(l => l.id === loanId || String(l.loan_no) === String(loanId));
  if (!targetLoan) return null;

  const updatedLoan: Loan = {
    ...targetLoan,
    status,
    updated_at: new Date().toISOString()
  };

  // 1. Update Primary Supabase DB
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

  // 2. Update Local Storage Backup
  saveLoanToLocalBackup(updatedLoan);

  return updatedLoan;
}


export async function createLoan(
  loanData: Omit<Loan, 'id' | 'created_at'>,
  initialSavingsDeposit: number = 0
): Promise<Loan> {
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

  saveLoanToLocalBackup(newLoan);

  // If initial savings deposit specified when taking this loan, automatically record transaction!
  if (initialSavingsDeposit > 0) {
    await addTransaction({
      member_id: newLoan.member_id,
      loan_id: newLoan.id,
      date: newLoan.admission_date,
      savings_deposit: Number(initialSavingsDeposit),
      savings_withdraw: 0,
      installment_no: null,
      loan_repayment: 0,
      collector_signature: 'জসিম',
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

  // Filter transactions for this specific loan
  const loanTxs = allTxs.filter((t) => {
    if (t.loan_id) {
      return (
        t.loan_id === loan.id ||
        (t.loan_id === member.id && loan.loan_no === 1) ||
        String(t.loan_id) === String(loan.loan_no)
      );
    }
    // Legacy transactions without loan_id map to Loan 1
    return loan.loan_no === 1 || loan.id === member.id;
  });

  let currentLoanBalance = Number(loan.loan_amount || 0);
  let totalLoanPaid = 0;

  // Calculate cumulative savings balance for THIS loan specifically
  // Loan 1 starts with member.savings_initial. Loan 2, 3, 4... start with 0.
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

/**
 * ADD TRANSACTION: Parallel Write to Primary Supabase + Secondary Supabase + Local Storage Backup!
 */
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  // 1. Resolve valid member UUID if member_id is a local identifier (e.g. 'm-123')
  let dbMemberId = transaction.member_id;
  if (!isUuid(dbMemberId)) {
    const member = await getMemberById(transaction.member_id);
    if (member && isUuid(member.id)) {
      dbMemberId = member.id;
    }
  }

  // 2. Resolve valid loan ID (support local IDs, loan_no, and Supabase UUIDs)
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

  // 3. Format date to standard ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ) for PostgreSQL compatibility
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

  // 4. Write to Primary Supabase DB
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
        // Fallback retry: If loan_id column or foreign key fails, retry without loan_id
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

  // 5. Parallel Write to Local Storage Backup
  saveTransactionToLocalBackup(newTx);

  return newTx;
}

/**
 * DELETE TRANSACTION: Parallel Delete from Primary Supabase + Secondary Supabase + Local Storage Backup!
 */
export async function deleteTransaction(id: string): Promise<boolean> {
  if (isPrimaryConfigured && supabasePrimary) {
    try {
      await supabasePrimary.from('transactions').delete().eq('id', id);
    } catch (e) {
      console.warn('Primary Supabase transaction delete failed', e);
    }
  }

  removeTransactionFromLocalBackup(id);
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

/**
 * EXPORT FULL BACKUP JSON: Download complete database JSON backup file
 */
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

/**
 * DELETE ALL DATA: Purge all members and transactions from Primary Supabase Cloud DB, Secondary Supabase Cloud DB, and Local Storage Backup.
 */
export async function deleteAllData(): Promise<boolean> {
  // 1. Delete all transactions, loans and members from Primary Supabase DB
  if (isPrimaryConfigured && supabasePrimary) {
    try {
      await supabasePrimary.from('transactions').delete().neq('id', '');
      await supabasePrimary.from('loans').delete().neq('id', '');
      await supabasePrimary.from('members').delete().neq('id', '');
    } catch (e) {
      console.warn('Primary Supabase wipe failed', e);
    }
  }

  // 2. Purge Local Storage Backup
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_MEMBERS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_LOANS_KEY);
      localStorage.removeItem('loan_mgmt_members_v1');
      localStorage.removeItem('loan_mgmt_members_v2');
      localStorage.removeItem('loan_mgmt_members_v3');
      localStorage.removeItem('loan_mgmt_transactions_v1');
      localStorage.removeItem('loan_mgmt_transactions_v2');
      localStorage.removeItem('loan_mgmt_transactions_v3');
      localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify([]));
      localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify([]));
      localStorage.setItem(LOCAL_STORAGE_LOANS_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('LocalStorage clear failed', e);
    }
  }

  return true;
}


