import { createClient } from '@supabase/supabase-js';

// Primary Supabase Cloud DB
const primaryUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const primaryAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isPrimaryConfigured = Boolean(primaryUrl && primaryAnonKey && primaryUrl.includes('supabase.co'));
export const isSupabaseConfigured = isPrimaryConfigured;

export const supabasePrimary = isPrimaryConfigured
  ? createClient(primaryUrl, primaryAnonKey)
  : null;

// Legacy default export alias
export const supabase = supabasePrimary;

