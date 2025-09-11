import React from 'react';
import { ArrowLeft, User, Mail, Phone, Wallet, TrendingUp, TrendingDown, Calendar, Filter, X, ArrowRightLeft, ChevronDown, Percent, Printer } from 'lucide-react';
import { useTransfers } from '../../hooks/useTransfers';
import type { Client } from '../../lib/supabase';
import TransferForm from './TransferForm';
import TransferList from './TransferList';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack }) => {
  const { transfers, loading, error, addTransfer, updateTransferStatus, updateTransfer, deleteTransfer } = useTransfers(client.id);
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

  const handleDeleteTransfer = async (transferId: string) => {
    await deleteTransfer(transferId);
  };

  const handleUpdateTransfer = async (transferId: string, updates: { created_at?: string; note?: string }) => {
    return await updateTransfer(transferId, updates);
  };

  // Helper functions for print report
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handlePrint = () => {
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const printContent = generatePrintContent();
    
    // Write content to iframe
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(printContent);
      iframe.contentWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          
          // Clean up after printing
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }
      }, 500);
    }
  };

  const generatePrintContent = () => {
    // Calculate totals within the function to ensure they're available
    const completedTransfers = filteredTransfers.filter(t => t.status === 'completed');
    
    const calculatedTotalIncoming = completedTransfers
      .filter(t => t.transfer_type === 'incoming')
      .reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0);
    
    const calculatedTotalOutgoing = completedTransfers
      .filter(t => t.transfer_type === 'outgoing')
      .reduce((sum, t) => sum + (t.net_amount || 0), 0);
    
    const calculatedTotalCommissions = completedTransfers
      .filter(t => t.transfer_type === 'outgoing')
      .reduce((sum, t) => sum + (t.commission_amount || 0), 0);
    
    const calculatedBalance = calculatedTotalIncoming - calculatedTotalOutgoing - calculatedTotalCommissions;

    // Calculate movement counts
    const incomingCount = filteredTransfers.filter(t => t.transfer_type === 'incoming').length;
    const outgoingCount = filteredTransfers.filter(t => t.transfer_type === 'outgoing').length;
    
    const dateRangeText = formatDateRange();
    const periodText = typeof dateRangeText === 'object' ? dateRangeText.desktop : dateRangeText;
    
    const transferRows = filteredTransfers.map(transfer => {
      const isIncoming = transfer.transfer_type === 'incoming';
      const statusLabel = transfer.status === 'completed' ? 'Terminé' : 
                         transfer.status === 'failed' ? 'Échoué' : 'En attente';
      const rowBgColor = isIncoming ? 'background-color: #dcfce7;' : 'background-color: #fecaca;';
      
      return `
        <tr style="${rowBgColor}">
          <td>${formatDate(transfer.created_at)}</td>
          <td>${isIncoming ? 'Entrant' : 'Sortant'}</td>
          <td>${transfer.debit_company?.name || ''}</td>
          <td>${transfer.credit_company?.name || ''}</td>
          <td>${transfer.note || '-'}</td>
          <td style="text-align: right;">${isIncoming ? '+' : '-'}${formatAmount(transfer.net_amount || transfer.amount)}</td>
          <td style="text-align: right;">${!isIncoming && transfer.commission_amount > 0 ? formatAmount(transfer.commission_amount) : '-'}</td>
          <td style="text-align: center;">${statusLabel}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relevé de mouvements - ${client.name}</title>
          <style>
            @media print {
              @page {
                margin: 15px;
                size: A4;
              }
              
              body {
                font-family: Arial, sans-serif;
                font-size: 11px;
                line-height: 1.3;
                color: #000;
                margin: 0;
                padding: 0;
              }
              
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
              }
              
              .header h1 {
                font-size: 18px;
                font-weight: bold;
                margin: 0 0 5px 0;
              }
              
              .header h2 {
                font-size: 18px;
                font-weight: normal;
                margin: 0;
                color: #666;
              }
              
              .period-info {
                text-align: center;
                margin-bottom: 15px;
                font-weight: bold;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              
              th, td {
                border: 1px solid #ccc;
                padding: 4px 6px;
                vertical-align: top;
              }
              
              th {
                background-color: #f0f0f0;
                font-weight: bold;
                text-align: center;
                font-size: 10px;
              }
              
              td {
                font-size: 10px;
              }
              
              .summary {
                border: 2px solid #000;
                padding: 10px;
                margin-top: 20px;
              }
              
              .summary h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                text-align: center;
              }
              
              .summary-table {
                border: none;
                margin-bottom: 0;
              }
              
              .summary-table td {
                border: none;
                padding: 3px 0;
                font-weight: bold;
              }
              
              .summary-table .label {
                width: 60%;
              }
              
              .summary-table .amount {
                width: 40%;
                text-align: right;
              }
              
              .positive { color: #059669; }
              .negative { color: #DC2626; }
              .neutral { color: #000; }
              
              .footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                text-align: center;
                font-size: 9px;
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RELEVÉ DE MOUVEMENTS</h1>
            <h2 style="font-size: 18px;">${client.name}</h2>
          </div>
          
          <div class="period-info">
            Période: ${periodText}
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Date</th>
                <th style="width: 10%;">Type</th>
                <th style="width: 18%;">Compte Débiteur</th>
                <th style="width: 18%;">Compte Créditeur</th>
                <th style="width: 20%;">Note</th>
                <th style="width: 12%;">Montant</th>
                <th style="width: 10%;">Commission</th>
                <th style="width: 10%;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${transferRows}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>RÉSUMÉ DE LA PÉRIODE</h3>
            <table class="summary-table">
              <tr>
                <td class="label">Total Reçu (Virements entrants):</td>
                <td class="amount positive">+${formatAmount(calculatedTotalIncoming)}</td>
              </tr>
              <tr>
                <td class="label">Total Envoyé (Virements sortants):</td>
                <td class="amount negative">-${formatAmount(calculatedTotalOutgoing)}</td>
              </tr>
              <tr>
                <td class="label">Total Commissions:</td>
                <td class="amount negative">-${formatAmount(calculatedTotalCommissions)}</td>
              </tr>
              <tr style="border-top: 2px solid #000;">
                <td class="label" style="font-size: 12px; padding-top: 8px;">SOLDE NET DE LA PÉRIODE:</td>
                <td class="amount ${calculatedBalance >= 0 ? 'positive' : 'negative'}" style="font-size: 12px; padding-top: 8px;">
                  ${formatAmount(calculatedBalance)}
                </td>
              </tr>
              <tr>
                <td class="label">Nombre total de mouvements:</td>
                <td class="amount neutral">${filteredTransfers.length}</td>
              </tr>
              <tr>
                <td class="label">Nombre de virements entrants:</td>
                <td class="amount neutral">${incomingCount}</td>
              </tr>
              <tr>
                <td class="label">Nombre de virements sortants:</td>
                <td class="amount neutral">${outgoingCount}</td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            ABC Gestion - Relevé généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </div>
        </body>
      </html>
    `;
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
        
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          title="Imprimer le relevé"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Imprimer</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Total Reçu</h3>
              <p className="text-sm text-green-700">Virements entrants</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-700">
            +{new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            }).format(totalIncoming)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Total Envoyé</h3>
              <p className="text-sm text-red-700">Virements sortants</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-700">
            -{new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            }).format(totalOutgoing)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Percent className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Commissions</h3>
              <p className="text-sm text-orange-700">Total perçu</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-700">
            -{new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            }).format(totalCommissions)}
          </div>
        </div>

        <div className={`${balance >= 0 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'} border rounded-2xl p-6 shadow-sm`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-12 h-12 ${balance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-xl flex items-center justify-center`}>
              <Wallet className={`h-6 w-6 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                Solde Net
              </h3>
              <p className={`text-sm ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                Période filtrée
              </p>
            </div>
          </div>
          <div className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            }).format(balance)}
          </div>
        </div>
      </div>

      {/* Main Content Grid - Balance and Transfer Management Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 max-w-full min-w-0">
        {/* Balance Card with integrated filter */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900">Solde disponible</h3>
              <p className="hidden md:block text-xs text-gray-600 break-words">
                {(startDate || endDate) ? (typeof dateRangeText === 'object' ? dateRangeText.desktop : dateRangeText) : 'Montant total'}
              </p>
              <p className="md:hidden text-xs text-gray-600 break-words">
                {(startDate || endDate) ? (typeof dateRangeText === 'object' ? dateRangeText.mobile : dateRangeText) : 'Total'}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-center">
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  minimumFractionDigits: 2
                }).format(balance)}
              </div>
              <div className="text-sm text-gray-600 mt-1 font-medium">
                {balance >= 0 ? 'Solde positif' : 'Solde négatif'}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center text-green-600 min-w-0">
                  <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="truncate font-medium">Reçu</span>
                </div>
                <span className="font-bold text-green-600 ml-2">
                  +{new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(totalIncoming)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center text-red-600 min-w-0">
                  <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  </div>
                  <span className="truncate font-medium">Envoyé</span>
                </div>
                <span className="font-bold text-red-600 ml-2">
                  -{new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(totalOutgoing)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-orange-600 min-w-0">
                  <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                <div className="flex items-center">
                  <div className="text-amber-600 text-xs font-medium">
                    ⚠️ Solde faible - Moins de 1 000€ restant
                  </div>
                </div>
              </div>
            )}
            
            {balance <= 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
                <div className="flex items-center">
                  <div className="text-red-600 text-xs font-medium">
                    ❌ Solde insuffisant pour nouveaux virements
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Date Filter - Integrated */}
          <div className="hidden xl:block border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">Filtrer par période</h4>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                {typeof dateRangeText === 'object' ? dateRangeText.desktop : dateRangeText}
              </p>
              
              {/* Date Controls */}
              <div className="space-y-2">
                <div className="flex flex-col space-y-2">
                  {/* Date Start Input */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
                    />
                  </div>

                  {/* Date End Input */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-1">
                  <button
                    onClick={setCurrentMonth}
                    className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                  >
                    Ce mois
                  </button>
                  <button
                    onClick={clearDateFilter}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Mobile Date Filter - Only show on mobile */}
      <div className="xl:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 max-w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-900">Période</h4>
          </div>
          <div className="text-xs text-gray-600">
            {filteredTransfers.length} virement{filteredTransfers.length > 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
            />
          </div>
        </div>
        
        <div className="flex space-x-1 mt-2">
          <button
            onClick={setCurrentMonth}
            className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
          >
            Ce mois
          </button>
          <button
            onClick={clearDateFilter}
            className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
          >
            <X className="h-3 w-3 mr-1" />
            Effacer
          </button>
        </div>
      </div>
        
        {/* Transfer Management Section */}
        <div className="xl:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-full min-w-0 overflow-hidden">
          {/* Mobile Header with Collapse */}
          <button
            onClick={toggleTransferSection}
            className="xl:hidden w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors min-w-0"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900">Gérer les virements</h3>
                <p className="text-xs text-gray-600 break-words">
                  Créer nouveaux virements
                </p>
              </div>
            </div>
            <ChevronDown className={`h-6 w-6 text-gray-400 transition-transform flex-shrink-0 ${showTransferSection ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Desktop Header - Always Visible */}
          <div className="hidden xl:block p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Gérer les virements</h3>
                <p className="text-sm text-gray-600">Créer nouveaux virements</p>
              </div>
            </div>
          </div>

          {/* Transfer Form - Show on desktop always, on mobile when expanded */}
          {(showTransferSection || window.innerWidth >= 1280) && (
            <div className="p-6 border-b border-gray-100">
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
      </div>

      {/* Transfer History - Always Visible */}
      <div className="max-w-full min-w-0 overflow-hidden">
        <TransferList
          transfers={filteredTransfers}
          onStatusUpdate={handleStatusUpdate}
          onUpdate={handleUpdateTransfer}
          onDelete={handleDeleteTransfer}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default ClientDetail;