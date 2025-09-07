import { useState, useEffect } from 'react';
import { supabase, type Company } from '../lib/supabase';

interface CommissionData {
  company: Company;
  totalCommissions: number;
  transferCount: number;
  lastTransferDate: string | null;
}

export const useCommissions = (startDate?: string, endDate?: string) => {
  const [commissionsData, setCommissionsData] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build the query for outgoing completed transfers with commissions
      let query = supabase
        .from('transfers')
        .select(`
          commission_amount,
          created_at,
          debit_company_id,
          debit_company:companies!transfers_debit_company_id_fkey(*)
        `)
        .eq('transfer_type', 'outgoing')
        .eq('status', 'completed')
        .gt('commission_amount', 0);

      // Apply date filtering
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59.999Z');
      }

      const { data: transfers, error } = await query;

      if (error) throw error;
      
      // Group commissions by company
      const commissionsMap = new Map<string, CommissionData>();
      
      transfers?.forEach((transfer) => {
        const companyId = transfer.debit_company_id;
        const company = transfer.debit_company;
        const commissionAmount = transfer.commission_amount || 0;
        const transferDate = transfer.created_at;
        
        if (company && commissionAmount > 0) {
          if (commissionsMap.has(companyId)) {
            const existing = commissionsMap.get(companyId)!;
            existing.totalCommissions += commissionAmount;
            existing.transferCount += 1;
            // Update last transfer date if this one is more recent
            if (!existing.lastTransferDate || transferDate > existing.lastTransferDate) {
              existing.lastTransferDate = transferDate;
            }
          } else {
            commissionsMap.set(companyId, {
              company,
              totalCommissions: commissionAmount,
              transferCount: 1,
              lastTransferDate: transferDate
            });
          }
        }
      });
      
      // Convert map to array and sort by total commissions (highest first)
      const commissionsArray = Array.from(commissionsMap.values())
        .sort((a, b) => b.totalCommissions - a.totalCommissions);
      
      setCommissionsData(commissionsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [startDate, endDate]);

  return {
    commissionsData,
    loading,
    error,
    refetch: fetchCommissions
  };
};