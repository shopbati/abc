import React from 'react';
import { Building2, CreditCard, TrendingUp, Calendar, Percent, Hash } from 'lucide-react';

interface CommissionData {
  company: {
    id: string;
    name: string;
    rib: string;
    address: string | null;
    siret: string | null;
    created_at: string;
    updated_at: string;
  };
  totalCommissions: number;
  transferCount: number;
  lastTransferDate: string | null;
}

interface CommissionsListProps {
  commissionsData: CommissionData[];
  loading?: boolean;
  error?: string | null;
}

const CommissionsList: React.FC<CommissionsListProps> = ({ 
  commissionsData,
  loading = false, 
  error 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateTotals = () => {
    const totalCommissions = commissionsData.reduce((sum, item) => sum + item.totalCommissions, 0);
    const totalTransfers = commissionsData.reduce((sum, item) => sum + item.transferCount, 0);
    return { totalCommissions, totalTransfers };
  };

  const { totalCommissions, totalTransfers } = calculateTotals();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm font-medium">Chargement des commissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Percent className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-red-600 font-medium mb-2">Erreur lors du chargement</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (commissionsData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Percent className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">Aucune commission trouvée</p>
        <p className="text-sm text-gray-400 mt-1">Les commissions apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Total Commissions</h3>
              <p className="text-sm text-green-700">Tous comptes</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(totalCommissions)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Comptes Actifs</h3>
              <p className="text-sm text-blue-700">Avec commissions</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {commissionsData.length}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Hash className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Total Transferts</h3>
              <p className="text-sm text-purple-700">Avec commissions</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {totalTransfers}
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Percent className="h-4 w-4 text-green-600" />
            </div>
            Relevé des Commissions par Compte
            <span className="ml-3 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {commissionsData.length} compte{commissionsData.length > 1 ? 's' : ''}
            </span>
          </h3>
        </div>

        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RIB
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Commissions
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nb. Transferts
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernier Transfert
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {commissionsData.map((item, index) => (
                <tr key={item.company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                        index === 0 ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <Building2 className={`h-5 w-5 ${
                          index === 0 ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-gray-900 flex items-center">
                          {item.company.name}
                          {index === 0 && (
                            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              Top Compte
                            </span>
                          )}
                        </div>
                        {item.company.address && (
                          <div className="text-sm text-gray-500">
                            {item.company.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-mono text-gray-900">
                        {item.company.rib}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(item.totalCommissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {item.transferCount} transfert{item.transferCount > 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {formatDate(item.lastTransferDate)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Show only on mobile */}
        <div className="lg:hidden divide-y divide-gray-100">
          {commissionsData.map((item, index) => (
            <div key={item.company.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                    index === 0 ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <Building2 className={`h-6 w-6 ${
                      index === 0 ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {item.company.name}
                      </h3>
                      {index === 0 && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Top
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-mono">
                      {item.company.rib}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Commissions:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(item.totalCommissions)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transferts:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {item.transferCount}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dernier:</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(item.lastTransferDate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommissionsList;