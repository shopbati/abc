import React, { useState, useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useAllTransfers } from '../hooks/useAllTransfers';
import { useCommissions } from '../hooks/useCommissions';
import { useCompanies } from '../hooks/useCompanies';
import MonthlyActivityChart from './dashboard/MonthlyActivityChart';
import TransferStatusPieChart from './dashboard/TransferStatusPieChart';
import { 
  Users, 
  Building2, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Wallet,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  User,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [startDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  const { clients } = useClients();
  const { companies } = useCompanies();
  const { transfers } = useAllTransfers(startDate, endDate);
  const { commissionsData } = useCommissions(startDate, endDate);
  const { transfers: allTransfers } = useAllTransfers(); // For recent movements without date filter

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const completedTransfers = transfers.filter(t => t.status === 'completed');
    
    const totalReceived = completedTransfers
      .filter(t => t.transfer_type === 'incoming')
      .reduce((sum, t) => sum + (t.net_amount || t.amount || 0), 0);
    
    const totalSent = completedTransfers
      .filter(t => t.transfer_type === 'outgoing')
      .reduce((sum, t) => sum + (t.net_amount || 0), 0);
    
    const totalCommissions = completedTransfers
      .filter(t => t.transfer_type === 'outgoing')
      .reduce((sum, t) => sum + (t.commission_amount || 0), 0);
    
    const netBalance = totalReceived - totalSent - totalCommissions;

    return {
      totalClients: clients.length,
      totalCompanies: companies.length,
      totalMovements: transfers.length,
      totalReceived,
      totalSent,
      totalCommissions,
      netBalance
    };
  }, [clients, companies, transfers]);

  // Prepare data for monthly activity chart
  const monthlyActivityData = useMemo(() => {
    const monthlyData = new Map();
    
    transfers.forEach(transfer => {
      const date = new Date(transfer.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          label: monthLabel,
          incoming: 0,
          outgoing: 0,
          commissions: 0
        });
      }
      
      const monthStats = monthlyData.get(monthKey);
      
      if (transfer.status === 'completed') {
        if (transfer.transfer_type === 'incoming') {
          monthStats.incoming += transfer.net_amount || transfer.amount || 0;
        } else if (transfer.transfer_type === 'outgoing') {
          monthStats.outgoing += transfer.net_amount || 0;
          monthStats.commissions += transfer.commission_amount || 0;
        }
      }
    });

    const sortedEntries = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    return {
      labels: sortedEntries.map(([, data]) => data.label),
      incoming: sortedEntries.map(([, data]) => data.incoming),
      outgoing: sortedEntries.map(([, data]) => data.outgoing),
      commissions: sortedEntries.map(([, data]) => data.commissions)
    };
  }, [transfers]);

  // Prepare data for status pie chart
  const statusData = useMemo(() => {
    const statusCounts = transfers.reduce((acc, transfer) => {
      acc[transfer.status] = (acc[transfer.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      completed: statusCounts.completed || 0,
      pending: statusCounts.pending || 0,
      failed: statusCounts.failed || 0
    };
  }, [transfers]);

  // Get recent movements (last 10)
  const recentMovements = useMemo(() => {
    return allTransfers.slice(0, 10);
  }, [allTransfers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Terminé' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Échoué' };
      default:
        return { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', label: 'En attente' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de Bord</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vue d'ensemble de vos activités financières
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4 inline mr-1 text-gray-400 dark:text-gray-500" />
          Période: {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Clients</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">Total</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {summaryStats.totalClients}
          </div>
        </div>

        {/* Total Companies */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/50 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">Comptes</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">RIB actifs</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {summaryStats.totalCompanies}
          </div>
        </div>

        {/* Total Movements */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Mouvements</h3>
              <p className="text-sm text-gray-700 dark:text-gray-400">Ce mois</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-400">
            {summaryStats.totalMovements}
          </div>
        </div>

        {/* Net Balance */}
        <div className={`${summaryStats.netBalance >= 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800' : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-200 dark:border-red-800'} border rounded-2xl p-6 shadow-sm`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-12 h-12 ${summaryStats.netBalance >= 0 ? 'bg-green-100 dark:bg-green-800/50' : 'bg-red-100 dark:bg-red-800/50'} rounded-xl flex items-center justify-center`}>
              <Wallet className={`h-6 w-6 ${summaryStats.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${summaryStats.netBalance >= 0 ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'}`}>
                Solde Net
              </h3>
              <p className={`text-sm ${summaryStats.netBalance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                Ce mois
              </p>
            </div>
          </div>
          <div className={`text-2xl font-bold ${summaryStats.netBalance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {formatCurrency(summaryStats.netBalance)}
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-800/50 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-300">Total Reçu</h3>
              <p className="text-sm text-green-700 dark:text-green-400">Virements entrants</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-700 dark:text-green-400">
            +{formatCurrency(summaryStats.totalReceived)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-800/50 rounded-xl flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-300">Total Envoyé</h3>
              <p className="text-sm text-red-700 dark:text-red-400">Virements sortants</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-700 dark:text-red-400">
            -{formatCurrency(summaryStats.totalSent)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800/50 rounded-xl flex items-center justify-center">
              <Percent className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-300">Commissions</h3>
              <p className="text-sm text-orange-700 dark:text-orange-400">Total perçu</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
            +{formatCurrency(summaryStats.totalCommissions)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyActivityChart data={monthlyActivityData} />
        <TransferStatusPieChart data={statusData} />
      </div>

      {/* Recent Movements */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mr-3">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Mouvements Récents
            <span className="ml-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
              Derniers 10
            </span>
          </h3>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mouvement</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {recentMovements.map((transfer) => {
                const isIncoming = transfer.transfer_type === 'incoming';
                const statusConfig = getStatusConfig(transfer.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(transfer.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
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
                        <div className="font-medium text-gray-900 dark:text-gray-300">
                          {transfer.debit_company?.name} → {transfer.credit_company?.name}
                        </div>
                        {transfer.note && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-48">
                            {transfer.note}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold ${
                        isIncoming ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isIncoming ? '+' : '-'}{formatCurrency(transfer.net_amount || transfer.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} dark:${statusConfig.bg.replace('bg-', 'bg-').replace('-50', '-900/50').replace('-100', '-800/50')} ${statusConfig.color} dark:${statusConfig.color.replace('-600', '-400').replace('-700', '-300')}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {recentMovements.map((transfer) => {
            const isIncoming = transfer.transfer_type === 'incoming';
            const statusConfig = getStatusConfig(transfer.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={transfer.id} className="p-4 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isIncoming ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {isIncoming ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-300 text-sm">
                        {transfer.client?.name || 'Client inconnu'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(transfer.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className={`text-base font-bold ${
                    isIncoming ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isIncoming ? '+' : '-'}{formatCurrency(transfer.net_amount || transfer.amount)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                    {transfer.debit_company?.name} → {transfer.credit_company?.name}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} dark:${statusConfig.bg.replace('bg-', 'bg-').replace('-50', '-900/50').replace('-100', '-800/50')} ${statusConfig.color} dark:${statusConfig.color.replace('-600', '-400').replace('-700', '-300')} ml-2`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;