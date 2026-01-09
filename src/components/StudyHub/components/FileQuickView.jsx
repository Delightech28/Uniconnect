import React from 'react';
import { FileText, X } from 'lucide-react';

/**
 * FileQuickView component
 */
const FileQuickView = ({ file, isOpen, onClose, isDarkMode }) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        {/* Header */}
        <div className={`border-b transition-colors p-6 flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-[#07bc0c]/20 text-[#07bc0c]' : 'bg-[#07bc0c]/10 text-[#07bc0c]'}`}>
              <FileText className="w-6 h-6" />
            </div>
            <h2 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{file.name}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="font-bold">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="font-bold">Type:</span> {file.type}
          </p>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="font-bold">Uploaded:</span> {new Date().toLocaleString()}
          </p>
        </div>

        {/* Footer */}
        <div className={`border-t transition-colors p-6 flex gap-3 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileQuickView;
