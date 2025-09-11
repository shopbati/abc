import React, { useState } from 'react';
import { ArrowRightLeft, Clock, CheckCircle, XCircle, Building2, Calendar, ArrowDownCircle, ArrowUpCircle, Percent, TrendingUp, TrendingDown, ChevronDown, Trash2, Edit } from 'lucide-react';
import type { Transfer } from '../../lib/supabase';

interface TransferListProps {
  transfers: Transfer[];
  onStatusUpdate?: (id: string, status: 'pending' | 'completed' | 'failed') => void;
  onUpdate?: (id: string, updates: { created_at?: string; note?: string }) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
}

const TransferList: React.FC<TransferListProps> = ({ transfers, onStatusUpdate, onUpdate, onDelete, loading = false, error }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingTransfer, setEditingTransfer] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');

  const toggleCard = (transferId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(transferId)) {
      newExpanded.delete(transferId);
    } else {
      newExpanded.add(transferId);
    }
    setExpandedCards(newExpanded);
  };

  const startEdit = (transfer: Transfer) => {
    setEditingTransfer(transfer.id);
    setEditDate(transfer.created_at.split('T')[0]);
    setEditNote(transfer.note || '');
    // Auto-expand the card when starting edit (mobile only)
    if (window.innerWidth < 1024) {
      setExpandedCards(prev => new Set([...prev, transfer.id]));
    }
  };

  const cancelEdit = () => {
    setEditingTransfer(null);
    setEditDate('');
    setEditNote('');
  };

  const saveEdit = async () => {
    if (!editingTransfer || !onUpdate) return;
    
    const updates: { created_at?: string; note?: string } = {};
    const originalTransfer = transfers.find(t => t.id === editingTransfer);
    
    if (editDate !== originalTransfer?.created_at.split('T')[0]) {
      updates.created_at = new Date(editDate).toISOString();
    }
    
    if (editNote !== (originalTransfer?.note || '')) {
      updates.note = editNote;
    }
    
    if (Object.keys(updates).length > 0) {
      const result = await onUpdate(editingTransfer, updates);
      if (result.success) {
        cancelEdit();
      }
    } else {
      cancelEdit();
    }
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

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mouvement</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {transfers.map((transfer) => {
              const statusConfig = getStatusConfig(transfer.status);
              const isIncoming = transfer.transfer_type === 'incoming';
              const StatusIcon = statusConfig.icon;
              const isEditing = editingTransfer === transfer.id;

              return (
                <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{formatDate(transfer.created_at)}</div>
                      </div>
                    )}
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
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        rows={2}
                        placeholder="Note du virement..."
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-sm text-gray-700 max-w-xs">
                        {transfer.note ? (
                          <span className="block truncate" title={transfer.note}>
                            {transfer.note}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Aucune note</span>
                        )}
                      </div>
                    )}
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
                          Commission {transfer.commission_percentage}%: {formatAmount(transfer.commission_amount)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.badgeColor}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={saveEdit}
                          className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          title="Sauvegarder"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Annuler"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-1">
                        {onUpdate && (
                          <button
                            onClick={() => startEdit(transfer)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Modifier le virement"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce virement ?')) {
                                onDelete(transfer.id);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Supprimer le virement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onStatusUpdate && transfer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onStatusUpdate(transfer.id, 'completed')}
                              className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              title="Valider"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onStatusUpdate(transfer.id, 'failed')}
                              className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              title="Rejeter"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
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
        {transfers.map((transfer) => {
          const statusConfig = getStatusConfig(transfer.status);
          const isIncoming = transfer.transfer_type === 'incoming';
          const isExpanded = expandedCards.has(transfer.id);

          return (
            <div key={transfer.id} className="relative">
              {/* Status Badge and Actions - Top Right */}
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.badgeColor}`}>
                  {statusConfig.label}
                </span>
                {onUpdate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(transfer);
                    }}
                    className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    title="Modifier le virement"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce virement ?')) {
                        onDelete(transfer.id);
                      }
                    }}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title="Supprimer le virement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Main Card Content */}
              <div 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => toggleCard(transfer.id)}
              >
                {/* Main Row - Increased right padding for action buttons */}
                <div className="flex items-center justify-between pr-32">
                  {/* Date + Icon + Transfer Direction */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Date */}
                    <div className="text-xs text-gray-500 w-16 flex-shrink-0 cursor-pointer">
                      {editingTransfer === transfer.id ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        formatDate(transfer.created_at)
                      )}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isIncoming ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {isIncoming ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    
                    {/* Transfer Direction - Desktop only */}
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

                {/* Mobile transfer info + Expand Indicator */}
                <div className="md:hidden mt-2 mb-2">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {transfer.debit_company?.name} → {transfer.credit_company?.name}
                  </div>
                </div>
                
                {/* Expand Indicator */}
                <div className="flex justify-center">
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  {/* Edit Mode Controls */}
                  {editingTransfer === transfer.id && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date du virement
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Note
                          </label>
                          <textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                            placeholder="Note du virement..."
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={saveEdit}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Sauvegarder</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Annuler</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-3">
                    {/* Date - Only show if not editing */}
                    {editingTransfer !== transfer.id && (
                      <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(transfer.created_at)}</span>
                      </div>
                    )}

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
                    {transfer.note && editingTransfer !== transfer.id && (
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