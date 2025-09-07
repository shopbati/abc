import React, { useState } from 'react';
import { useAllTransfers } from '../../hooks/useAllTransfers';
import MovementsList from './MovementsList';
import { Filter, ChevronDown, Calendar, X } from 'lucide-react';

const MovementsManager: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  const { transfers, loading, error, updateTransferStatus } = useAllTransfers(startDate, endDate);
  const [showFilterSection, setShowFilterSection] = useState(false);

  const handleStatusUpdate = async (transferId: string, status: 'pending' | 'completed' | 'failed') => {
    await updateTransferStatus(transferId, status);
  };

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
    
    setStartDate(firstDay);
    setEndDate(lastDayFormatted);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const toggleFilterSection = () => {
    setShowFilterSection(!showFilterSection);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Mouvements</h2>
        <div className="text-sm text-gray-500">
          Vue d'ensemble de tous les mouvements bancaires
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
                {transfers.length} mouvement{transfers.length > 1 ? 's' : ''} trouvé{transfers.length > 1 ? 's' : ''}
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

      {/* Date Range Summary - Only show when filter is applied */}
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

      {/* Movements List */}
      <MovementsList
        transfers={transfers}
        onStatusUpdate={handleStatusUpdate}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default MovementsManager;