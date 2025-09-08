import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Client = Database['public']['Tables']['clients']['Row'];
export type Company = Database['public']['Tables']['companies']['Row'];
export type Transfer = Database['public']['Tables']['transfers']['Row'] & {
  debit_company?: Company;
  credit_company?: Company;
  client?: Client;
};
export type CommissionRate = Database['public']['Tables']['commission_rates']['Row'];