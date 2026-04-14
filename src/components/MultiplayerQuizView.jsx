import React, { useState, useEffect } from "react";
import { Users, Check, Clock } from "lucide-react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import toast from "react-hot-toast";

const MultiplayerQuizView = ({
  quizSessionId,
  quizTitle,
  onBothReady,
  isDarkMode,
}) => {
  const [sessionData, setSessionData] = useState(null);
  const [currentPlayerReady, setCurrentPlayerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserId = auth.currentUser?.uid;

  // Subscribe to session data
  useEffect(() => {
    if (!quizSessionId) return;

    const unsubscribe = onSnapshot(
      doc(db, "quizSessions", quizSessionId),
      (snapshot) => {
        if (snapshot.exists()) {
          setSessionData(snapshot.data());
          // Update current player's ready status
          const playerKey =
            currentUserId === snapshot.data().player1Id
              ? "player1Ready"
              : "player2Ready";
          setCurrentPlayerReady(snapshot.data()[playerKey] || false);
          setLoading(false);

          // Check if both players are ready
          if (snapshot.data().player1Ready && snapshot.data().player2Ready) {
            setTimeout(() => onBothReady?.(), 500);
          }
        }
      },
      (err) => {
        console.error("Error listening to session:", err);
        setError("Failed to load session");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [quizSessionId, currentUserId, onBothReady]);

  const handleToggleReady = async () => {
    try {
      const playerKey =
        currentUserId === sessionData?.player1Id
          ? "player1Ready"
          : "player2Ready";
      await updateDoc(doc(db, "quizSessions", quizSessionId), {
        [playerKey]: !currentPlayerReady,
      });
    } catch (error) {
      console.error("Error updating ready status:", error);
      toast.error("Failed to update ready status");
    }
  };

  if (loading) {
    return (
      <div
        className={`p-8 rounded-lg ${isDarkMode ? "bg-slate-900" : "bg-white"}`}
      >
        <p className="text-center text-slate-500">Loading session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-8 rounded-lg ${isDarkMode ? "bg-slate-900" : "bg-white"}`}
      >
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  if (!sessionData) return null;

  const isPlayer1 = currentUserId === sessionData.player1Id;
  const otherPlayerReady = isPlayer1
    ? sessionData.player2Ready
    : sessionData.player1Ready;
  const bothReady = currentPlayerReady && otherPlayerReady;

  return (
    <div
      className={`p-6 rounded-lg border-2 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
    >
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-[#07bc0c]" />
        <h3
          className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          Multiplayer Quiz
        </h3>
      </div>

      <p
        className={`text-sm mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
      >
        {quizTitle}
      </p>

      {/* Players Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Player 1 */}
        <div
          className={`p-4 rounded-lg border ${sessionData.player1Ready ? "border-green-500 bg-green-500/10" : `border-slate-300 ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}`}`}
        >
          <p
            className={`text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
          >
            Player 1
          </p>
          <p
            className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {sessionData.player1Name}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {sessionData.player1Ready ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  Ready
                </span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-400">Waiting...</span>
              </>
            )}
          </div>
        </div>

        {/* Player 2 */}
        <div
          className={`p-4 rounded-lg border ${sessionData.player2Ready ? "border-green-500 bg-green-500/10" : `border-slate-300 ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}`}`}
        >
          <p
            className={`text-sm font-medium mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
          >
            Player 2
          </p>
          <p
            className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            {sessionData.player2Name}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {sessionData.player2Ready ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  Ready
                </span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-400">Waiting...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ready Button */}
      <button
        onClick={handleToggleReady}
        className={`w-full py-3 rounded-lg font-bold transition-all ${
          currentPlayerReady
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-[#07bc0c] text-white hover:bg-[#07bc0c]/90"
        }`}
      >
        {currentPlayerReady ? "✓ Ready" : "Click to Ready"}
      </button>

      {bothReady && (
        <p className="text-center text-green-500 font-bold mt-4 animate-pulse">
          Both players ready! Quiz starting...
        </p>
      )}

      {!bothReady && (
        <p
          className={`text-center text-sm mt-4 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
        >
          {otherPlayerReady
            ? "Waiting for you to ready..."
            : "Waiting for other player..."}
        </p>
      )}
    </div>
  );
};

export default MultiplayerQuizView;
