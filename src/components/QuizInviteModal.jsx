import React, { useState, useEffect } from "react";
import { X, Send, Check, Clock } from "lucide-react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getConnections } from "../services/profileService";
import toast from "react-hot-toast";

const QuizInviteModal = ({
  isOpen,
  onClose,
  quizTitle,
  topicId,
  onInviteSent,
}) => {
  const [connections, setConnections] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Get user's connections from the service
      const userConnections = await getConnections(userId);
      setConnections(userConnections || []);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (connectionId) => {
    setSelectedConnections((prev) =>
      prev.includes(connectionId)
        ? prev.filter((id) => id !== connectionId)
        : [...prev, connectionId],
    );
  };

  const handleSendInvites = async () => {
    if (selectedConnections.length === 0) {
      toast.error("Please select at least one person to invite");
      return;
    }

    try {
      setLoading(true);
      const currentUserId = auth.currentUser?.uid;
      const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
      const currentUserName = currentUserDoc.data()?.displayName || "Someone";

      for (const selectedId of selectedConnections) {
        // Create quiz invite document
        const inviteId = `${currentUserId}_${selectedId}_${Date.now()}`;

        await setDoc(doc(db, "quizInvites", inviteId), {
          id: inviteId,
          fromUserId: currentUserId,
          fromUserName: currentUserName,
          toUserId: selectedId,
          quizTitle: quizTitle,
          topicId: topicId,
          status: "pending", // pending, accepted, declined
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        // Create notification for invited user
        await setDoc(doc(db, "notifications", `${inviteId}_notif`), {
          userId: selectedId,
          type: "quizInvite",
          title: "Quiz Invite",
          message: `${currentUserName} invited you to join a quiz: ${quizTitle}`,
          inviteId: inviteId,
          fromUserId: currentUserId,
          fromUserName: currentUserName,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }

      toast.success(
        `Invited ${selectedConnections.length} person(s) to the quiz!`,
      );
      setSelectedConnections([]);
      onInviteSent?.();
      onClose();
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.error("Failed to send invites");
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(
    (connection) =>
      connection.displayName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      connection.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Invite to Quiz
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#07bc0c]"
          />
        </div>

        {/* Connections List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center text-slate-500 py-8">
              Loading connections...
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              {connections.length === 0
                ? "You have no connections yet"
                : "No connections match your search"}
            </div>
          ) : (
            filteredConnections.map((connection) => (
              <button
                key={connection.id}
                onClick={() => toggleSelection(connection.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  selectedConnections.includes(connection.id)
                    ? "border-[#07bc0c] bg-[#07bc0c]/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-[#07bc0c]/50"
                }`}
              >
                <img
                  src={connection.avatarUrl || "/default_avatar.png"}
                  alt={connection.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {connection.displayName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {connection.email}
                  </p>
                </div>
                {selectedConnections.includes(connection.id) && (
                  <Check className="w-5 h-5 text-[#07bc0c]" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvites}
            disabled={selectedConnections.length === 0 || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#07bc0c] text-white font-medium hover:bg-[#07bc0c]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Invite ({selectedConnections.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizInviteModal;
