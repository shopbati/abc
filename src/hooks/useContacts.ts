import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Contact {
  id: string;
  company: string;
  siret: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching contacts');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contactData: {
    company: string;
    siret?: string;
    full_name: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          company: contactData.company,
          siret: contactData.siret || null,
          full_name: contactData.full_name,
          phone: contactData.phone || null,
          email: contactData.email || null,
        })
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact';
      setError(errorMessage);
      console.error('Error adding contact:', err);
      return { success: false, error: errorMessage };
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => prev.map(contact =>
        contact.id === id ? data : contact
      ));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      setError(errorMessage);
      console.error('Error updating contact:', err);
      return { success: false, error: errorMessage };
    }
  };

  const deleteContact = async (id: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(errorMessage);
      console.error('Error deleting contact:', err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts
  };
};
