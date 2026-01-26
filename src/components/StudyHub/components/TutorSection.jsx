import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Volume2, VolumeX, Plus, ChevronDown, FileText } from 'lucide-react';
import { initializeChatWithContext, speakText } from '../services/geminiService';

/**
 * FormattedText component for rendering rich text with markdown support
 */
const FormattedText = ({ text, isDarkMode }) => {
  const elements = [];
  const lines = text.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const children = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong 
            key={i} 
            className={`font-bold ${isDarkMode ? 'text-[#07bc0c]' : 'text-slate-900'}`}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
    
    elements.push(
      <p 
        key={index} 
        className={`mb-2 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
      >
        {children}
      </p>
    );
  });
  
  return <div className="text-content">{elements}</div>;
};

/**
 * TutorSection component for chat-based tutoring
 */
const TutorSection = ({ 
  docText = '', 
  topics = [], 
  isDarkMode = false,
  onExit,
  setLoadingMessage,
  setLoading
}) => {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);
  const [accent, setAccent] = useState('en-US');
  const [tone, setTone] = useState('FRIENDLY');
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    initChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = async () => {
    try {
      setError(null);
      if (setLoadingMessage) setLoadingMessage('Initializing tutor session...');
      if (setLoading) setLoading(true);

      const chatSession = await initializeChatWithContext(docText, topics, tone);
      setSession(chatSession);
      
      const initialMsg = {
        id: Date.now(),
        sender: 'ai',
        text: `Hello! I'm your AI tutor. I've reviewed the material on ${topics.join(', ')}. Ask me anything about these topics!`,
        timestamp: new Date(),
      };
      setMessages([initialMsg]);
      
      const newSessionId = `session-${Date.now()}`;
      setCurrentSessionId(newSessionId);
      const newSessions = [...sessions, { 
        id: newSessionId, 
        title: topics.join(' + ') || 'Chat Session', 
        timestamp: new Date() 
      }];
      setSessions(newSessions);
      localStorage.setItem('tutor-sessions', JSON.stringify(newSessions));
      localStorage.setItem(`tutor-${newSessionId}`, JSON.stringify([initialMsg]));
    } catch (err) {
      setError(err.message || 'Failed to initialize tutor session');
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session || isLoading) return;
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      setError(null);
      const response = await session.sendMessage({
        text: input,
      });
      
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.response.text(),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      const updatedMessages = [...messages, userMessage, aiMessage];
      localStorage.setItem(`tutor-${currentSessionId}`, JSON.stringify(updatedMessages));
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text) => {
    try {
      setIsSpeaking(true);
      setError(null);
      await speakText(text, accent);
    } catch (err) {
      setError('Failed to speak message');
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewSession = async () => {
    setMessages([]);
    await initChat();
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b px-4 py-4 flex items-center justify-between shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-[#07bc0c]/20' : 'bg-[#07bc0c]/10'}`}>
            <MessageCircle className="w-5 h-5 text-[#07bc0c]" />
          </div>
          <div>
            <h2 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              AI Tutor
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {topics.join(', ') || 'Chat Session'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewSession}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            title="New Session"
          >
            <Plus className="w-5 h-5 text-[#07bc0c]" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            title="Settings"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`border-b p-4 ${isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-semibold block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Accent
              </label>
              <select
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              >
                <option value="en-US">US English</option>
                <option value="en-GB">UK English</option>
                <option value="en-AU">Australian</option>
              </select>
            </div>
            <div>
              <label className={`text-sm font-semibold block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              >
                <option value="FRIENDLY">Friendly</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="INFORMAL">Informal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`border-b px-4 py-3 ${isDarkMode ? 'border-red-900 bg-red-900/20 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
              <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                No messages yet. Start chatting!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  msg.sender === 'user'
                    ? isDarkMode
                      ? 'bg-[#07bc0c] text-white'
                      : 'bg-[#07bc0c] text-white'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-100'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <FormattedText text={msg.text} isDarkMode={isDarkMode} />
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-opacity-20">
                    <button
                      onClick={() => handleSpeak(msg.text)}
                      disabled={isSpeaking}
                      className="text-xs hover:opacity-80 transition-opacity"
                    >
                      {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <span className="text-xs opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div className="flex gap-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-slate-400' : 'bg-slate-600'}`}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-slate-400' : 'bg-slate-600'}`}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-slate-400' : 'bg-slate-600'}`}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t p-4 shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your tutor..."
            rows="2"
            maxLength="1000"
            disabled={isLoading}
            className={`flex-1 p-3 rounded-lg border resize-none ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
            } focus:outline-none focus:ring-2 focus:ring-[#07bc0c]`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !input.trim() || isLoading
                ? isDarkMode
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-[#07bc0c] text-white hover:bg-[#06a80a]'
            }`}
            title="Send (Enter or Shift+Enter for new line)"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorSection;
