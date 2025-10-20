import React from 'react';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'roasts',
      label: 'Roasts',
      icon: '🔥',
      activeIcon: '🔥'
    },
    {
      id: 'beans',
      label: 'Beans',
      icon: '☕',
      activeIcon: '☕'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      activeIcon: '👤'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-bg-primary border-t border-gray-200 dark:border-dark-border-primary">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
              activeTab === tab.id
                ? 'bg-indigo-50 dark:bg-dark-bg-tertiary text-indigo-600 dark:text-dark-accent-primary'
                : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-800 dark:hover:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-quaternary'
            }`}
          >
            <span className="text-lg mb-1">
              {activeTab === tab.id ? tab.activeIcon : tab.icon}
            </span>
            <span className="text-xs font-medium truncate">
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
