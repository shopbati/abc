import React, { useState } from 'react';
import RibForm from './RibForm';
import RibList from './RibList';
import { useCompanies } from '../../hooks/useCompanies';

interface Company {
  id: string;
  name: string;
  rib: string;
  address?: string;
  siret?: string;
  created_at?: string;
  updated_at?: string;
}

export function RibManager() {
  const { companies, loading, error, addCompany, updateCompany, deleteCompany, refetch } = useCompanies();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowForm(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      await deleteCompany(companyId);
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCompany(null);
  };

  const handleSubmit = async (formData: {
    name: string;
    rib: string;
    address?: string;
    siret?: string;
  }) => {
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
      } else {
        await addCompany(formData);
      }
      setShowForm(false);
      setEditingCompany(null);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error saving company:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Gestion des Comptes RIB
      </h1>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!showForm && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Liste des Comptes
          </h2>
          <button
            onClick={handleAddCompany}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Nouveau Compte
          </button>
        </div>
      )}

      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {editingCompany ? 'Modifier le Compte' : 'Ajouter un Nouveau Compte'}
              </h2>
            </div>
            <RibForm 
              onSubmit={handleSubmit} 
              onCancel={handleFormCancel}
              company={editingCompany || undefined}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Liste des Comptes
            </h2>
            <RibList
              companies={companies}
              onEdit={handleEditCompany}
              onDelete={handleDeleteCompany}
            />
          </div>
        </div>
      )}
        
      {!showForm && (
        <RibList
          companies={companies}
          onEdit={handleEditCompany}
          onDelete={handleDeleteCompany}
        />
      )}
    </div>
  );
}