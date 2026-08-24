export type Language = 'bn' | 'en';

export const translations = {
  bn: {
    appTitle: "ঋণ ও সঞ্চয় ব্যবস্থাপনা সমিতি",
    appSubtitle: "সহজ মাইক্রোফাইনান্স ও পাসবই লেজার সিস্টেম",
    dashboard: "ড্যাশবোর্ড",
    memberList: "সদস্য তালিকা",
    addMember: "নতুন সদস্য যোগ করুন",
    editMember: "সদস্য তথ্য এডিট করুন",
    deleteMember: "সদস্য মুছুন",
    searchPlaceholder: "সদস্য নম্বর, নাম বা মোবাইল দিয়ে খুঁজুন...",
    
    // Header Info (From Image + Updates)
    bookNo: "বই নং / পৃষ্ঠা",
    memberNo: "সদস্য নম্বর",
    memberName: "নাম",
    loanAmount: "ঋণের পরিমাণ",
    savingsInitial: "সঞ্চয় জমা সহ",
    loanPurpose: "ঋণের উদ্দেশ্য",
    admissionDate: "ভর্তির তারিখ",
    totalInstallments: "কিস্তির সংখ্যা",
    mobile: "সদস্যের মোবাইল",
    guarantorName: "জামিনদারের নাম",
    personPhoto: "সদস্যের ছবি (Photo)",
    nidImage: "এনআইডি (NID) কার্ডের ছবি",
    viewNid: "NID কার্ড দেখুন",
    noImage: "কোনো ছবি নেই",
    
    // Financial Summaries
    totalGrantedLoan: "মোট প্রদত্ত ঋণ",
    totalCollectedLoan: "মোট আদায়কৃত ঋণ",
    remainingLoanBalance: "ঋণের অবশিষ্ট স্থিতি",
    totalSavingsBalance: "মোট বর্তমান সঞ্চয়",
    repaymentProgress: "ঋণ পরিশোধের অগ্রগতি",
    activeMembers: "সক্রিয় সদস্য সংখ্যা",

    // Passbook Table Columns (From Image)
    date: "তারিখ",
    savingsDetails: "সঞ্চয়ের বিবরণ",
    deposit: "জমা",
    withdraw: "উত্তোলন",
    totalSavings: "মোট সঞ্চয়",
    installmentNo: "কিস্তি নং",
    loanAccount: "ঋণের হিসাব",
    collection: "আদায়",
    balance: "স্থিতি",
    collectorSignature: "আদায়কারীর স্বাক্ষর",
    actions: "অ্যাকশন",

    // Buttons & Actions
    addTransaction: "নতুন লেনদেন যোগ করুন",
    save: "সংরক্ষণ করুন",
    cancel: "বাতিল",
    printPassbook: "পাসবই প্রিন্ট করুন",
    backToDashboard: "ড্যাশবোর্ডে ফিরুন",
    page: "পৃষ্ঠা",
    of: "এর",
    rowsPerPageNote: "প্রতি পৃষ্ঠায় ১৫টি লেনদেন সারি প্রদর্শিত",
    noTransactionsYet: "এখনো কোনো লেনদেন যুক্ত করা হয়নি। 'নতুন লেনদেন যোগ করুন' বাটনে ক্লিক করে প্রথম কিস্তি বা জমা লিখুন।",

    // Transaction Modal
    transactionType: "লেনদেনের প্রকার",
    savingsDeposit: "সঞ্চয় জমা",
    savingsWithdraw: "সঞ্চয় উত্তোলন",
    loanRepayment: "ঋণের কিস্তি আদায়",
    collectorName: "আদায়কারীর নাম/স্বাক্ষর",
    notes: "মন্তব্য (ঐচ্ছিক)",
    confirmDelete: "আপনি কি নিশ্চিত যে এই সদস্যকে মুছে ফেলতে চান?",
    dbModeSupabase: "Supabase PostgreSQL মোড সক্রিয়",
    dbModeLocal: "লোকাল স্টোরেজ (ডেমো) মোড সক্রিয়"
  },

  en: {
    appTitle: "Loan & Savings Management System",
    appSubtitle: "Microfinance Passbook Ledger Platform",
    dashboard: "Dashboard",
    memberList: "Member List",
    addMember: "Add New Member",
    editMember: "Edit Member Details",
    deleteMember: "Delete Member",
    searchPlaceholder: "Search by Member No, Name or Mobile...",
    
    // Header Info
    bookNo: "Book / Page No",
    memberNo: "Member No",
    memberName: "Member Name",
    loanAmount: "Loan Amount",
    savingsInitial: "Initial Savings",
    loanPurpose: "Loan Purpose",
    admissionDate: "Admission Date",
    totalInstallments: "Total Installments",
    mobile: "Member Mobile",
    guarantorName: "Guarantor Name",
    personPhoto: "Member Photo",
    nidImage: "NID Card Image",
    viewNid: "View NID Card",
    noImage: "No Image",

    // Financial Summaries
    totalGrantedLoan: "Total Loan Granted",
    totalCollectedLoan: "Total Loan Collected",
    remainingLoanBalance: "Remaining Loan Balance",
    totalSavingsBalance: "Total Savings Balance",
    repaymentProgress: "Repayment Progress",
    activeMembers: "Active Members",

    // Passbook Table Columns
    date: "Date",
    savingsDetails: "Savings Details",
    deposit: "Deposit",
    withdraw: "Withdrawal",
    totalSavings: "Total Savings",
    installmentNo: "Inst. No",
    loanAccount: "Loan Account",
    collection: "Collected",
    balance: "Balance",
    collectorSignature: "Collector Signature",
    actions: "Actions",

    // Buttons & Actions
    addTransaction: "Add Transaction",
    save: "Save Details",
    cancel: "Cancel",
    printPassbook: "Print Passbook",
    backToDashboard: "Back to Dashboard",
    page: "Page",
    of: "of",
    rowsPerPageNote: "15 ledger rows displayed per passbook page",
    noTransactionsYet: "No transactions recorded yet. Click 'Add Transaction' to enter deposits or installment collections.",

    // Transaction Modal
    transactionType: "Transaction Type",
    savingsDeposit: "Savings Deposit",
    savingsWithdraw: "Savings Withdrawal",
    loanRepayment: "Loan Installment Repayment",
    collectorName: "Collector Name / Signature",
    notes: "Notes (Optional)",
    confirmDelete: "Are you sure you want to delete this member?",
    dbModeSupabase: "Supabase PostgreSQL Active",
    dbModeLocal: "Local Preview Mode Active"
  }
};
