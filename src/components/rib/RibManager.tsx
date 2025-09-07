import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import RibForm from './RibForm';
import RibList from './RibList';
import SearchFilter from './SearchFilter';
import Pagination from './Pagination';

const RibManager: React.FC = () => {
  const { companies, loading, error, createCompany, updateCompany, deleteCompany } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const itemsPerPage = 10;

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.rib.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.address && company.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (company.siret && company.siret.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
      } else {
        await createCompany(formData);
      }
      setShowForm(false);
      setEditingCompany(null);
    } catch (err) {
      console.error('Error saving company:', err);
    }
  };

  const handleEdit = (company: any) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      try {
        await deleteCompany(id);
      } catch (err) {
        console.error('Error deleting company:', err);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCompany(null);
  };

  const handleAddNew = () => {
    setEditingCompany(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
        Erreur lors du chargement des comptes: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Comptes (RIB)</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gestion des comptes bancaires et RIB
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau compte
        </button>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalItems={filteredCompanies.length}
      />

      <RibList
        companies={currentCompanies}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {showForm && (
        <RibForm
          company={editingCompany}
          onSave={handleFormSubmit}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
};

export default RibManager;