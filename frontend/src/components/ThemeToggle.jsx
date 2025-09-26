import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-accent-primary ${
        isDark 
          ? 'bg-dark-accent-primary focus:ring-offset-dark-bg-secondary' 
          : 'bg-gray-200 focus:ring-offset-white'
      } ${className}`}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isDark ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      {/* Icons */}
      <span className={`absolute left-1 top-1/2 -translate-y-1/2 text-xs ${
        isDark ? 'text-dark-text-primary' : 'text-gray-400'
      }`}>
        🌙
      </span>
      <span className={`absolute right-1 top-1/2 -translate-y-1/2 text-xs ${
        !isDark ? 'text-white' : 'text-gray-400'
      }`}>
        ☀️
      </span>
    </button>
  );
};

export default ThemeToggle;
