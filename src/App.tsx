import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './components/auth/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import LoginPage from './components/auth/LoginPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

const AuthenticatedApp: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleMenuItemClick = (item: string) => {
    setActiveSection(item);
    // Close sidebar on mobile after selecting an item
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleNavigateToDashboard = () => {
    setActiveSection('dashboard');
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 max-w-full overflow-x-hidden transition-colors duration-200">
      <Navbar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        onNavigateToDashboard={handleNavigateToDashboard}
      />
      
      <div className="flex pt-16 max-w-full min-w-0 overflow-x-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          activeItem={activeSection}
          onItemClick={handleMenuItemClick}
        />
        
        <div className="flex-1 max-w-full min-w-0 overflow-x-hidden">
          <MainContent activeSection={activeSection} />
        </div>
      </div>
    </div>
  );
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;