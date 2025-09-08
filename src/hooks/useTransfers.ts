import { useState, useEffect } from 'react';
import { supabase, type Transfer } from '../lib/supabase';

export const useTransfers = (clientId?: string) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('transfers')
        .select(`
          *,
          debit_company:companies!transfers_debit_company_id_fkey(id, name, rib),
          credit_company:companies!transfers_credit_company_id_fkey(id, name, rib)
        `)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
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

  const addTransfer = async (transferData: {
    client_id: string;
    debit_company_id: string;
    credit_company_id: string;
    amount: number;
    transfer_type: 'incoming' | 'outgoing';
    commission_percentage?: number;
    parent_transfer_id?: string;
    note?: string;
    transfer_date?: string;
  }) => {
    try {
      setError(null);
      
      // Extract transfer_date from transferData to prevent it from being sent to Supabase
      const { transfer_date, ...transferDataWithoutDate } = transferData;
      
      // Calculate commission for outgoing transfers
      const commissionPercentage = transferData.commission_percentage || 0;
      
      let netAmount, grossAmount, commissionAmount;
      if (transferData.transfer_type === 'outgoing') {
        netAmount = transferData.amount; // Amount recipient receives
        grossAmount = transferData.amount * (1 + commissionPercentage / 100); // Total debited
        commissionAmount = grossAmount - netAmount; // Commission kept
      } else {
        netAmount = transferData.amount;
        grossAmount = transferData.amount;
        commissionAmount = 0;
      }
      
      const insertData = {
        ...transferDataWithoutDate,
        amount: grossAmount, // Store gross amount in database
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        net_amount: netAmount,
        // If transfer_date is provided, use it, otherwise use current timestamp
        ...(transfer_date && { 
          created_at: new Date(transfer_date).toISOString() 
        })
      };
      
      const { data, error } = await supabase
        .from('transfers')
        .insert([insertData])
        .select(`
          *,
          debit_company:companies!transfers_debit_company_id_fkey(id, name, rib),
          credit_company:companies!transfers_credit_company_id_fkey(id, name, rib)
        `)
        .single();

      if (error) throw error;
      
      setTransfers(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transfer';
      setError(errorMessage);
      console.error('Error creating transfer:', err);
      return { success: false, error: errorMessage };
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
          credit_company:companies!transfers_credit_company_id_fkey(id, name, rib)
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

  const updateTransfer = async (id: string, updates: { created_at?: string; note?: string }) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('transfers')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          debit_company:companies!transfers_debit_company_id_fkey(id, name, rib),
          credit_company:companies!transfers_credit_company_id_fkey(id, name, rib)
        `)
        .single();

      if (error) throw error;
      
      setTransfers(prev => prev.map(transfer => 
        transfer.id === id ? data : transfer
      ));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transfer';
      setError(errorMessage);
      console.error('Error updating transfer:', err);
      return { success: false, error: errorMessage };
    }
  };
  const deleteTransfer = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('transfers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransfers(prev => prev.filter(transfer => transfer.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transfer';
      setError(errorMessage);
      console.error('Error deleting transfer:', err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [clientId]);

  return {
    transfers,
    loading,
    error,
    addTransfer,
    updateTransferStatus,
    updateTransfer,
    deleteTransfer,
    refetch: fetchTransfers
  };
};