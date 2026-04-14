import React, { useState, useEffect, useRef } from "react";
import { Send, Menu, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useChatHistory } from "../hooks/useChatHistory";
import ChatHistorySidebar from "./ChatHistorySidebar";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

/**
 * GeneralChatPage - A standalone AI chat interface with conversation history
 */
const GeneralChatPage = () => {
  // Chat history management
  const {
    sessions,
    loading: historyLoading,
    currentUser,
    createSession,
    updateSession,
    deleteSession,
    getSession,
    updateSessionSettings,
  } = useChatHistory();

  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      if (!historyLoading && currentUser) {
        if (sessions.length > 0) {
          // Load most recent session
          const mostRecent = sessions[0];
          setCurrentSessionId(mostRecent.id);
          setMessages(mostRecent.messages || []);
        } else {
          // Create new session
          const sessionId = await createSession(
            "Chat " + new Date().toLocaleTimeString(),
          );
          if (sessionId) {
            setCurrentSessionId(sessionId);
            setMessages([]);
          }
        }
      }
    };

    initializeChat();
  }, [historyLoading, currentUser, sessions.length]);

  // Load session when currentSessionId changes
  useEffect(() => {
    if (currentSessionId) {
      const session = getSession(currentSessionId);
      if (session) {
        setMessages(session.messages || []);
      }
    }
  }, [currentSessionId, sessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle creating new chat
  const handleNewChat = async () => {
    const sessionId = await createSession(
      "Chat " + new Date().toLocaleTimeString(),
    );
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setMessages([]);
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending || !currentSessionId) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      text: inputValue,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsSending(true);

    try {
      // Update Firestore with user message
      await updateSession(currentSessionId, newMessages);

      // Call the chatMessage function
      const chatMessageFunction = httpsCallable(functions, "chatMessage");
      const response = await chatMessageFunction({
        prompt: inputValue,
        systemInstruction:
          "You are a helpful AI assistant for students. Be concise and helpful.",
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: response.data?.text || "Sorry, I could not process your request.",
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      // Save AI response to Firestore
      await updateSession(currentSessionId, finalMessages);

      // Auto-save chat title if it's still the default
      const session = getSession(currentSessionId);
      if (session && session.title.startsWith("Chat ")) {
        // Extract first few words from user message for title
        const title =
          userMessage.text.substring(0, 50) +
          (userMessage.text.length > 50 ? "..." : "");
        await updateSession(currentSessionId, finalMessages, title);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");

      // Remove user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Determine if it's dark mode
  useEffect(() => {
    const darkModePreference = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    setDarkMode(darkModePreference);
  }, []);

  if (!currentUser && !historyLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          darkMode ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div className="text-center max-w-md">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[#07bc0c]" />
          <h1 className="text-2xl font-bold mb-2">Sign in to Chat</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You need to be signed in to use the chat feature
          </p>
          <button
            onClick={() => (window.location.href = "/uniconnect-login")}
            className="px-6 py-3 bg-[#07bc0c] text-white font-bold rounded-lg hover:bg-[#07bc0c]/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${darkMode ? "bg-slate-950" : "bg-white"}`}
    >
      {/* Sidebar */}
      <ChatHistorySidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onCreateNew={handleNewChat}
        onDeleteSession={deleteSession}
        isDarkMode={darkMode}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`border-b px-4 py-3 flex items-center justify-between shrink-0 ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1
              className={`text-lg font-bold flex items-center gap-2 ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              <div className="w-8 h-8 bg-[#07bc0c] rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              AI Chat Assistant
            </h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
            }`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${
            darkMode ? "bg-slate-950" : "bg-slate-50"
          }`}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h2
                  className={`text-xl font-bold mb-2 ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Start a Conversation
                </h2>
                <p
                  className={`${
                    darkMode ? "text-slate-500" : "text-slate-500"
                  }`}
                >
                  Ask me anything or request help with a topic
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-[#07bc0c] text-white rounded-br-none"
                      : darkMode
                        ? "bg-slate-800 text-slate-100 rounded-bl-none"
                        : "bg-white text-slate-900 border border-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p
                    className={`text-xs mt-2 opacity-60 ${
                      message.role === "user" ? "text-white/70" : ""
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex justify-start">
              <div
                className={`p-4 rounded-lg rounded-bl-none ${
                  darkMode ? "bg-slate-800" : "bg-white border border-slate-200"
                }`}
              >
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-[#07bc0c] rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  />
                  <div
                    className="w-2 h-2 bg-[#07bc0c] rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-2 h-2 bg-[#07bc0c] rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          className={`border-t p-4 ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={isSending}
              className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#07bc0c] transition-colors ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-500"
              }`}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !inputValue.trim()}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                inputValue.trim() && !isSending
                  ? "bg-[#07bc0c] text-white hover:bg-[#07bc0c]/90"
                  : "bg-slate-200 text-slate-400 dark:bg-slate-800 cursor-not-allowed"
              }`}
            >
              {isSending ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralChatPage;
