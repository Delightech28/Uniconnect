import React from 'react';
import { FileText, Target, BookMarked, Map, ArrowLeft, Download, CheckCircle, Sparkles } from 'lucide-react';

const DocumentSummary = ({ data, onBack, isDarkMode }) => {
  return (
    <div className={`h-full w-full overflow-y-auto p-4 md:p-8 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
        
        <header className="flex items-center justify-between">
          <button onClick={onBack} className="p-2.5 rounded-xl border hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest">
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </button>
          <div className="flex items-center gap-3">
             <div className="bg-[#07bc0c] p-2 rounded-xl shadow-lg shadow-[#07bc0c]/20">
                <Sparkles className="w-6 h-6 text-white" />
             </div>
             <h2 className="text-2xl font-black">Document Intelligence</h2>
          </div>
          <button className="p-2.5 rounded-xl border opacity-30 cursor-not-allowed">
            <Download className="w-5 h-5" />
          </button>
        </header>

        {/* Overview Card */}
        <div className={`p-8 md:p-12 rounded-[2.5rem] border-2 shadow-xl relative overflow-hidden group ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#07bc0c]/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-[#07bc0c]/10"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#07bc0c]/10 p-2 rounded-xl text-[#07bc0c]"><FileText className="w-5 h-5" /></div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40">High-Level Overview</h3>
          </div>
          <p className={`text-xl md:text-2xl font-medium leading-relaxed italic ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            "{data.overview}"
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Key Takeaways */}
          <div className={`p-8 rounded-[2.5rem] border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#07bc0c]/10 p-2 rounded-xl text-[#07bc0c]"><Target className="w-5 h-5" /></div>
              <h3 className="text-sm font-black uppercase tracking-widest">Key Takeaways</h3>
            </div>
            <div className="space-y-4">
              {data.keyTakeaways.map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl border border-transparent hover:border-[#07bc0c]/20 hover:bg-[#07bc0c]/5 transition-all">
                  <div className="mt-1 shrink-0"><CheckCircle className="w-5 h-5 text-[#07bc0c]" /></div>
                  <p className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Study Roadmap */}
          <div className={`p-8 rounded-[2.5rem] border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#07bc0c]/10 p-2 rounded-xl text-[#07bc0c]"><Map className="w-5 h-5" /></div>
              <h3 className="text-sm font-black uppercase tracking-widest">Study Roadmap</h3>
            </div>
            <div className="space-y-6 relative">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
              {data.studyRoadmap.map((step, i) => (
                <div key={i} className="flex gap-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shrink-0 shadow-lg border-2 border-slate-800">
                    {i + 1}
                  </div>
                  <div className={`flex-1 p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <p className="font-bold text-sm leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Glossary */}
        <div className={`p-8 md:p-12 rounded-[2.5rem] border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-[#07bc0c]/10 p-2 rounded-xl text-[#07bc0c]"><BookMarked className="w-5 h-5" /></div>
            <h3 className="text-sm font-black uppercase tracking-widest">Document Glossary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.glossary.map((item, i) => (
              <div key={i} className={`p-6 rounded-[2rem] border transition-all group hover:scale-[1.02] ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-[#07bc0c] font-black text-xs uppercase tracking-widest mb-2">{item.term}</h4>
                <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentSummary;
