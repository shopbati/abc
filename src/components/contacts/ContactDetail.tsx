import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, AlertCircle, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Contact } from '../../hooks/useContacts';

interface ContactAddress {
  id: string;
  contact_id: string;
  label: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface ContactDetailProps {
  contact?: Contact | null;
  onSubmit: (data: {
    company: string;
    siret?: string;
    full_name: string;
    phone?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; data?: Contact }>;
  onBack: () => void;
}

const ContactDetail: React.FC<ContactDetailProps> = ({ contact, onSubmit, onBack }) => {
  const [company, setCompany] = useState('');
  const [siret, setSiret] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedContactId, setSavedContactId] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<ContactAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ContactAddress | null>(null);

  const [addressLabel, setAddressLabel] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('France');
  const [isPrimary, setIsPrimary] = useState(false);

  const isEditing = !!contact;
  const currentContactId = contact?.id || savedContactId;

  useEffect(() => {
    if (contact) {
      setCompany(contact.company);
      setSiret(contact.siret || '');
      setFullName(contact.full_name);
      setPhone(contact.phone || '');
      setEmail(contact.email || '');
      setSavedContactId(contact.id);
      fetchAddresses(contact.id);
    } else {
      setCompany('');
      setSiret('');
      setFullName('');
      setPhone('');
      setEmail('');
      setSavedContactId(null);
      setAddresses([]);
    }
    setError(null);
  }, [contact]);

  const fetchAddresses = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('contact_addresses')
        .select('*')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!company.trim()) {
      setError('Le nom de la société est requis');
      return;
    }

    if (!fullName.trim()) {
      setError('Le nom et prénom sont requis');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        company: company.trim(),
        siret: siret.trim() || undefined,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined
      });

      if (result.success && result.data) {
        setSavedContactId(result.data.id);
        if (!isEditing) {
          fetchAddresses(result.data.id);
        }
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAddressForm = () => {
    setAddressLabel('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setPostalCode('');
    setCountry('France');
    setIsPrimary(false);
    setEditingAddress(null);
  };

  const handleAddAddress = () => {
    resetAddressForm();
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: ContactAddress) => {
    setAddressLabel(address.label || '');
    setAddressLine1(address.address_line1);
    setAddressLine2(address.address_line2 || '');
    setCity(address.city);
    setPostalCode(address.postal_code);
    setCountry(address.country);
    setIsPrimary(address.is_primary);
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentContactId) {
      setError('Veuillez d\'abord enregistrer le contact');
      return;
    }

    if (!addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      setError('Adresse, ville et code postal sont requis');
      return;
    }

    try {
      if (editingAddress) {
        const { error } = await supabase
          .from('contact_addresses')
          .update({
            label: addressLabel.trim() || null,
            address_line1: addressLine1.trim(),
            address_line2: addressLine2.trim() || null,
            city: city.trim(),
            postal_code: postalCode.trim(),
            country: country.trim(),
            is_primary: isPrimary,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_addresses')
          .insert({
            contact_id: currentContactId,
            label: addressLabel.trim() || null,
            address_line1: addressLine1.trim(),
            address_line2: addressLine2.trim() || null,
            city: city.trim(),
            postal_code: postalCode.trim(),
            country: country.trim(),
            is_primary: isPrimary,
          });

        if (error) throw error;
      }

      await fetchAddresses(currentContactId);
      setShowAddressForm(false);
      resetAddressForm();
    } catch (err) {
      console.error('Error saving address:', err);
      setError('Erreur lors de la sauvegarde de l\'adresse');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) return;

    try {
      const { error } = await supabase
        .from('contact_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      if (currentContactId) {
        await fetchAddresses(currentContactId);
      }
    } catch (err) {
      console.error('Error deleting address:', err);
      setError('Erreur lors de la suppression de l\'adresse');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Modifier le contact' : 'Nouveau contact'}
        </h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations générales</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Société *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nom de la société"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SIRET
              </label>
              <input
                type="text"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="123 456 789 00012"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom et prénom *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Jean Dupont"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="+33 1 23 45 67 89"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="contact@example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder le contact'}
            </button>
          </div>
        </form>
      </div>

      {currentContactId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adresses</h3>
            <button
              onClick={handleAddAddress}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une adresse
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleSaveAddress} className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Libellé
                  </label>
                  <input
                    type="text"
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Siège social, Bureau secondaire..."
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Adresse principale
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Numéro et nom de rue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Complément d'adresse
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Bâtiment, Étage, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="75001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Paris"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pays *
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="France"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false);
                    resetAddressForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  {editingAddress ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>Aucune adresse enregistrée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        {address.label && (
                          <span className="font-medium text-gray-900 dark:text-white">
                            {address.label}
                          </span>
                        )}
                        {address.is_primary && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <div>{address.address_line1}</div>
                        {address.address_line2 && <div>{address.address_line2}</div>}
                        <div>
                          {address.postal_code} {address.city}
                        </div>
                        <div>{address.country}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactDetail;
