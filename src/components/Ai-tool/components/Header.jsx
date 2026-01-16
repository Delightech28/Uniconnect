import React from 'react';
import { FileText, Cpu } from 'lucide-react';

const Header = ({ activeView, onViewChange }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-center gap-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex space-x-1 border border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => onViewChange('summary')}
            className={`flex items-center px-4 py-2 font-medium text-sm transition-all rounded-md whitespace-nowrap ${
              activeView === 'summary' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Summary
          </button>
          <button 
            onClick={() => onViewChange('solver')}
            className={`flex items-center px-4 py-2 font-medium text-sm rounded-md transition-all whitespace-nowrap ${
              activeView === 'solver'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Cpu className="w-4 h-4 mr-2" />
            AI Engine
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
