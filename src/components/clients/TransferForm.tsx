import React, { useState } from 'react';
import { ArrowRightLeft, AlertCircle, Send, ChevronDown, Search, ArrowDownCircle, ArrowUpCircle, Percent, Calendar } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import { useCommissionRates } from '../../hooks/useCommissionRates';
import type { Company } from '../../lib/supabase';

interface TransferFormProps {
  clientId: string;
  onSubmit: (data: {
    client_id: string;
    debit_company_id: string;
    credit_company_id: string;
    amount: number;
    transfer_type: 'incoming' | 'outgoing';
    commission_percentage?: number;
    note?: string;
    transfer_date?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

const TransferForm: React.FC<TransferFormProps> = ({ clientId, onSubmit, loading = false }) => {
  const { companies } = useCompanies();
  const { commissionRates, loading: commissionLoading } = useCommissionRates();
  const [debitCompanyId, setDebitCompanyId] = useState('');
  const [creditCompanyId, setCreditCompanyId] = useState('');
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState<'incoming' | 'outgoing'>('outgoing');
  const [commissionPercentage, setCommissionPercentage] = useState(5);
  const [note, setNote] = useState('');
  const [transferDate, setTransferDate] = useState(() => {
    // Set current date as default
    return new Date().toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebitDropdown, setShowDebitDropdown] = useState(false);
  const [showCreditDropdown, setShowCreditDropdown] = useState(false);
  const [debitSearchTerm, setDebitSearchTerm] = useState('');
  const [creditSearchTerm, setCreditSearchTerm] = useState('');


  const selectedDebitCompany = companies.find(c => c.id === debitCompanyId);
  const selectedCreditCompany = companies.find(c => c.id === creditCompanyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!debitCompanyId || !creditCompanyId || !amount) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (debitCompanyId === creditCompanyId) {
      setError('Les comptes à débiter et à créditer ne peuvent pas être identiques');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Le montant doit être un nombre positif');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        client_id: clientId,
        debit_company_id: debitCompanyId,
        credit_company_id: creditCompanyId,
        amount: amountNum,
        transfer_type: transferType,
        commission_percentage: transferType === 'outgoing' ? commissionPercentage : 0,
        note: note.trim() || undefined,
        transfer_date: transferDate
      });

      if (result.success) {
        // Reset form
        setDebitCompanyId('');
        setCreditCompanyId('');
        setAmount('');
        setNote('');
        setTransferDate(new Date().toISOString().split('T')[0]);
      } else {
        setError(result.error || 'Erreur lors de la création du virement');
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate commission for display
  const amountNum = parseFloat(amount) || 0;
  const netAmount = amountNum; // Amount that will be received by recipient
  const grossAmount = transferType === 'outgoing' ? (amountNum * (1 + commissionPercentage / 100)) : amountNum;
  const calculatedCommission = transferType === 'outgoing' ? (grossAmount - netAmount) : 0;

  const filterCompanies = (searchTerm: string) => {
    if (!searchTerm.trim()) return companies;
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.rib.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };


  const AccountSelector: React.FC<{
    label: string;
    selectedCompany: Company | undefined;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (companyId: string) => void;
    type: 'debit' | 'credit';
    searchTerm: string;
    onSearchChange: (term: string) => void;
  }> = ({ label, selectedCompany, isOpen, onToggle, onSelect, type, searchTerm, onSearchChange }) => {
    const filteredCompanies = filterCompanies(searchTerm);
    
    return (
      <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} *
      </label>
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        disabled={loading || isSubmitting}
      >
        <div className="flex items-center justify-between">
          {selectedCompany ? (
            <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${
                type === 'debit' ? 'bg-red-500' : 'bg-green-500'
              }`}>
                {selectedCompany.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">{selectedCompany.name}</div>
                <div className="text-xs text-gray-500 font-mono">{selectedCompany.rib}</div>
              </div>
            </div>
          ) : (
            <span className="text-gray-500 text-sm">Sélectionnez un compte</span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                placeholder="Rechercher par nom ou RIB..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {filteredCompanies.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucun compte disponible'}
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => {
                  onSelect(company.id);
                  onSearchChange('');
                  onToggle();
                }}
                className="w-full p-2 text-left hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-semibold ${
                  type === 'debit' ? 'bg-red-500' : 'bg-green-500'
                }`}>
                  {company.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{company.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{company.rib}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          {transferType === 'incoming' ? (
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowUpCircle className="h-4 w-4 text-blue-600" />
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {transferType === 'incoming' ? 'Virement entrant' : 'Virement sortant'}
          </h3>
          <p className="text-xs text-gray-500">
            {transferType === 'incoming' 
              ? 'Enregistrer un virement reçu' 
              : 'Effectuer un virement avec commission'
            }
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transfer Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de virement *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTransferType('incoming');
                setCommissionPercentage(0);
              }}
              className={`p-2 border-2 rounded-lg transition-all flex items-center justify-center space-x-2 text-sm ${
                transferType === 'incoming'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              <span className="font-medium">Entrant</span>
            </button>
            <button
              type="button"
              onClick={() => setTransferType('outgoing')}
              className={`p-2 border-2 rounded-lg transition-all flex items-center justify-center space-x-2 text-sm ${
                transferType === 'outgoing'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span className="font-medium">Sortant</span>
            </button>
          </div>
        </div>


        {/* Account Selectors - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AccountSelector
            label={transferType === 'incoming' ? 'Compte créditeur (expéditeur)' : 'Compte à débiter'}
            selectedCompany={selectedDebitCompany}
            isOpen={showDebitDropdown}
            onToggle={() => {
              setShowDebitDropdown(!showDebitDropdown);
              setShowCreditDropdown(false);
            }}
            onSelect={setDebitCompanyId}
            type="debit"
            searchTerm={debitSearchTerm}
            onSearchChange={setDebitSearchTerm}
          />

          <AccountSelector
            label={transferType === 'incoming' ? 'Compte à créditer (récepteur)' : 'Compte bénéficiaire'}
            selectedCompany={selectedCreditCompany}
            isOpen={showCreditDropdown}
            onToggle={() => {
              setShowCreditDropdown(!showCreditDropdown);
              setShowDebitDropdown(false);
            }}
            onSelect={setCreditCompanyId}
            type="credit"
            searchTerm={creditSearchTerm}
            onSearchChange={setCreditSearchTerm}
          />
        </div>

        {/* Date, Amount, and Commission - Three fields in one row */}
        <div className={`grid grid-cols-1 gap-4 ${transferType === 'outgoing' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date du virement *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={loading || isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="0.00"
                disabled={loading || isSubmitting}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">€</span>
              </div>
            </div>
          </div>

          {/* Commission Selection for Outgoing Transfers */}
          {transferType === 'outgoing' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission à prélever *
              </label>
              <div className="relative">
                <select
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm"
                  disabled={loading || isSubmitting || commissionLoading}
                >
                  {commissionRates.map((rate) => (
                    <option key={rate.id} value={rate.rate}>
                      {rate.rate}%
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Percent className="h-3 w-3 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Commission Calculation Display */}
        {transferType === 'outgoing' && amountNum > 0 && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-green-600">Montant net à transférer:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(netAmount)}
                </span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Notre commission ({commissionPercentage}%):</span>
                <span>
                  +{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculatedCommission)}
                </span>
              </div>
              <div className="flex justify-between border-t border-amber-300 pt-1 font-semibold text-blue-700">
                <span>Montant total débité:</span>
                <span className="font-bold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(grossAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note (optionnel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            rows={2}
            placeholder="Ajouter une note pour ce virement..."
            disabled={loading || isSubmitting}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || loading || !debitCompanyId || !creditCompanyId || !amount}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm ${
              transferType === 'incoming' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            <Send className="h-3 w-3 mr-1" />
            {isSubmitting 
              ? 'Création...' 
              : transferType === 'incoming' 
                ? 'Enregistrer le virement' 
                : 'Créer le virement'
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransferForm;