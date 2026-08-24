-- ========================================================
-- Simple Loan Management System - Supabase PostgreSQL Schema
-- Updated with Member Photo, NID Card Image & Guarantor Name
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MEMBERS TABLE (সদস্য টেবিল)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_no VARCHAR(50) UNIQUE NOT NULL,      -- সদস্য নম্বর (e.g., 125)
    name VARCHAR(255) NOT NULL,                 -- নাম (e.g., আনোয়ার হোসেন)
    loan_amount NUMERIC(12, 2) NOT NULL DEFAULT 0, -- ঋণের পরিমাণ (e.g., 100000)
    savings_initial NUMERIC(12, 2) NOT NULL DEFAULT 0, -- প্রাথমিক সঞ্চয় জমা সহ
    loan_purpose VARCHAR(255) DEFAULT '',       -- ঋণের উদ্দেশ্য
    admission_date DATE DEFAULT CURRENT_DATE,   -- ভর্তির তারিখ
    total_installments INT DEFAULT 44,          -- কিস্তির সংখ্যা
    mobile VARCHAR(30) DEFAULT '',              -- সদস্যের মোবাইল
    book_no VARCHAR(50) DEFAULT '1',            -- বই নং / পৃষ্ঠা
    guarantor_name VARCHAR(255) DEFAULT '',     -- জামিনদারের নাম (Guarantor Name)
    photo_url TEXT DEFAULT '',                  -- সদস্যের ছবি (Person Image Data URL/Link)
    nid_image_url TEXT DEFAULT '',              -- NID কার্ডের ছবি (NID Card Data URL/Link)
    status VARCHAR(20) DEFAULT 'active',        -- active, closed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast member lookup
CREATE INDEX IF NOT EXISTS idx_members_member_no ON public.members(member_no);

-- 2. TRANSACTIONS TABLE (লেনদেন / লেজার টেবিল)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,    -- তারিখ
    savings_deposit NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- জমা
    savings_withdraw NUMERIC(12, 2) NOT NULL DEFAULT 0, -- উত্তোলন
    installment_no INT DEFAULT NULL,            -- কিস্তি নং
    loan_repayment NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- আদায়
    collector_signature VARCHAR(255) DEFAULT '',-- আদায়কারীর স্বাক্ষর / নাম
    notes TEXT DEFAULT '',                      -- মন্তব্য / নোট
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering transactions per member
CREATE INDEX IF NOT EXISTS idx_transactions_member_date ON public.transactions(member_id, date ASC, created_at ASC);

-- Row Level Security (RLS) Enable
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for standard public API access
CREATE POLICY "Allow public read members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public insert members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update members" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete members" ON public.members FOR DELETE USING (true);

CREATE POLICY "Allow public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete transactions" ON public.transactions FOR DELETE USING (true);
