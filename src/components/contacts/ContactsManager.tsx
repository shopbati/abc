import React, { useState } from 'react';
import { useContacts, type Contact } from '../../hooks/useContacts';
import ContactList from './ContactList';
import ContactDetail from './ContactDetail';

const ContactsManager: React.FC = () => {
  const { contacts, loading, error, addContact, updateContact, deleteContact } = useContacts();
  const [showDetail, setShowDetail] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const handleAddNew = () => {
    setEditingContact(null);
    setShowDetail(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowDetail(true);
  };

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;

    const result = await deleteContact(contactToDelete.id);
    if (result.success) {
      setShowDeleteConfirm(false);
      setContactToDelete(null);
    }
  };

  const handleDetailSubmit = async (data: {
    company: string;
    siret?: string;
    full_name: string;
    phone?: string;
    email?: string;
  }) => {
    if (editingContact) {
      return await updateContact(editingContact.id, data);
    } else {
      return await addContact(data);
    }
  };

  const handleDetailBack = () => {
    setShowDetail(false);
    setEditingContact(null);
  };

  if (showDetail) {
    return (
      <ContactDetail
        contact={editingContact}
        onSubmit={handleDetailSubmit}
        onBack={handleDetailBack}
      />
    );
  }

  return (
    <>
      <ContactList
        contacts={contacts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
        loading={loading}
        error={error}
      />

      {showDeleteConfirm && contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer le contact "{contactToDelete.company}" ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setContactToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactsManager;
