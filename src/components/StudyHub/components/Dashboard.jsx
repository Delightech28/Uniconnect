import React, { useState } from 'react';
import { BookOpen, MessageSquare, Radio, Lock } from 'lucide-react';
import Footer from './Footer';

/**
 * Dashboard component showing mode selection
 */
const Dashboard = ({ 
  topics, 
  onStartQuiz, 
  onStartChat, 
  onStartPodcast, 
  isDarkMode,
  unlockedTopics
}) => {
  const [selectedTopics, setSelectedTopics] = useState(new Set(topics.slice(0, 1)));

  const toggleTopic = (topic) => {
    const newSelected = new Set(selectedTopics);
    if (newSelected.has(topic)) {
      newSelected.delete(topic);
    } else {
      newSelected.add(topic);
    }
    setSelectedTopics(newSelected);
  };

  const modes = [
    {
      id: 'quiz',
      title: '🧠 Quiz Yourself',
      description: 'Test your knowledge with AI-generated quizzes',
      icon: BookOpen,
      color: 'from-blue-600 to-blue-500',
      onClick: () => onStartQuiz(Array.from(selectedTopics)),
    },
    {
      id: 'chat',
      title: '💬 Chat Session',
      description: 'Ask questions about any topic',
      icon: MessageSquare,
      color: 'from-purple-600 to-purple-500',
      onClick: () => onStartChat({ topics: Array.from(selectedTopics) }),
    },
    {
      id: 'podcast',
      title: '🎙️ Podcast',
      description: 'Listen to an audio summary',
      icon: Radio,
      color: 'from-[#07bc0c] to-green-500',
      onClick: onStartPodcast,
    },
  ];

  return (
    <div className="h-full flex flex-col transition-colors bg-white dark:bg-secondary">
      {/* Topics Selector */}
      <div className="border-b transition-colors p-6 bg-white dark:bg-secondary border-slate-100 dark:border-slate-700">
        <h2 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          Select Topics for This Session
        </h2>
        <div className="flex flex-wrap gap-2">
          {topics.map(topic => {
            const isLocked = unlockedTopics && !unlockedTopics.has(topic) && topics.indexOf(topic) > 0;
            return (
              <button
                key={topic}
                onClick={() => !isLocked && toggleTopic(topic)}
                disabled={isLocked}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                  isLocked
                    ? isDarkMode
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : selectedTopics.has(topic)
                      ? isDarkMode
                        ? 'bg-[#07bc0c] text-slate-900'
                        : 'bg-[#07bc0c] text-white'
                      : isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isLocked && <Lock className="w-3 h-3 inline mr-1" />}
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modes Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={mode.onClick}
                disabled={selectedTopics.size === 0}
                className={`rounded-3xl p-8 text-left border-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${mode.color} text-white`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {mode.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



