import React, { useEffect, useState } from 'react';
import { Loader2, Home } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import AppHeader from '../AppHeader';
import FileUpload from './components/FileUpload';
import PDFModal from './components/PDFModal';
import Dashboard from './components/Dashboard';
import FileQuickView from './components/FileQuickView';
import ChatInterface from './components/Chat/ChatInterface';
import QuizConfig from './components/Quiz/QuizConfig';
import QuizGame from './components/Quiz/QuizGame';
import QuizReview from './components/Quiz/QuizReview';
import PodcastConfig from "./components/Podcast/PodcastConfig";
import PodcastPlayer from "./components/Podcast/PodcastPlayer";
import { analyzeTopics, generateQuiz, generatePodcastContent } from "./services/geminiService";
import Footer from '../Footer';

/**
 * App Mode Constants
 */
const APP_MODES = {
  UPLOAD: 'UPLOAD',
  DASHBOARD: 'DASHBOARD',
  CHAT: 'CHAT',
  QUIZ_PLAY: 'QUIZ_PLAY',
  QUIZ_REVIEW: 'QUIZ_REVIEW',
  PODCAST_CONFIG: 'PODCAST_CONFIG',
  PODCAST_PLAY: 'PODCAST_PLAY',
  QUIZ_CONFIG: 'QUIZ_CONFIG',
};

/**
 * Loading quotes for motivation
 */
const LOADING_QUOTES = [
  "Every expert was once a beginner.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Education is the most powerful weapon which you can use to change the world.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Your limitation—it's only your imagination.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
];

/**
 * StudyHub Main App Component
 */
const StudyHubApp = () => {
  const [mode, setMode] = useState(APP_MODES.UPLOAD);
  const [file, setFile] = useState(null);
  const [topics, setTopics] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [quizData, setQuizData] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [podcastData, setPodcastData] = useState(null);
  const [podcastSettings, setPodcastSettings] = useState(null);
  const [chatSettings, setChatSettings] = useState(null);
  const [unlockedTopics, setUnlockedTopics] = useState(new Set());
  const [currentLoadingQuote, setCurrentLoadingQuote] = useState('');

  useEffect(() => {
    if (isLoading) {
      setCurrentLoadingQuote(LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)]);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleFileUpload = async (uploadedFile) => {
    setFile(uploadedFile);
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      const analyzedTopics = await analyzeTopics(uploadedFile);
      setTopics(analyzedTopics);
      setLoadingProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        setMode(APP_MODES.DASHBOARD);
      }, 500);
    } catch (error) {
      console.error('Failed to analyze topics:', error);
      setIsLoading(false);
      alert('Failed to analyze document. Please try again.');
    }
  };

  const handleStartQuizGen = async (selectedTopics) => {
    setMode(APP_MODES.QUIZ_CONFIG);
  };

  const handleStartQuizGenerate = async (selectedTopics) => {
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      const quiz = await generateQuiz(file, selectedTopics);
      setQuizData(quiz);
      setLoadingProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        setMode(APP_MODES.QUIZ_PLAY);
      }, 500);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      setIsLoading(false);
      alert('Failed to generate quiz. Please try again.');
    }
  };

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setMode(APP_MODES.QUIZ_REVIEW);
  };

  const handleUnlockNextTopic = (score) => {
    if (score >= 70) {
      const nextTopicIdx = topics.findIndex(t => !unlockedTopics.has(t));
      if (nextTopicIdx !== -1 && nextTopicIdx + 1 < topics.length) {
        setUnlockedTopics(prev => new Set([...prev, topics[nextTopicIdx + 1]]));
      }
    }
  };

  const handleStartPodcastGen = async (settings) => {
    setPodcastSettings(settings);
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      const podcast = await generatePodcastContent(
        file,
        settings.topics,
        settings.tone,
        settings.speakers,
        settings.duration,
        settings.hostName
      );
      setPodcastData(podcast);
      setLoadingProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        setMode(APP_MODES.PODCAST_PLAY);
      }, 500);
    } catch (error) {
      console.error('Failed to generate podcast:', error);
      setIsLoading(false);
      alert('Failed to generate podcast. Please try again.');
    }
  };

  const handleChatStart = (settings) => {
    setChatSettings(settings);
    setMode(APP_MODES.CHAT);
  };

  const handleChatExit = () => {
    setChatSettings(null);
    setMode(APP_MODES.DASHBOARD);
  };

  const handlePodcastConfigBack = () => {
    setMode(APP_MODES.DASHBOARD);
  };

  const handlePodcastPlayerExit = () => {
    setPodcastData(null);
    setPodcastSettings(null);
    setMode(APP_MODES.DASHBOARD);
  };

  const handleQuizGameExit = () => {
    setMode(APP_MODES.DASHBOARD);
    setQuizData(null);
    setQuizResults(null);
  };

  const handleReset = () => {
    setFile(null);
    setTopics([]);
    setMode(APP_MODES.UPLOAD);
    setQuizData(null);
    setQuizResults(null);
    setPodcastData(null);
    setChatSettings(null);
    setPodcastSettings(null);
    setUnlockedTopics(new Set());
  };

  return (
    <div className="w-full h-screen flex flex-col transition-colors">
      
      {/* Header - Using Main App Header */}
      <AppHeader />
      
      {/* Home/Reset Button */}
      {mode !== APP_MODES.UPLOAD && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-end bg-white">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm text-secondary dark:text-white hover:bg-background-light dark:hover:bg-slate-800"
          >
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center transition-colors z-50 bg-white/80 dark:bg-secondary/80">
          <div className="text-center space-y-6">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                <circle
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="50"
                  cx="50%"
                  cy="50%"
                />
                <circle
                  className="text-[#07bc0c] transition-all duration-500"
                  strokeWidth="8"
                  strokeDasharray={314}
                  strokeDashoffset={314 * (1 - loadingProgress / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="50"
                  cx="50%"
                  cy="50%"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-secondary dark:text-white">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#07bc0c] mx-auto" />
              <p className="text-xl font-black uppercase tracking-wider text-secondary dark:text-white">
                Processing...
              </p>
              <p className="text-lg italic text-secondary dark:text-slate-400">
                "{currentLoadingQuote}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === APP_MODES.UPLOAD && (
          <FileUpload onFileUpload={handleFileUpload} />
        )}
        
        {mode === APP_MODES.DASHBOARD && file && (
          <Dashboard
            file={file}
            topics={topics}
            onStartQuiz={handleStartQuizGen}
            onStartChat={handleChatStart}
            onStartPodcast={() => setMode(APP_MODES.PODCAST_CONFIG)}
            unlockedTopics={unlockedTopics}
          />
        )}
        
        {mode === APP_MODES.CHAT && file && chatSettings && (
          <ChatInterface
            file={file}
            topics={chatSettings.topics || topics}
            tone={chatSettings.tone}
            accent={chatSettings.accent}
            onExit={handleChatExit}
          />
        )}
        
        {mode === APP_MODES.QUIZ_CONFIG && file && (
          <QuizConfig
            topics={topics}
            unlockedTopics={unlockedTopics}
            onStart={handleStartQuizGenerate}
            onBack={() => setMode(APP_MODES.DASHBOARD)}
          />
        )}
        
        {mode === APP_MODES.QUIZ_PLAY && quizData && (
          <QuizGame
            questions={quizData}
            onComplete={handleQuizComplete}
            onExit={handleQuizGameExit}
          />
        )}
        
        {mode === APP_MODES.QUIZ_REVIEW && quizData && quizResults && (
          <QuizReview
            questions={quizData}
            results={quizResults}
            topic={quizData[0]?.topic || 'Quiz'}
            file={file}
            onRetry={() => {
              setMode(APP_MODES.QUIZ_CONFIG);
              setQuizResults(null);
            }}
            onExit={() => {
              setMode(APP_MODES.DASHBOARD);
              setQuizData(null);
              setQuizResults(null);
            }}
            onUnlockNext={handleUnlockNextTopic}
          />
        )}
        
        {mode === APP_MODES.PODCAST_CONFIG && file && (
          <PodcastConfig
            topics={topics}
            onStart={handleStartPodcastGen}
            onBack={handlePodcastConfigBack}
          />
        )}
        
        {mode === APP_MODES.PODCAST_PLAY && podcastData && (
          <PodcastPlayer
            audioData={podcastData.audioData}
            transcript={podcastData.transcript}
            onExit={handlePodcastPlayerExit}
          />
        )}
      </div>
    </div>
  );
};

export default StudyHubApp;



