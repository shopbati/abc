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
    parent_transfer_id?: string;
    note?: string;
    transfer_date?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
  incomingTransfers?: Array<{id: string; amount: number; net_amount: number; note?: string}>;
  allTransfers?: Array<{id: string; parent_transfer_id?: string; net_amount: number; transfer_type: string}>;
}

const TransferForm: React.FC<TransferFormProps> = ({ clientId, onSubmit, loading = false, incomingTransfers = [], allTransfers = [] }) => {
  const { companies } = useCompanies();
  const { commissionRates, loading: commissionLoading } = useCommissionRates();
  const [debitCompanyId, setDebitCompanyId] = useState('');
  const [creditCompanyId, setCreditCompanyId] = useState('');
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState<'incoming' | 'outgoing'>('outgoing');
  const [commissionPercentage, setCommissionPercentage] = useState(5);
  const [parentTransferId, setParentTransferId] = useState('');
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

  // Auto-select first incoming transfer when available
  React.useEffect(() => {
    if (transferType === 'outgoing' && incomingTransfers.length > 0 && !parentTransferId) {
      setParentTransferId(incomingTransfers[0].id);
    }
  }, [transferType, incomingTransfers, parentTransferId]);

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
        parent_transfer_id: parentTransferId || undefined,
        note: note.trim() || undefined,
        transfer_date: transferDate
      });

      if (result.success) {
        // Reset form
        setDebitCompanyId('');
        setCreditCompanyId('');
        setAmount('');
        setParentTransferId('');
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

  // Calculate remaining balance for each incoming transfer
  const calculateRemainingBalance = (incomingTransfer: {id: string; net_amount: number}) => {
    const usedAmount = allTransfers
      .filter(t => t.parent_transfer_id === incomingTransfer.id && t.transfer_type === 'outgoing')
      .reduce((sum, t) => sum + (t.net_amount || 0) + (t.commission_amount || 0), 0);
    
    return incomingTransfer.net_amount - usedAmount;
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
        className="w-full p-4 border border-gray-300 rounded-lg bg-white text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        disabled={loading || isSubmitting}
      >
        <div className="flex items-center justify-between">
          {selectedCompany ? (
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${
                type === 'debit' ? 'bg-red-500' : 'bg-green-500'
              }`}>
                {selectedCompany.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900">{selectedCompany.name}</div>
                <div className="text-sm text-gray-500 font-mono">{selectedCompany.rib}</div>
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Sélectionnez un compte</span>
          )}
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Rechercher par nom ou RIB..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {filteredCompanies.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
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
                className="w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold ${
                  type === 'debit' ? 'bg-red-500' : 'bg-green-500'
                }`}>
                  {company.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{company.name}</div>
                  <div className="text-sm text-gray-500 font-mono">{company.rib}</div>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          {transferType === 'incoming' ? (
            <ArrowDownCircle className="h-6 w-6 text-green-600" />
          ) : (
            <ArrowUpCircle className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {transferType === 'incoming' ? 'Virement entrant' : 'Virement sortant'}
          </h3>
          <p className="text-sm text-gray-500">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transfer Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type de virement *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setTransferType('incoming');
                setCommissionPercentage(0);
              }}
              className={`p-4 border-2 rounded-lg transition-all flex items-center justify-center space-x-3 ${
                transferType === 'incoming'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ArrowDownCircle className="h-5 w-5" />
              <span className="font-medium">Virement entrant</span>
            </button>
            <button
              type="button"
              onClick={() => setTransferType('outgoing')}
              className={`p-4 border-2 rounded-lg transition-all flex items-center justify-center space-x-3 ${
                transferType === 'outgoing'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ArrowUpCircle className="h-5 w-5" />
              <span className="font-medium">Virement sortant</span>
            </button>
          </div>
        </div>

        {/* Parent Transfer Selection for Outgoing */}
        {transferType === 'outgoing' && incomingTransfers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utiliser le solde d'un virement entrant (optionnel)
            </label>
            <select
              value={parentTransferId}
              onChange={(e) => setParentTransferId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || isSubmitting}
            >
              <option value="">Nouveau virement (pas lié à un entrant)</option>
              {incomingTransfers.map((transfer) => (
                <option key={transfer.id} value={transfer.id}>
                  {transfer.note || `Virement de ${transfer.amount}€`} - Solde: {calculateRemainingBalance(transfer)}€
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Transfer Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date du virement *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || isSubmitting}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              disabled={loading || isSubmitting}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">€</span>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                disabled={loading || isSubmitting || commissionLoading}
              >
                {commissionRates.map((rate) => (
                  <option key={rate.id} value={rate.rate}>
                    {rate.rate}%
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Percent className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          
            {/* Commission Calculation Display */}
            {transferType === 'outgoing' && amountNum > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm space-y-1">
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
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note (optionnel)
          </label>
          {commissionLoading && (
            <div className="mb-2 text-sm text-gray-500">
              Chargement des taux de commission...
            </div>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            placeholder="Ajouter une note pour ce virement..."
            disabled={loading || isSubmitting}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting || loading || !debitCompanyId || !creditCompanyId || !amount}
            className={`px-6 py-3 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
              transferType === 'incoming' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            <Send className="h-4 w-4 mr-2" />
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