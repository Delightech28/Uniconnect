import React, { useEffect, useRef, useState } from "react";
import { Send, Volume2, VolumeX, Plus, Loader2, Copy, Check, AlertCircle, MessageCircle, Settings, ChevronDown, FileText } from "lucide-react";
import { initializeChatWithContext, speakText } from "../../services/geminiService";
import PDFModal from "../PDFModal";

/**
 * FormattedText component for rendering rich text
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
        return <strong key={i} className={`font-bold ${isDarkMode ? 'text-[#07bc0c]' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    
    elements.push(
      <p key={index} className={`mb-2 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        {children}
      </p>
    );
  });
  
  return <div className="text-content">{elements}</div>;
};

/**
 * ChatInterface component
 */
const ChatInterface = ({ 
  file, 
  topics, 
  tone = 'FRIENDLY', 
  accent = 'en-US', 
  isDarkMode,
  onExit
}) => {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedRefPage, setSelectedRefPage] = useState(undefined);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize chat on component mount
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
      const chatSession = await initializeChatWithContext(file, topics, tone);
      setSession(chatSession);
      
      // Load initial welcome message
      const initialMsg = {
        id: Date.now(),
        sender: 'ai',
        text: `Hi! I'm your study companion. I've reviewed the document based on your selected topics: ${topics.join(', ')}. Feel free to ask me any questions!`,
        timestamp: new Date(),
      };
      setMessages([initialMsg]);
      
      // Save session
      const newSessionId = `session-${Date.now()}`;
      setCurrentSessionId(newSessionId);
      const newSessions = [...sessions, { id: newSessionId, title: topics.join(' + '), timestamp: new Date() }];
      setSessions(newSessions);
      localStorage.setItem('chat-sessions', JSON.stringify(newSessions));
      localStorage.setItem(`chat-${newSessionId}`, JSON.stringify([initialMsg]));
    } catch (err) {
      setError(err.message || 'Failed to initialize chat');
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
      const response = await session.sendMessage(input);
      
      const responseText = response.response?.text ? response.response.text() : '';
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseText,
        timestamp: new Date(),
        citations: response.citations || [],
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save to localStorage
      const updatedMessages = [...messages, userMessage, aiMessage];
      localStorage.setItem(`chat-${currentSessionId}`, JSON.stringify(updatedMessages));
    } catch (err) {
      console.error('Error sending message:', err);
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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadSession = (sessionId) => {
    const saved = localStorage.getItem(`chat-${sessionId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
      setCurrentSessionId(sessionId);
    }
  };

  const startNewSession = () => {
    initChat();
  };

  const openReference = (page) => {
    setSelectedRefPage(page);
    setIsViewerOpen(true);
  };

  return (
    <div className="flex flex-col h-full transition-colors bg-white dark:bg-secondary">
      <PDFModal 
        file={file}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        pageNumber={selectedRefPage}
        isDarkMode={isDarkMode}
      />

      {/* Header */}
      <div className="border-b transition-colors p-4 flex items-center justify-between bg-white dark:bg-secondary border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#07bc0c]/20 text-[#07bc0c]' : 'bg-[#07bc0c]/10 text-[#07bc0c]'}`}>
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Chat Session</h2>
            <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{topics.join(', ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onExit}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            ← Back
          </button>
        </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`border-b transition-colors p-4 space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <button
            onClick={startNewSession}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${isDarkMode ? 'bg-[#07bc0c]/20 text-[#07bc0c] hover:bg-[#07bc0c]/30' : 'bg-[#07bc0c]/10 text-[#07bc0c] hover:bg-[#07bc0c]/20'}`}
          >
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>
      )}
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        {error && (
          <div className={`p-4 rounded-lg flex items-start gap-3 border ${isDarkMode ? 'bg-red-900/10 border-red-900/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl p-4 ${
                msg.sender === 'user'
                  ? isDarkMode ? 'bg-[#07bc0c]/20 text-white' : 'bg-[#07bc0c]/20 text-slate-900'
                  : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-900 border border-slate-100'
              }`}
            >
              <div className="mb-2">
                <FormattedText text={msg.text} isDarkMode={isDarkMode} />
              </div>

              {msg.citations && msg.citations.length > 0 && (
                <div className={`mt-3 pt-3 border-t space-y-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  {msg.citations.map((cite, i) => (
                    <button
                      key={i}
                      onClick={() => openReference(cite.page)}
                      className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                      <FileText className="w-3 h-3" /> Source: Page {cite.page}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                  className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                >
                  {copied === msg.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleSpeak(msg.text)}
                    disabled={isSpeaking}
                    className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700 disabled:opacity-50' : 'hover:bg-slate-100 disabled:opacity-50'}`}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-2xl p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
              <Loader2 className="w-5 h-5 animate-spin text-[#07bc0c]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

    {/* Input */}
    <div className={`border-t transition-colors p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask something..."
          className={`flex-1 px-4 py-3 rounded-lg border resize-none font-medium outline-none transition-all ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-[#07bc0c]'
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#07bc0c]'
          }`}
          rows="3"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={`px-4 rounded-lg font-bold transition-all flex items-center gap-2 shrink-0 ${
            isLoading || !input.trim()
              ? isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'
              : isDarkMode ? 'bg-[#07bc0c] text-slate-900 hover:bg-[#07bc0c]/90' : 'bg-[#07bc0c] text-white hover:bg-[#07bc0c]/90'
          }`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
    </div>
  );
};

export default ChatInterface;



