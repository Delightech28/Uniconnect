import React, { useState } from "react";
import { Trash2, Plus, Search, X } from "lucide-react";
import toast from "react-hot-toast";

/**
 * ChatHistorySidebar - Displays chat history and allows navigation between conversations
 */
const ChatHistorySidebar = ({
  sessions = [],
  currentSessionId,
  onSelectSession,
  onCreateNew,
  onDeleteSession,
  isDarkMode,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const filteredSessions = sessions.filter((session) =>
    (session.title || "Untitled")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    setDeletingId(sessionId);

    const confirm = window.confirm(
      "Are you sure you want to delete this chat? This action cannot be undone.",
    );

    if (confirm) {
      await onDeleteSession(sessionId);
    }
    setDeletingId(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return (
        "Today " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 w-72 z-50 transition-transform duration-300 flex flex-col border-r shadow-2xl transform md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between shrink-0 ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <h3 className="font-black text-xs uppercase tracking-widest text-[#07bc0c]">
            Chat History
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors md:hidden ${
              isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full p-4 rounded-2xl bg-[#07bc0c] text-white font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
              isDarkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className={`bg-transparent text-sm w-full focus:outline-none ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 opacity-60">
                No chats yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Start a new conversation to get started
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
              <div className="text-3xl mb-3">🔍</div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 opacity-60">
                No matches found
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${
                  currentSessionId === session.id
                    ? "border-[#07bc0c] bg-[#07bc0c]/5 text-[#07bc0c] shadow-md"
                    : isDarkMode
                      ? "border-transparent hover:bg-slate-800/50 text-slate-300"
                      : "border-transparent hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {session.title || "Untitled Chat"}
                    </div>
                    <div className="text-[10px] opacity-60 mt-1">
                      {formatDate(session.lastModified || session.createdAt)}
                    </div>
                    {session.messages && session.messages.length > 0 && (
                      <div className="text-[10px] opacity-50 mt-1 truncate">
                        {session.messages.length} message
                        {session.messages.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    disabled={deletingId === session.id}
                    className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                      isDarkMode
                        ? "hover:bg-red-500/20 text-red-400 hover:text-red-300"
                        : "hover:bg-red-100 text-red-600"
                    } ${deletingId === session.id ? "opacity-100" : ""}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div
          className={`p-4 border-t text-[10px] opacity-50 text-center ${
            isDarkMode ? "border-slate-800" : "border-slate-200"
          }`}
        >
          {sessions.length} total chat{sessions.length !== 1 ? "s" : ""}
        </div>
      </div>
    </>
  );
};

export default ChatHistorySidebar;
