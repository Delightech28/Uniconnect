import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import AppHeader from '../AppHeader';
import Footer from '../Footer';
import Sidebar from './components/Sidebar';
import LoadingOverlay from './components/LoadingOverlay';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import PodcastSection from './components/PodcastSection';
import QuizSection from './components/QuizSection';
import TutorSection from './components/TutorSection';
import DocumentSummary from './components/Summary/DocumentSummary';
import { analyzeDocument, generateTopics } from './services/geminiService';
import ComingSoonOverlay from '../ComingSoonOverlay';

const StudyHubApp = ({ darkMode, toggleDarkMode }) => {
  // Coming soon overlay logic - initialize deadline and check immediately
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    // Initialize/check deadline in localStorage
    const storageKey = 'comingSoonDeadline';
    let deadline = localStorage.getItem(storageKey);

    if (!deadline) {
      // First time - set deadline to 5 days from now
      deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).getTime();
      localStorage.setItem(storageKey, deadline);
    }

    const now = Date.now();
    const deadlineTime = parseInt(deadline, 10);

    if (now >= deadlineTime) {
      // Countdown expired - remove overlay
      setShowOverlay(false);
      localStorage.removeItem(storageKey);
    } else {
      // Still within countdown period - show overlay
      setShowOverlay(true);
    }
  }, []);

  // If feature is still in coming soon period, show overlay
  if (showOverlay) {
    return <ComingSoonOverlay featureName="StudyHub" onClose={() => setShowOverlay(false)} />;
  }

  const [currentView, setCurrentView] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [studyDoc, setStudyDoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [topics, setTopics] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleFileUpload = async (file) => {
    if (cooldown > 0) {
      alert(`Please wait ${cooldown} seconds before uploading another document.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setLoading(true);
    setLoadingMessage('Analyzing document...');
    abortRef.current = new AbortController();

    try {
      const text = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      });

      setLoadingMessage('Extracting topics...');
      const extractedTopics = await generateTopics(text, abortRef.current.signal);
      
      const docData = {
        name: file.name,
        text: text,
        uploadedAt: new Date().toISOString(),
        id: Date.now().toString()
      };

      setStudyDoc(docData);
      setTopics(extractedTopics);
      setHistory([...history, docData]);
      setCurrentView('analysis');

      setCooldown(30);
    } catch (error) {
      if (error.name !== 'AbortError') {
        alert('Error processing document: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    setCurrentView('upload');
  };

  const handleQuizComplete = (topicId, score) => {
    const updatedTopics = topics.map(t => 
      t.id === topicId ? { ...t, score, passed: score >= 70 } : t
    );
    setTopics(updatedTopics);
  };

  const renderView = () => {
    if (!studyDoc && currentView !== 'upload' && currentView !== 'history') {
      return <FileUpload onFileUpload={handleFileUpload} isDarkMode={darkMode} />;
    }

    switch (currentView) {
      case 'upload':
        return <FileUpload onFileUpload={handleFileUpload} isDarkMode={darkMode} progress={0} />;
      
      case 'analysis':
        return studyDoc && summaryData ? (
          <DocumentSummary data={summaryData} onBack={() => setCurrentView('upload')} isDarkMode={darkMode} />
        ) : (
          <Dashboard 
            topics={topics}
            onStartQuiz={() => setCurrentView('quiz')}
            onStartChat={() => setCurrentView('tutor')}
            onStartPodcast={() => setCurrentView('podcast')}
            isDarkMode={darkMode}
          />
        );
      
      case 'quiz':
        return studyDoc ? (
          <QuizSection 
            docText={studyDoc.text}
            topics={topics}
            onQuizComplete={handleQuizComplete}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            isDarkMode={darkMode}
          />
        ) : null;
      
      case 'tutor':
        return studyDoc ? (
          <TutorSection 
            docText={studyDoc.text}
            topics={topics}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            isPaused={cooldown > 0}
            isDarkMode={darkMode}
          />
        ) : null;
      
      case 'podcast':
        return studyDoc ? (
          <PodcastSection 
            docText={studyDoc.text}
            topics={topics}
            setLoading={setLoading}
            setLoadingMessage={setLoadingMessage}
            isPaused={cooldown > 0}
            isDarkMode={darkMode}
          />
        ) : null;
      
      case 'history':
        return (
          <div className={`max-w-4xl mx-auto p-8 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <h2 className="text-3xl font-black mb-8">Document History</h2>
            {history.length === 0 ? (
              <p className="text-center text-gray-500">No documents uploaded yet</p>
            ) : (
              <div className="space-y-4">
                {history.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setStudyDoc(doc);
                      setCurrentView('analysis');
                    }}
                    className={`p-6 rounded-2xl cursor-pointer transition-all ${
                      darkMode 
                        ? 'bg-slate-900 hover:bg-slate-800 border border-slate-800' 
                        : 'bg-white hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{doc.name}</h3>
                        <p className="text-sm text-gray-500">{new Date(doc.uploadedAt).toLocaleString()}</p>
                      </div>
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return <FileUpload onFileUpload={handleFileUpload} isDarkMode={darkMode} />;
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="flex-1 flex">
        <Sidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          hasDocument={!!studyDoc}
          disabled={cooldown > 0}
          onUploadClick={handleUploadClick}
          isDarkMode={darkMode}
        />
        
        <main className="flex-1 md:ml-20 mb-20 md:mb-0">
          {loading && (
            <LoadingOverlay 
              progress={50}
              stage={loadingMessage}
              onCancel={handleCancel}
              isDarkMode={darkMode}
            />
          )}
          {renderView()}
        </main>
      </div>
      
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default StudyHubApp;




