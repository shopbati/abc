import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Calendar, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  User,
  Percent,
  ChevronDown,
  Search
} from 'lucide-react';
import type { Transfer } from '../../lib/supabase';

interface MovementsListProps {
  transfers: Transfer[];
  onStatusUpdate?: (id: string, status: 'pending' | 'completed' | 'failed') => void;
  loading?: boolean;
  error?: string | null;
}

const MovementsList: React.FC<MovementsListProps> = ({ transfers, onStatusUpdate, loading = false, error }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCard = (transferId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(transferId)) {
      newExpanded.delete(transferId);
    } else {
      newExpanded.add(transferId);
    }
    setExpandedCards(newExpanded);
  };

  const filteredTransfers = transfers.filter(transfer => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transfer.debit_company?.name.toLowerCase().includes(searchLower) ||
      transfer.credit_company?.name.toLowerCase().includes(searchLower) ||
      transfer.client?.name.toLowerCase().includes(searchLower) ||
      transfer.note?.toLowerCase().includes(searchLower) ||
      transfer.debit_company?.rib.toLowerCase().includes(searchLower) ||
      transfer.credit_company?.rib.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm font-medium">Chargement des mouvements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-red-600 font-medium mb-2">Erreur lors du chargement</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">Aucun mouvement trouvé</p>
        <p className="text-sm text-gray-400 mt-1">Les mouvements apparaîtront ici</p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          badgeColor: 'bg-green-100 text-green-800 border-green-200',
          label: 'Terminé'
        };
      case 'failed':
        return {
          icon: XCircle,
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          label: 'Échoué'
        };
      default:
        return {
          icon: Clock,
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
          label: 'En attente'
        };
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const calculateTotals = () => {
    const completedTransfers = filteredTransfers.filter(t => t.status === 'completed');
    
    const totalIncoming = completedTransfers
      .filter(t => t.transfer_type === 'incoming')
      .reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0);
    
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
      netBalance: totalIncoming - totalOutgoing - totalCommissions
    };
  };

  const { totalIncoming, totalOutgoing, totalCommissions, netBalance } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Rechercher par client, entreprise, RIB ou note..."
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-green-800">Entrées</div>
              <div className="text-lg font-bold text-green-700">
                +{formatAmount(totalIncoming).replace('€', '')}€
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-red-800">Sorties</div>
              <div className="text-lg font-bold text-red-700">
                -{formatAmount(totalOutgoing).replace('€', '')}€
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Percent className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-orange-800">Commissions</div>
              <div className="text-lg font-bold text-orange-700">
                +{formatAmount(totalCommissions).replace('€', '')}€
              </div>
            </div>
          </div>
        </div>

        <div className={`${netBalance >= 0 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'} border rounded-2xl p-4 shadow-sm`}>
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-8 h-8 ${netBalance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
              <ArrowRightLeft className={`h-4 w-4 ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <div>
              <div className={`text-sm font-semibold ${netBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                Solde Net
              </div>
              <div className={`text-lg font-bold ${netBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatAmount(netBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
            </div>
            Relevé des Mouvements
            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {filteredTransfers.length} mouvement{filteredTransfers.length > 1 ? 's' : ''}
            </span>
          </h3>
        </div>

        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mouvement</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTransfers.map((transfer) => {
                const statusConfig = getStatusConfig(transfer.status);
                const isIncoming = transfer.transfer_type === 'incoming';
                const { date, time } = formatDate(transfer.created_at);

                return (
                  <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{date}</div>
                        <div className="text-xs text-gray-500">{time}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {transfer.client?.name || 'Client inconnu'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isIncoming ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isIncoming ? (
                          <ArrowDownCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                        )}
                        {isIncoming ? 'Entrant' : 'Sortant'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {transfer.debit_company?.name} → {transfer.credit_company?.name}
                        </div>
                        {transfer.note && (
                          <div className="text-xs text-gray-500 mt-1">{transfer.note}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="text-sm">
                        <div className={`font-bold ${
                          isIncoming ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isIncoming ? '+' : '-'}{formatAmount(transfer.net_amount || transfer.amount)}
                        </div>
                        {!isIncoming && transfer.commission_amount > 0 && (
                          <div className="text-xs text-orange-600">
                            Commission: {formatAmount(transfer.commission_amount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.badgeColor}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {onStatusUpdate && transfer.status === 'pending' && (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onStatusUpdate(transfer.id, 'completed')}
                            className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs"
                            title="Valider"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => onStatusUpdate(transfer.id, 'failed')}
                            className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs"
                            title="Rejeter"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Show only on mobile */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredTransfers.map((transfer) => {
            const statusConfig = getStatusConfig(transfer.status);
            const isIncoming = transfer.transfer_type === 'incoming';
            const isExpanded = expandedCards.has(transfer.id);
            const { date, time } = formatDate(transfer.created_at);

            return (
              <div key={transfer.id} className="relative">
                {/* Status Badge - Top Right */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.badgeColor}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Main Card Content */}
                <div 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleCard(transfer.id)}
                >
                  {/* Main Row */}
                  <div className="flex items-center justify-between pr-20">
                    {/* Icon + Movement Info */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isIncoming ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {isIncoming ? (
                          <ArrowDownCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate text-sm">
                          {transfer.client?.name || 'Client inconnu'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {transfer.debit_company?.name} → {transfer.credit_company?.name}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className={`text-base font-bold ${
                      isIncoming ? 'text-green-600' : 'text-red-600'
                    } flex-shrink-0`}>
                      {isIncoming ? '+' : '-'}{formatAmount(transfer.net_amount || transfer.amount)}
                    </div>
                  </div>

                  {/* Date and Expand Indicator */}
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">
                      {date} à {time}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="space-y-3 pt-3">
                      {/* Transfer Details */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">De :</span>
                            <span className="font-medium text-gray-900 text-right">
                              {transfer.debit_company?.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Vers :</span>
                            <span className="font-medium text-gray-900 text-right">
                              {transfer.credit_company?.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                            <span className="text-gray-600">RIB source :</span>
                            <span className="font-mono text-xs text-gray-700">
                              {transfer.debit_company?.rib}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">RIB destination :</span>
                            <span className="font-mono text-xs text-gray-700">
                              {transfer.credit_company?.rib}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Note */}
                      {transfer.note && (
                        <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                          <span className="font-medium">Note: </span>
                          {transfer.note}
                        </div>
                      )}

                      {/* Commission Details (for outgoing transfers only) */}
                      {!isIncoming && transfer.commission_amount > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Montant net transféré:</span>
                              <span className="font-medium text-gray-900">
                                {formatAmount(transfer.net_amount || 0)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Commission ({transfer.commission_percentage}%):</span>
                              <span className="font-medium text-orange-600">
                                {formatAmount(transfer.commission_amount || 0)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="font-medium text-gray-900">Total débité:</span>
                              <span className="font-bold text-red-600">
                                {formatAmount(transfer.amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions for Pending Transfers */}
                      {onStatusUpdate && transfer.status === 'pending' && (
                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusUpdate(transfer.id, 'completed');
                            }}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Valider</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusUpdate(transfer.id, 'failed');
                            }}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Rejeter</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MovementsList;