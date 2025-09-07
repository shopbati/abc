import { useState, useEffect } from 'react';
import { supabase, type Transfer } from '../lib/supabase';

export const useAllTransfers = (startDate?: string, endDate?: string) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('transfers')
        .select(`
          *,
          debit_company:companies!transfers_debit_company_id_fkey(id, name, rib),
          credit_company:companies!transfers_credit_company_id_fkey(id, name, rib),
          client:clients!transfers_client_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      // Apply date filtering
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59.999Z');
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTransfers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTransferStatus = async (id: string, status: 'pending' | 'completed' | 'failed') => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('transfers')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          debit_company:companies!transfers_debit_company_id_fkey(id, name, rib),
          credit_company:companies!transfers_credit_company_id_fkey(id, name, rib),
          client:clients!transfers_client_id_fkey(id, name)
        `)
        .single();

      if (error) throw error;
      
      setTransfers(prev => prev.map(transfer => 
        transfer.id === id ? data : transfer
      ));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transfer status';
      setError(errorMessage);
      console.error('Error updating transfer status:', err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchAllTransfers();
  }, [startDate, endDate]);

  return {
    transfers,
    loading,
    error,
    updateTransferStatus,
    refetch: fetchAllTransfers
  };
};