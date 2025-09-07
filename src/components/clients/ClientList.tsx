import React, { useState } from 'react';
import { User, Search, Plus, Edit, CreditCard, TrendingUp, TrendingDown, Wallet, Percent, Filter, ChevronDown, Calendar, X } from 'lucide-react';

interface ClientWithBalance {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  totalReceived: number;
  totalSent: number;
  totalCommissions: number;
  currentBalance: number;
}

interface ClientListProps {
  clients: ClientWithBalance[];
  startDate: string;
  endDate: string;
  onDateRangeChange: {
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
  };
  onClientClick: (client: ClientWithBalance) => void;
  onEdit: (client: ClientWithBalance) => void;
  onAddNew: () => void;
  loading?: boolean;
  error?: string | null;
}

const ClientList: React.FC<ClientListProps> = ({
  clients,
  startDate,
  endDate,
  onDateRangeChange,
  onClientClick,
  onEdit,
  onAddNew,
  loading = false,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterSection, setShowFilterSection] = useState(false);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate totals across all clients
  const calculateTotals = () => {
    const totalReceived = clients.reduce((sum, client) => sum + client.totalReceived, 0);
    const totalSent = clients.reduce((sum, client) => sum + client.totalSent, 0);
    const totalCommissions = clients.reduce((sum, client) => sum + client.totalCommissions, 0);
    const totalBalance = totalReceived - totalSent - totalCommissions;
    
    return { totalReceived, totalSent, totalCommissions, totalBalance };
  };

  const { totalReceived, totalSent, totalCommissions, totalBalance } = calculateTotals();

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
    
    onDateRangeChange.setStartDate(firstDay);
    onDateRangeChange.setEndDate(lastDayFormatted);
  };

  const clearDateFilter = () => {
    onDateRangeChange.setStartDate('');
    onDateRangeChange.setEndDate('');
  };

  const toggleFilterSection = () => {
    setShowFilterSection(!showFilterSection);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-500">Chargement des clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
        <div className="text-red-500 mb-3">⚠️</div>
        <p className="text-red-600 mb-2">Erreur lors du chargement</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
        <button
          onClick={onAddNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </button>
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
                {clients.length} client{clients.length > 1 ? 's' : ''} trouvé{clients.length > 1 ? 's' : ''}
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
                      onChange={(e) => onDateRangeChange.setStartDate(e.target.value)}
                      className="px-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs w-full min-w-0 max-w-full"
                    />
                  </div>

                  {/* Date End Input */}
                  <div className="flex flex-col w-20 sm:w-24 max-w-full min-w-0">
                    <label className="text-xs text-gray-500 mb-1 truncate">Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => onDateRangeChange.setEndDate(e.target.value)}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total reçu</h3>
              <p className="text-sm text-gray-500">Tous clients</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">
            +{formatCurrency(totalReceived)}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total envoyé</h3>
              <p className="text-sm text-gray-500">Tous clients</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            -{formatCurrency(totalSent)}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Percent className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Commissions</h3>
              <p className="text-sm text-gray-500">Total perçu</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            +{formatCurrency(totalCommissions)}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-12 h-12 ${totalBalance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-xl flex items-center justify-center`}>
              <Wallet className={`h-6 w-6 ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Solde actuel</h3>
              <p className="text-sm text-gray-500">Total général</p>
            </div>
          </div>
          <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(totalBalance)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Rechercher un client..."
          />
        </div>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block">
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {clients.length === 0 ? "Aucun client trouvé" : "Aucun résultat pour cette recherche"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-end">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        Total reçu
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-end">
                        <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                        Total envoyé
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-end">
                        <Percent className="h-4 w-4 mr-1 text-orange-500" />
                        Commissions
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-end">
                        <Wallet className="h-4 w-4 mr-1 text-blue-500" />
                        Solde actuel
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onClientClick(client)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-base font-semibold text-gray-900">
                              {client.name}
                            </div>
                            {client.email && (
                              <div className="text-sm text-gray-500">
                                {client.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-semibold text-green-600">
                          +{formatCurrency(client.totalReceived)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-semibold text-red-600">
                          -{formatCurrency(client.totalSent)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-semibold text-orange-600">
                          -{formatCurrency(client.totalCommissions)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-base font-bold ${
                          client.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(client.currentBalance)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClientClick(client);
                            }}
                            className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                            title="Gérer les virements"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Virements
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(client);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View - Show only on mobile */}
      <div className="lg:hidden">
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {clients.length === 0 ? "Aucun client trouvé" : "Aucun résultat pour cette recherche"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onClientClick(client)}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {client.name}
                        </h3>
                        {client.email && (
                          <p className="text-sm text-gray-600 truncate">
                            {client.email}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {client.phone && (
                      <p className="text-sm text-gray-500 mb-3">
                        📞 {client.phone}
                      </p>
                    )}

                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Solde:</span>
                        <span className={`font-semibold ${
                          client.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(client.currentBalance)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClientClick(client);
                        }}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Gérer les virements
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(client);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientList;