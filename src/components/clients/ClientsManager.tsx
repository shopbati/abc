import React, { useState } from 'react';
import { useClients } from '../../hooks/useClients';
import ClientList from './ClientList';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';

interface ClientWithBalance {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  totalReceived: number;
  totalSent: number;
  totalCommissions: number;
  currentBalance: number;
}

const ClientsManager: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  const { clients, loading, error, addClient, updateClient, deleteClient, refetch } = useClients(startDate, endDate);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithBalance | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientWithBalance | null>(null);

  // Refresh data when returning from client detail view
  React.useEffect(() => {
    // Refetch data when selectedClient goes from non-null to null (i.e., when going back to list)
    if (selectedClient === null) {
      const timeoutId = setTimeout(() => {
        refetch();
      }, 100); // Small delay to ensure UI has updated
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedClient]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleAddClient = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: ClientWithBalance) => {
    setEditingClient(client);
    setShowForm(true);
  };


  const handleFormSubmit = async (data: { name: string; email?: string; phone?: string }) => {
    const result = editingClient 
      ? await updateClient(editingClient.id, data)
      : await addClient(data);
    
    return result;
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleClientClick = (client: ClientWithBalance) => {
    setSelectedClient(client);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
  };

  // Show client detail view
  if (selectedClient) {
    return (
      <ClientDetail 
        client={selectedClient} 
        onBack={handleBackToList} 
      />
    );
  }

  return (
    <div>
      <ClientList
        clients={clients}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={{ setStartDate, setEndDate }}
        onClientClick={handleClientClick}
        onEdit={handleEditClient}
        onAddNew={handleAddClient}
        loading={loading}
        error={error}
      />

      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ClientsManager;