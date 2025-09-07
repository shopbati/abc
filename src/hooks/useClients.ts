import { useState, useEffect } from 'react';
import { supabase, type Client } from '../lib/supabase';

interface ClientWithBalance extends Client {
  totalReceived: number;
  totalSent: number;
  totalCommissions: number;
  currentBalance: number;
}

export const useClients = (startDate?: string, endDate?: string) => {
  const [clients, setClients] = useState<ClientWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test Supabase connection first
      const { error: connectionError } = await supabase.from('clients').select('count').limit(1);
      if (connectionError) {
        throw new Error(`Supabase connection failed: ${connectionError.message}. Please check your Supabase URL and API key.`);
      }
      
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        throw new Error(`Failed to fetch clients: ${clientsError.message}`);
      }
      
      // Fetch all transfers for all clients
      let transfersQuery = supabase
        .from('transfers')
        .select('*')
        .eq('status', 'completed');

      // Apply date filtering
      if (startDate) {
        transfersQuery = transfersQuery.gte('created_at', startDate);
      }
      if (endDate) {
        transfersQuery = transfersQuery.lte('created_at', endDate + 'T23:59:59.999Z');
      }

      const { data: transfersData, error: transfersError } = await transfersQuery;

      if (transfersError) {
        throw new Error(`Failed to fetch transfers: ${transfersError.message}`);
      }

      // Calculate balances for each client
      const clientsWithBalance: ClientWithBalance[] = (clientsData || []).map(client => {
        const clientTransfers = transfersData?.filter(t => t.client_id === client.id) || [];
        
        const totalReceived = clientTransfers
          .filter(t => t.transfer_type === 'incoming')
          .reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0);
        
        const totalSent = clientTransfers
          .filter(t => t.transfer_type === 'outgoing')
          .reduce((sum, t) => sum + (t.net_amount || 0), 0);
        
        const totalCommissions = clientTransfers
          .filter(t => t.transfer_type === 'outgoing')
          .reduce((sum, t) => sum + (t.commission_amount || 0), 0);
        
        const currentBalance = totalReceived - totalSent - totalCommissions;

        return {
          ...client,
          totalReceived,
          totalSent,
          totalCommissions,
          currentBalance
        };
      });

      // Sort by total sent (highest first)
      clientsWithBalance.sort((a, b) => b.totalSent - a.totalSent);
      
      setClients(clientsWithBalance);
    } catch (err) {
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Provide specific guidance for common errors
        if (err.message.includes('Failed to fetch')) {
          errorMessage = `Network connection error: Cannot connect to Supabase. Please check:\n1. Your internet connection\n2. VITE_SUPABASE_URL in .env file\n3. VITE_SUPABASE_ANON_KEY in .env file\n4. Supabase project status`;
        } else if (err.message.includes('invalid API key')) {
          errorMessage = 'Invalid Supabase API key. Please check VITE_SUPABASE_ANON_KEY in your .env file.';
        } else if (err.message.includes('JWT')) {
          errorMessage = 'Authentication error. Please check your Supabase configuration.';
        }
      }
      
      setError(errorMessage);
      console.error('Error fetching clients:', err);
      
      // Log environment variables (safely) for debugging
      console.error('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
      console.error('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData: { name: string; email?: string; phone?: string }) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add client';
      setError(errorMessage);
      console.error('Error adding client:', err);
      return { success: false, error: errorMessage };
    }
  };

  const updateClient = async (id: string, clientData: { name: string; email?: string; phone?: string }) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => prev.map(client => 
        client.id === id ? data : client
      ));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      console.error('Error updating client:', err);
      return { success: false, error: errorMessage };
    }
  };

  const deleteClient = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClients(prev => prev.filter(client => client.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      setError(errorMessage);
      console.error('Error deleting client:', err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchClients();
  }, [startDate, endDate]);

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
};