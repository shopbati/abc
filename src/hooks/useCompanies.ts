import { useState, useEffect } from 'react';
import { supabase, type Company } from '../lib/supabase';

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCompanies(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCompany = async (companyData: { name: string; rib: string; address?: string; siret?: string }) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (error) throw error;
      
      setCompanies(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add company';
      setError(errorMessage);
      console.error('Error adding company:', err);
      return { success: false, error: errorMessage };
    }
  };

  const updateCompany = async (id: string, companyData: { name: string; rib: string; address?: string; siret?: string }) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCompanies(prev => prev.map(company => 
        company.id === id ? data : company
      ));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update company';
      setError(errorMessage);
      console.error('Error updating company:', err);
      return { success: false, error: errorMessage };
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCompanies(prev => prev.filter(company => company.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete company';
      setError(errorMessage);
      console.error('Error deleting company:', err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return {
    companies,
    loading,
    error,
    addCompany,
    updateCompany,
    deleteCompany,
    refetch: fetchCompanies
  };
};