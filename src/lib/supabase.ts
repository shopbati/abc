import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced validation with detailed error messages
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}. Please check your .env file.`);
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}. Expected format: https://xxx.supabase.co`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Client {
}
export interface Company {
  id: string;
  name: string;
  rib: string;
  address: string | null;
  siret: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  client_id: string;
  debit_company_id: string;
  credit_company_id: string;
  amount: number;
  transfer_type: 'incoming' | 'outgoing';
  commission_percentage: number;
  commission_amount: number;
  net_amount: number;
  parent_transfer_id: string | null;
  note: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  // Joined data
  debit_company?: Company;
  credit_company?: Company;
  parent_transfer?: Transfer;
  child_transfers?: Transfer[];
  client?: {
    id: string;
    name: string;
  };
}

export interface CommissionRate {
  id: string;
  rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}