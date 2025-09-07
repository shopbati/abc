import React, { useState } from 'react';
import { ArrowRightLeft, Clock, CheckCircle, XCircle, Building2, Calendar, ArrowDownCircle, ArrowUpCircle, Percent, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import type { Transfer } from '../../lib/supabase';

interface TransferListProps {
  transfers: Transfer[];
  onStatusUpdate?: (id: string, status: 'pending' | 'completed' | 'failed') => void;
  loading?: boolean;
  error?: string | null;
}

const TransferList: React.FC<TransferListProps> = ({ transfers, onStatusUpdate, loading = false, error }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (transferId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(transferId)) {
      newExpanded.delete(transferId);
    } else {
      newExpanded.add(transferId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm font-medium">Chargement des virements...</p>
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
        <p className="text-gray-500 font-medium">Aucun virement trouvé</p>
        <p className="text-sm text-gray-400 mt-1">Les virements apparaîtront ici</p>
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
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="hidden md:block px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          </div>
          Historique des virements
        </h3>
      </div>

      {/* Transfers List */}
      <div className="divide-y divide-gray-100">
        {transfers.map((transfer) => {
          const statusConfig = getStatusConfig(transfer.status);
          const isIncoming = transfer.transfer_type === 'incoming';
          const isExpanded = expandedCards.has(transfer.id);

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
                  {/* Icon + Transfer Direction */}
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
                    
                    <div className="flex-1 min-w-0 hidden md:block">
                      <div className="font-medium text-gray-900 truncate">
                        {transfer.debit_company?.name} → {transfer.credit_company?.name}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className={`text-lg font-bold ${
                    isIncoming ? 'text-green-600' : 'text-red-600'
                  } flex-shrink-0`}>
                    {isIncoming ? '+' : '-'}{formatAmount(transfer.net_amount || transfer.amount)}
                  </div>
                </div>

                {/* Expand Indicator */}
                <div className="flex justify-center mt-2">
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <div className="space-y-3 pt-3">
                    {/* Date */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(transfer.created_at)}</span>
                    </div>

                    {/* From/To Details */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">De :</span>
                          <span className="font-medium text-gray-900">
                            {transfer.debit_company?.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Vers :</span>
                          <span className="font-medium text-gray-900">
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
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Note: </span>
                        {transfer.note}
                      </div>
                    )}

                    {/* Commission Details (for outgoing transfers only) */}
                    {!isIncoming && (
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
  );
};

export default TransferList;