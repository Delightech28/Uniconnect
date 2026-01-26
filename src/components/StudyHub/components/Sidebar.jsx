import React from 'react';
import { BookOpen, MessageSquare, Radio, FileText, History, Upload } from 'lucide-react';

const Sidebar = ({ currentView, onViewChange, hasDocument, disabled, onUploadClick, isDarkMode }) => {
  const menuItems = [
    { id: 'upload', label: 'Hub', icon: FileText, requiresDoc: false },
    { id: 'analysis', label: 'Summary', icon: BookOpen, requiresDoc: true },
    { id: 'quiz', label: 'Quiz', icon: BookOpen, requiresDoc: true },
    { id: 'tutor', label: 'Tutor', icon: MessageSquare, requiresDoc: true },
    { id: 'podcast', label: 'Podcast', icon: Radio, requiresDoc: true },
    { id: 'history', label: 'History', icon: History, requiresDoc: false },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 md:hidden z-40 border-t ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex justify-between">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isDisabled = item.requiresDoc && !hasDocument;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && !disabled && onViewChange(item.id)}
                disabled={isDisabled || disabled}
                className={`flex-1 py-3 px-2 flex flex-col items-center gap-1 transition-all ${
                  isActive
                    ? 'text-[#07bc0c]'
                    : isDisabled || disabled
                    ? `${isDarkMode ? 'text-slate-600' : 'text-slate-400'} cursor-not-allowed opacity-50`
                    : isDarkMode ? 'text-slate-400 hover:text-[#07bc0c]' : 'text-slate-600 hover:text-[#07bc0c]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Left Sidebar */}
      <div className={`hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center justify-between py-8 border-r ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex flex-col gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = item.requiresDoc && !hasDocument;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && !disabled && onViewChange(item.id)}
                disabled={isDisabled || disabled}
                title={item.label}
                className={`p-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#07bc0c]/10 text-[#07bc0c]'
                    : isDisabled || disabled
                    ? `${isDarkMode ? 'text-slate-600' : 'text-slate-400'} cursor-not-allowed opacity-50`
                    : isDarkMode ? 'text-slate-400 hover:bg-slate-900 hover:text-[#07bc0c]' : 'text-slate-600 hover:bg-slate-100 hover:text-[#07bc0c]'
                }`}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>

        <button
          onClick={onUploadClick}
          className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-[#07bc0c] text-slate-900 hover:bg-[#07bc0c]/90' : 'bg-[#07bc0c] text-white hover:bg-[#07bc0c]/90'}`}
          title="Upload Document"
        >
          <Upload className="w-6 h-6" />
        </button>
      </div>
    </>
  );
};

export default Sidebar;
