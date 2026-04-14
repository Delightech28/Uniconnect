import React, { useState, useEffect } from "react";
import { Clock, Check, X } from "lucide-react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  acceptQuizInvite,
  declineQuizInvite,
} from "../services/quizMultiplayerService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const QuizInviteNotifications = () => {
  const [invites, setInvites] = useState([]);
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Listen for pending quiz invites for current user
    const q = query(
      collection(db, "quizInvites"),
      where("toUserId", "==", userId),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invitesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvites(invitesList);
    });

    return unsubscribe;
  }, [userId]);

  const handleAccept = async (invite) => {
    try {
      // Get current user's display name
      const userDoc = await getDoc(doc(db, "users", userId));
      const userName = userDoc.data()?.displayName || "User";

      // Accept the invite and create session
      const sessionId = await acceptQuizInvite(invite.id, userId, userName);

      toast.success("Invite accepted!");

      // Navigate to quiz with multiplayer session
      // In a real app, you'd navigate to quiz with the sessionId
      console.log("Quiz session created:", sessionId);
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error("Failed to accept invite");
    }
  };

  const handleDecline = async (inviteId) => {
    try {
      await declineQuizInvite(inviteId);
      toast.success("Invite declined");
    } catch (error) {
      console.error("Error declining invite:", error);
      toast.error("Failed to decline invite");
    }
  };

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                Quiz Invite from {invite.fromUserName}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {invite.quizTitle}
              </p>
            </div>
            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(invite)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={() => handleDecline(invite.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-xs font-bold rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuizInviteNotifications;
