import { useState, useEffect } from 'react';
import { supabase, type CommissionRate } from '../lib/supabase';

export const useCommissionRates = () => {
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissionRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('commission_rates')
        .select('*')
        .eq('is_active', true)
        .order('rate', { ascending: true });

      if (error) throw error;
      
      setCommissionRates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching commission rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCommissionRate = async (rate: number) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('commission_rates')
        .insert([{ rate }])
        .select()
        .single();

      if (error) throw error;
      
      setCommissionRates(prev => [...prev, data].sort((a, b) => a.rate - b.rate));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add commission rate';
      setError(errorMessage);
      console.error('Error adding commission rate:', err);
      return { success: false, error: errorMessage };
    }
  };

  const updateCommissionRate = async (id: string, updates: { rate?: number; is_active?: boolean }) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('commission_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCommissionRates(prev => prev.map(rate => 
        rate.id === id ? data : rate
      ));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update commission rate';
      setError(errorMessage);
      console.error('Error updating commission rate:', err);
      return { success: false, error: errorMessage };
    }
  };

  const deleteCommissionRate = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('commission_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCommissionRates(prev => prev.filter(rate => rate.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete commission rate';
      setError(errorMessage);
      console.error('Error deleting commission rate:', err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchCommissionRates();
  }, []);

  return {
    commissionRates,
    loading,
    error,
    addCommissionRate,
    updateCommissionRate,
    deleteCommissionRate,
    refetch: fetchCommissionRates
  };
};