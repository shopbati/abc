import React from 'react';
import { ArrowLeft, User, Mail, Phone, Wallet, TrendingUp, TrendingDown, Calendar, Filter, X, ArrowRightLeft, ChevronDown, Percent } from 'lucide-react';
import { useTransfers } from '../../hooks/useTransfers';
import type { Client } from '../../lib/supabase';
import TransferForm from './TransferForm';
import TransferList from './TransferList';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack }) => {
  const { transfers, loading, error, addTransfer, updateTransferStatus } = useTransfers(client.id);
  const [showTransferSection, setShowTransferSection] = React.useState(false);
  const [showFilterSection, setShowFilterSection] = React.useState(false);
  const [startDate, setStartDate] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = React.useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  // Filter transfers by date range
  const filteredTransfers = React.useMemo(() => {
    if (!startDate && !endDate) return transfers;
    
    return transfers.filter(transfer => {
      const transferDate = new Date(transfer.created_at).toISOString().split('T')[0];
      
      if (startDate && transferDate < startDate) return false;
      if (endDate && transferDate > endDate) return false;
      
      return true;
    });
  }, [transfers, startDate, endDate]);

  // Get incoming transfers for the dropdown (use filtered transfers)
  const incomingTransfers = filteredTransfers.filter(t => t.transfer_type === 'incoming' && t.status === 'completed');

  // Format date for display
  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Toutes les données';
    
    const formatDate = (dateStr: string, isMobile = false) => {
      if (isMobile) {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };
    
    // Mobile version - shorter format
    const formatMobile = () => {
      if (startDate && endDate) {
        if (startDate === endDate) {
          return `${formatDate(startDate, true)}`;
        }
        return `${formatDate(startDate, true)} - ${formatDate(endDate, true)}`;
      }
      if (startDate) return `À partir du ${formatDate(startDate, true)}`;
      if (endDate) return `Jusqu'au ${formatDate(endDate, true)}`;
      return 'Période personnalisée';
    };
    
    // Desktop version
    const formatDesktop = () => {
      if (startDate && endDate) {
        if (startDate === endDate) {
          return `Le ${formatDate(startDate)}`;
        }
        return `Du ${formatDate(startDate)} au ${formatDate(endDate)}`;
      }
      if (startDate) return `À partir du ${formatDate(startDate)}`;
      if (endDate) return `Jusqu'au ${formatDate(endDate)}`;
      return 'Période personnalisée';
    };
    
    return { mobile: formatMobile(), desktop: formatDesktop() };
  };

  const dateRangeText = formatDateRange();
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;

  // Quick date setters
  const setCurrentMonth = () => {
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const lastDayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    setStartDate(firstDay);
    setEndDate(lastDayFormatted);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleTransferSubmit = async (transferData: {
    client_id: string;
    debit_company_id: string;
    credit_company_id: string;
    amount: number;
    transfer_type: 'incoming' | 'outgoing';
    commission_percentage?: number;
    parent_transfer_id?: string;
    note?: string;
    transfer_date?: string;
  }) => {
    return await addTransfer(transferData);
  };

  const handleStatusUpdate = async (transferId: string, status: 'pending' | 'completed' | 'failed') => {
    await updateTransferStatus(transferId, status);
  };

  // Calculate client balance based on filtered transfers
  const calculateBalance = () => {
    const completedTransfers = filteredTransfers.filter(t => t.status === 'completed');
    
    const totalIncoming = completedTransfers
      .filter(t => t.transfer_type === 'incoming')
      .reduce((sum, t) => sum + (t.net_amount || 0), 0);
    
    const totalOutgoing = completedTransfers
      .filter(t => t.transfer_type === 'outgoing')
      .reduce((sum, t) => sum + (t.net_amount || 0), 0);
    
    const totalCommissions = completedTransfers
      .filter(t => t.transfer_type === 'outgoing')
      .reduce((sum, t) => sum + (t.commission_amount || 0), 0);
    
    return {
      totalIncoming,
      totalOutgoing,
      totalCommissions,
      balance: totalIncoming - totalOutgoing - totalCommissions
    };
  };

  const { totalIncoming, totalOutgoing, totalCommissions, balance } = calculateBalance();

  const toggleTransferSection = () => {
    setShowTransferSection(!showTransferSection);
  };

  const toggleFilterSection = () => {
    setShowFilterSection(!showFilterSection);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
              <p className="text-sm text-gray-500">Gestion des virements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-full min-w-0 overflow-hidden">
        <button
          onClick={toggleFilterSection}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors min-w-0"
        >
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-shrink">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-gray-900">Filtrer par période</h3>
              <p className="text-xs text-gray-500 break-words">
                {filteredTransfers.length} virement{filteredTransfers.length > 1 ? 's' : ''} trouvé{filteredTransfers.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ChevronDown className={`h-6 w-6 text-gray-400 transition-transform flex-shrink-0 ${showFilterSection ? 'rotate-180' : ''}`} />
        </button>
        
        {showFilterSection && (
          <div className="px-6 pb-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 min-w-0">
              <div className="min-w-0">
                <p className="hidden md:block text-sm text-gray-600 break-words">
                  {typeof dateRangeText === 'object' ? dateRangeText.desktop : dateRangeText}
                </p>
                <p className="md:hidden text-sm text-gray-600 break-words">
                  {typeof dateRangeText === 'object' ? dateRangeText.mobile : dateRangeText}
                </p>
              </div>
              
              {/* Date Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-2 sm:space-y-0 sm:space-x-1 w-full sm:w-auto max-w-full min-w-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 w-full sm:w-auto max-w-full min-w-0">
                  {/* Date Start Input */}
                  <div className="flex flex-col w-20 sm:w-24 max-w-full min-w-0">
                    <label className="text-xs text-gray-500 mb-1 truncate">Début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs w-full min-w-0 max-w-full"
                    />
                  </div>

                  {/* Date End Input */}
                  <div className="flex flex-col w-20 sm:w-24 max-w-full min-w-0">
                    <label className="text-xs text-gray-500 mb-1 truncate">Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs w-full min-w-0 max-w-full"
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-1 w-full sm:w-auto">
                  <button
                    onClick={setCurrentMonth}
                    className="flex-1 sm:flex-none px-1 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium whitespace-nowrap"
                  >
                    Ce mois
                  </button>
                  <button
                    onClick={clearDateFilter}
                    className="flex-1 sm:flex-none px-1 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors font-medium flex items-center justify-center whitespace-nowrap"
                  >
                    <X className="h-3 w-3" />
                    Effacer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Remove the old Date Range Summary Card since info is now in filter section */}
      {(startDate || endDate) && showFilterSection && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 max-w-full min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 w-full sm:w-auto max-w-full min-w-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-blue-900">Période active</h4>
                <p className="hidden md:block text-xs text-blue-700 break-words">
                  {typeof dateRangeText === 'object' ? dateRangeText.desktop : dateRangeText}
                </p>
                <p className="md:hidden text-xs text-blue-700 break-words">
                  {typeof dateRangeText === 'object' ? dateRangeText.mobile : dateRangeText}
                </p>
              </div>
            </div>
            <button
              onClick={clearDateFilter}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
              title="Supprimer le filtre"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-full min-w-0 overflow-hidden">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900">Solde disponible</h3>
            <p className="hidden md:block text-sm text-gray-600 break-words">
              {(startDate || endDate) ? (typeof dateRangeText === 'object' ? dateRangeText.desktop : dateRangeText) : 'Montant total'}
            </p>
            <p className="md:hidden text-sm text-gray-600 break-words">
              {(startDate || endDate) ? (typeof dateRangeText === 'object' ? dateRangeText.mobile : dateRangeText) : 'Total'}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="text-center">
            <div className={`text-3xl md:text-4xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR',
                minimumFractionDigits: 2
              }).format(balance)}
            </div>
            <div className="text-base text-gray-600 mt-2 font-medium">
              {balance >= 0 ? 'Solde positif' : 'Solde négatif'}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-base mb-3">
              <div className="flex items-center text-green-600 min-w-0">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
                <span className="truncate font-medium">Virements reçus</span>
              </div>
              <span className="font-bold text-green-600 ml-2">
                +{new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 0 
                }).format(totalIncoming)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-base mb-3">
              <div className="flex items-center text-red-600 min-w-0">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                </div>
                <span className="truncate font-medium">Virements envoyés</span>
              </div>
              <span className="font-bold text-red-600 ml-2">
                -{new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 0 
                }).format(totalOutgoing)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-base mb-3">
              <div className="flex items-center text-orange-600 min-w-0">
                <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
                  <Percent className="h-3 w-3 text-orange-600" />
                </div>
                <span className="truncate font-medium">Commissions</span>
              </div>
              <span className="font-bold text-orange-600 ml-2">
                -{new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 0 
                }).format(totalCommissions)}
              </span>
            </div>
          </div>
          
          {balance < 1000 && balance > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
              <div className="flex items-center">
                <div className="text-amber-600 text-sm font-medium">
                  ⚠️ Solde faible - Moins de 1 000€ restant
                </div>
              </div>
            </div>
          )}
          
          {balance <= 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
              <div className="flex items-center">
                <div className="text-red-600 text-sm font-medium">
                  ❌ Solde insuffisant pour nouveaux virements
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-full min-w-0">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-green-800">Total reçu</div>
                <div className="text-lg font-bold text-green-700 truncate">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(totalIncoming)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-red-800">Total envoyé</div>
                <div className="text-lg font-bold text-red-700 truncate">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(totalOutgoing)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Percent className="h-4 w-4 text-orange-600" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-orange-800">Commissions</div>
                <div className="text-lg font-bold text-orange-700 truncate">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(totalCommissions)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`${balance >= 0 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'} border rounded-2xl p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className={`w-8 h-8 ${balance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                <Wallet className={`h-4 w-4 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${balance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  Solde actuel
                </div>
                <div className={`text-lg font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'} truncate`}>
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(balance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Transfer Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-full min-w-0 overflow-hidden">
        <button
          onClick={toggleTransferSection}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors min-w-0"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-gray-900">Gérer les virements</h3>
              <p className="text-sm text-gray-600 break-words">
                Créer nouveaux virements
              </p>
            </div>
          </div>
          <ChevronDown className={`h-6 w-6 text-gray-400 transition-transform flex-shrink-0 ${showTransferSection ? 'rotate-180' : ''}`} />
        </button>
        
        {showTransferSection && (
          <div className="px-6 pb-6 space-y-4">
            {/* Transfer Form */}
            <TransferForm
              clientId={client.id}
              onSubmit={handleTransferSubmit}
              loading={loading}
              incomingTransfers={incomingTransfers}
              allTransfers={filteredTransfers}
            />
          </div>
        )}
      </div>

      {/* Transfer History - Always Visible */}
      <div className="max-w-full min-w-0 overflow-hidden">
        <TransferList
          transfers={filteredTransfers}
          onStatusUpdate={handleStatusUpdate}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default ClientDetail;