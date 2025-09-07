import React from 'react';

interface MainContentProps {
  activeSection: string;
}

const MainContent: React.FC<MainContentProps> = ({ activeSection }) => {
  // Lazy load RibManager only when needed
  const RibManager = React.lazy(() => import('./rib/RibManager'));
  const ClientsManager = React.lazy(() => import('./clients/ClientsManager'));
  const MovementsManager = React.lazy(() => import('./movements/MovementsManager'));
  const CommissionsManager = React.lazy(() => import('./commissions/CommissionsManager'));
  const Dashboard = React.lazy(() => import('./Dashboard'));

  const getSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <Dashboard />
          </React.Suspense>
        );
      case 'rib':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <RibManager />
          </React.Suspense>
        );
      case 'clients':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <ClientsManager />
          </React.Suspense>
        );
      case 'operations':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <MovementsManager />
          </React.Suspense>
        );
      case 'commissions':
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <CommissionsManager />
          </React.Suspense>
        );
      default:
        return (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <Dashboard />
          </React.Suspense>
        );
    }
  };

  return (
    <main className="flex-1 p-4 lg:p-6 lg:pl-4 bg-gray-50 dark:bg-gray-900 overflow-auto overflow-x-hidden max-w-full min-w-0 transition-colors duration-200">
      {getSectionContent()}
    </main>
  );
};

export default MainContent;