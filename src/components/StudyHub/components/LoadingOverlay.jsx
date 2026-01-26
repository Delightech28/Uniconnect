import React from 'react';
import { X } from 'lucide-react';
import '../studyhub.css';

const LoadingOverlay = ({ progress = 0, stage = 'Processing...', onCancel = null, isDarkMode = false }) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/50' : 'bg-black/30'} backdrop-blur-sm`}>
      <div className={`rounded-3xl p-12 max-w-sm w-full mx-4 flex flex-col items-center gap-8 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="relative">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <svg className="w-12 h-12 text-[#07bc0c] animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {stage}
          </p>
          <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {Math.round(progress)}%
          </p>
        </div>

        <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div 
            className="h-full bg-[#07bc0c] transition-all duration-300 animate-progress"
            style={{ width: `${progress}%` }}
          />
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
