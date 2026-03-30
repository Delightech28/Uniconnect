import React, { useEffect } from 'react';
import { Calendar, Trophy, Target, TrendingUp, Trash2, FileText, RotateCcw } from 'lucide-react';

const HistoryPage = ({ history, documents = [], onLoadDocument, isDarkMode }) => {
  console.log('[HistoryPage] Render with history:', history, 'documents:', documents, 'isDarkMode:', isDarkMode);
  console.log('[HistoryPage] History length:', Array.isArray(history) ? history.length : 'not array');
  
  // Debug: Check localStorage directly
  useEffect(() => {
    const raw = localStorage.getItem('studyHub_quizHistory');
    console.log('[HistoryPage] useEffect - Raw localStorage:', raw);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        console.log('[HistoryPage] useEffect - Parsed localStorage:', parsed, 'Length:', parsed.length);
      } catch (e) {
        console.error('[HistoryPage] useEffect - Error parsing:', e);
      }
    }
  }, [history]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all quiz history? This cannot be undone.')) {
      localStorage.removeItem('studyHub_quizHistory');
      window.location.reload();
    }
  };

  const getPassedCount = () => history.filter(h => h.passed).length;
  const getAverageScore = () => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, h) => sum + (h.score || 0), 0);
    return Math.round(total / history.length);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-white'} py-12 px-4 sm:px-6 lg:px-8 mb-24`}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className={`text-4xl sm:text-5xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Quiz History
          </h1>
          <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track your quiz performance and progress over time
          </p>
        </div>

        {/* Stats Cards */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-50 border border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Quizzes
                  </p>
                  <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {history.length}
                  </p>
                </div>
                <Target className="text-unispace" size={32} />
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-50 border border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Passed
                  </p>
                  <p className={`text-3xl font-black text-green-500`}>
                    {getPassedCount()}
                  </p>
                </div>
                <Trophy className="text-green-500" size={32} />
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-50 border border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Avg Score
                  </p>
                  <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {getAverageScore()}%
                  </p>
                </div>
                <TrendingUp className="text-unispace" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Documents Section */}
        {documents.length > 0 && (
          <div className="mb-12">
            <h2 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2">
                <FileText size={28} className="text-unispace" />
                Your Documents
              </div>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    isDarkMode
                      ? 'bg-zinc-900 border-zinc-800 hover:border-unispace/50'
                      : 'bg-gray-50 border-gray-200 hover:border-unispace/50'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <FileText size={24} className="text-unispace flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {doc.name}
                      </h3>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {doc.text.substring(0, 100)}...
                  </p>
                  <button
                    onClick={() => onLoadDocument(doc.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-unispace hover:bg-unispace/90 text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    <RotateCcw size={16} />
                    Reuse Document
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History List or Empty State */}
        {history.length === 0 && documents.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-50 border border-gray-100'}`}>
            <Target size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No History Yet
            </h3>
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Upload a document and complete a quiz to see your history here
            </p>
          </div>
        ) : history.length > 0 ? (
          <div>
            <h2 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Quiz History
            </h2>
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border transition-all ${
                    isDarkMode
                      ? 'bg-zinc-900 border-zinc-800 hover:border-unispace/30'
                      : 'bg-white border-gray-200 hover:border-unispace/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.topic || 'Unknown Topic'}
                      </h4>
                      {item.passed && <span className="inline-block px-3 py-1 bg-green-500/10 text-green-600 text-xs font-bold rounded-full">PASSED</span>}
                      {!item.passed && <span className="inline-block px-3 py-1 bg-red-500/10 text-red-600 text-xs font-bold rounded-full">RETRY</span>}
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      {item.docName || 'Unknown Document'}
                    </p>
                    {item.completedAt && (
                      <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <Calendar size={14} />
                        {new Date(item.completedAt).toLocaleDateString()} at{' '}
                        {new Date(item.completedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <p className={`text-3xl font-black ${
                        item.score >= 70 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {item.score}%
                      </p>
                      <p className={`text-xs font-bold uppercase tracking-widest ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Score
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleClearHistory}
                className={`w-full mt-8 py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isDarkMode
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                <Trash2 size={18} />
                Clear All History
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HistoryPage;
