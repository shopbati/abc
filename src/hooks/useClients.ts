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
      
      // Fetch basic client data
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch transfers data with date filtering
      let transfersQuery = supabase
        .from('transfers')
        .select('client_id, transfer_type, status, amount, net_amount, commission_amount')
        .eq('status', 'completed');

      if (startDate) {
        transfersQuery = transfersQuery.gte('created_at', startDate);
      }
      if (endDate) {
        transfersQuery = transfersQuery.lte('created_at', endDate + 'T23:59:59.999Z');
      }

      const { data: transfersData, error: transfersError } = await transfersQuery;
      
      if (transfersError) throw transfersError;

      // Calculate balances for each client
      const clientsWithBalance: ClientWithBalance[] = (clientsData || []).map(client => {
        const clientTransfers = (transfersData || []).filter(t => t.client_id === client.id);
        
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
      
      setClients(clientsWithBalance);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching clients');
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData: {
    name: string;
    email?: string;
    phone?: string;
  }) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
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

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
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