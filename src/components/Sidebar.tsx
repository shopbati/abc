import React from 'react';
import { Building2, Users, Activity, Percent, TrendingUp, BookUser } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeItem: string;
  onItemClick: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeItem, onItemClick }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: Activity,
    },
    {
      id: 'rib',
      label: 'Comptes',
      icon: Building2,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: BookUser,
    },
    {
      id: 'operations',
      label: 'Mouvements',
      icon: TrendingUp,
    },
    {
      id: 'commissions',
      label: 'Commissions',
      icon: Percent,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-20 lg:hidden"
          onClick={() => onItemClick('')}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm z-20 transition-colors duration-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]
        `}
      >
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onItemClick(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;