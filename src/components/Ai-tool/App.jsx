import React, { useState, useEffect, useRef } from 'react';
import AppHeader from '../AppHeader';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import Footer from '../Footer';
import { generateContentStream } from './services/geminiService';
import { ResultMode } from './types';
import { useTheme } from '../../hooks/useTheme';
import { HelpCircle, Brain, Layers, AlertCircle, BookOpen, FileText, Zap, ScanLine, Loader2, Cpu } from 'lucide-react';
import './styles.css';

const App = () => {
  const { darkMode: globalDarkMode } = useTheme();
  const [darkMode, setDarkMode] = useState(globalDarkMode);
  const [activeView, setActiveView] = useState('solver');
  const [courseFiles, setCourseFiles] = useState([]);
  const [questionFiles, setQuestionFiles] = useState([]);
  const [summaryFiles, setSummaryFiles] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Initializing AI...');
  
  const loadingMessages = [
    "Scanning documents for key terms...",
    "Extracting important names and dates...",
    "Deep-analyzing core concepts...",
    "Formatting for high recall...",
    "Applying bold emphasis to key points...",
    "Synthesizing your academic guide...",
    "Exhaustively mapping all topics...",
    "Creating concise flash-recall points...",
    "Polishing deep academic solutions...",
    "Finalizing document structure..."
  ];

  const [processingState, setProcessingState] = useState({
    isLoading: false,
    loadingMode: null,
    error: null,
    result: null
  });

  const abortControllerRef = useRef(null);

  // Initialize local dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setDarkMode(JSON.parse(savedTheme));
  }, []);

  // Sync with global dark mode changes
  useEffect(() => {
    setDarkMode(globalDarkMode);
  }, [globalDarkMode]);

  const handleDarkModeToggle = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', JSON.stringify(newTheme));
    document.documentElement.classList.toggle('dark', newTheme);
  };

  useEffect(() => {
    let interval;
    if (processingState.isLoading && progress < 90) {
      interval = setInterval(() => {
        const randomMsg = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        setStatusMsg(randomMsg);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [processingState.isLoading, progress]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    if (processingState.isLoading && !processingState.result) {
      resetApp();
    } else {
      setProcessingState(prev => ({ ...prev, isLoading: false, loadingMode: null }));
    }
  };

  const handleProcess = async (mode) => {
    if (mode === ResultMode.SUMMARY && summaryFiles.length === 0) {
      setProcessingState(prev => ({ ...prev, error: "Please upload a document to summarize." }));
      return;
    }
    if (mode === ResultMode.SOLVE && (courseFiles.length === 0 || questionFiles.length === 0)) {
      setProcessingState(prev => ({ ...prev, error: "Please upload both course material and past questions." }));
      return;
    }
    if (mode === ResultMode.REVIEW && courseFiles.length === 0) {
      setProcessingState(prev => ({ ...prev, error: "Please upload course material to create FlashDoc." }));
      return;
    }

    setProcessingState({ isLoading: true, loadingMode: mode, error: null, result: null });
    setIsStreaming(true);
    setProgress(5);
    setStatusMsg('Preparing your analysis engine...');

    // Initialize abort controller for this specific request
    abortControllerRef.current = new AbortController();

    try {
      const filesA = mode === ResultMode.SUMMARY ? summaryFiles : courseFiles;
      const filesB = (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) ? [] : questionFiles;

      const stream = generateContentStream(filesA, filesB, mode, abortControllerRef.current.signal);
      
      let fullText = '';
      let hasStarted = false;
      let chunkCount = 0;

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        fullText += chunk;
        chunkCount++;

        if (!hasStarted) {
          hasStarted = true;
          setProgress(30);
          setProcessingState(prev => ({
            ...prev,
            isLoading: false,
            loadingMode: null, 
            result: { text: fullText, mode: mode, timestamp: Date.now() }
          }));
        } else {
          const newProgress = Math.min(99, 30 + Math.floor(chunkCount / 5));
          setProgress(newProgress);
          setProcessingState(prev => {
            if (!prev.result) return prev; 
            return { ...prev, result: { ...prev.result, text: fullText } };
          });
        }
      }
      setProgress(100);
      setStatusMsg('✨ Knowledge Synthesized Successfully!');
      setTimeout(() => setIsStreaming(false), 1000);

      // Log request to Firebase for analytics
      try {
        const userId = auth.currentUser?.uid || 'anonymous';
        const fileNames = mode === ResultMode.SUMMARY 
          ? summaryFiles.map(f => f.name) 
          : [...courseFiles.map(f => f.name), ...questionFiles.map(f => f.name)];
        
        await logUnidocRequest(db, {
          userId,
          mode,
          fileNames,
          resultLength: fullText.length,
          timestamp: new Date().toISOString()
        });
      } catch (logErr) {
        console.warn('Could not log request:', logErr);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Error generating content:', err);
      setIsStreaming(false);
      setProcessingState({
        isLoading: false,
        loadingMode: null,
        error: err.message || "An unexpected error occurred. Please verify your API key and try again.",
        result: null
      });
    } finally {
      abortControllerRef.current = null;
    }
  };

  const resetApp = () => {
    setProcessingState({ isLoading: false, loadingMode: null, error: null, result: null });
    setIsStreaming(false);
    setProgress(0);
  };

  const getSourceFileName = () => {
    if (processingState.result?.mode === ResultMode.SUMMARY) return summaryFiles[0]?.name || "Summary";
    if (processingState.result?.mode === ResultMode.REVIEW) return courseFiles[0]?.name || "FlashDoc";
    return questionFiles[0]?.name || "AIEngine_Output";
  };

  return (
    <div className={`aitool-container ${darkMode ? 'dark' : ''}`}>
    <style>{`
      .aitool-container header {
        background-color: #c2ebc2 !important;
      }
      .aitool-container.dark header {
        background-color: rgba(15, 23, 42, 0.9) !important;
      }
    `}</style>
    <div className="min-h-screen text-gray-900 dark:text-gray-100 pb-4 md:pb-8 font-sans">
      <AppHeader darkMode={darkMode} toggleDarkMode={handleDarkModeToggle} />
      <Header 
        activeView={activeView} 
        onViewChange={(view) => { setActiveView(view); resetApp(); }} 
      />

      <main className="max-w-6xl mx-auto px-4 mt-4 md:mt-10">
        
        {!processingState.result && !processingState.isLoading && (
          <div className="text-center mb-4 md:mb-10 animate-fade-in">
            <h1 className="text-xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 md:mb-4">
              {activeView === 'summary' ? '🎓 AI Document Summarizer' : '⚙️ UniSpace AI Engine'}
            </h1>
            <p className="max-w-2xl mx-auto text-xs md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Professional-grade analysis with **bolded** key terms and ==highlighted== critical information for maximum learning efficiency.
            </p>
          </div>
        )}

        {processingState.isLoading && (
          <div className="fixed inset-0 bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <div className="relative w-32 h-32 md:w-56 md:h-56 flex items-center justify-center mb-6">
              <div className="absolute z-10 bg-primary/10 p-3 md:p-5 rounded-full animate-pulse-glow">
                <Brain className="w-8 h-8 md:w-14 md:h-14 text-primary" />
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-gray-800" />
                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="301.59" strokeDashoffset={301.59 * (1 - progress / 100)} className="text-primary transition-all duration-500" />
              </svg>
            </div>
            <h3 className="text-base md:text-xl font-bold mb-2 text-gray-900 dark:text-white text-center px-4">{statusMsg}</h3>
            <div className="w-48 md:w-72 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
               <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="mt-2 text-primary text-xs md:text-sm font-bold">{progress}% Complete</span>
            <button
              onClick={handleCancel}
              className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {processingState.error && (
          <div className="mb-4 mx-auto max-w-3xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-400 text-xs md:text-sm">{processingState.error}</p>
          </div>
        )}

        {processingState.result ? (
          <>
            {isStreaming && (
              <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-primary/20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{statusMsg}</span>
                </div>
                <div className="text-xs font-bold text-primary flex-shrink-0 ml-2">{progress}%</div>
              </div>
            )}
            <ResultDisplay 
              result={processingState.result} 
              onReset={resetApp} 
              sourceFileName={getSourceFileName()}
              isStreaming={isStreaming}
            />
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
            {activeView === 'summary' ? (
              <div className="lg:col-span-3">
                <FileUpload
                  title="📄 Upload Your Document"
                  subtitle="Drag and drop or select a PDF, TXT, or image file"
                  files={summaryFiles}
                  onFilesAdded={(files) => setSummaryFiles([...summaryFiles, ...files])}
                  onFileRemove={(id) => setSummaryFiles(summaryFiles.filter(f => f.id !== id))}
                  icon={<FileText className="w-16 h-16" />}
                />
                <button
                  onClick={() => handleProcess(ResultMode.SUMMARY)}
                  disabled={summaryFiles.length === 0}
                  className="w-full mt-6 py-4 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg disabled:opacity-50 transition-all shadow-lg text-sm md:text-base"
                >
                  🚀 Generate Deep Summary
                </button>
              </div>
            ) : (
              <>
                <FileUpload
                  title="📚 Course Material"
                  subtitle="Add your course notes or textbook chapters"
                  files={courseFiles}
                  onFilesAdded={(files) => setCourseFiles([...courseFiles, ...files])}
                  onFileRemove={(id) => setCourseFiles(courseFiles.filter(f => f.id !== id))}
                  icon={<BookOpen className="w-16 h-16" />}
                />
                <FileUpload
                  title="❓ Past Questions"
                  subtitle="Add questions to solve based on material"
                  files={questionFiles}
                  onFilesAdded={(files) => setQuestionFiles([...questionFiles, ...files])}
                  onFileRemove={(id) => setQuestionFiles(questionFiles.filter(f => f.id !== id))}
                  icon={<HelpCircle className="w-16 h-16" />}
                />
                <FileUpload
                  title="📝 FlashDoc Material"
                  subtitle="Create flash cards from course material"
                  files={courseFiles}
                  onFilesAdded={(files) => setCourseFiles([...courseFiles, ...files])}
                  onFileRemove={(id) => setCourseFiles(courseFiles.filter(f => f.id !== id))}
                  icon={<Layers className="w-16 h-16" />}
                />
                <button
                  onClick={() => handleProcess(ResultMode.SOLVE)}
                  disabled={courseFiles.length === 0 || questionFiles.length === 0}
                  className="lg:col-span-3 py-4 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg disabled:opacity-50 transition-all shadow-lg text-sm md:text-base"
                >
                  🔍 Solve Questions
                </button>
                <button
                  onClick={() => handleProcess(ResultMode.REVIEW)}
                  disabled={courseFiles.length === 0}
                  className="lg:col-span-3 py-4 px-6 bg-primary/50 hover:bg-primary/60 text-white font-bold rounded-lg disabled:opacity-50 transition-all shadow-lg text-sm md:text-base"
                >
                  📋 Generate FlashDoc
                </button>
              </>
            )}
          </div>
        )}
      </main>
      <Footer darkMode={darkMode} />
    </div>
    </div>
  );
};

export default App;




