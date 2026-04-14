import { db } from "../firebase";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";

/**
 * Create a new multiplayer quiz session
 */
export const createQuizSession = async (
  player1Id,
  player1Name,
  topicId,
  quizTitle,
) => {
  try {
    const sessionId = `quiz_${player1Id}_${Date.now()}`;

    await setDoc(doc(db, "quizSessions", sessionId), {
      sessionId,
      player1Id,
      player1Name,
      player1Score: 0,
      player1Ready: false,
      player2Id: null,
      player2Name: null,
      player2Score: 0,
      player2Ready: false,
      topicId,
      quizTitle,
      status: "waiting", // waiting, in-progress, completed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return sessionId;
  } catch (error) {
    console.error("Error creating quiz session:", error);
    throw error;
  }
};

/**
 * Accept a quiz invite and join the session
 */
export const acceptQuizInvite = async (inviteId, player2Id, player2Name) => {
  try {
    // Get the invite
    const inviteSnap = await getDoc(doc(db, "quizInvites", inviteId));
    if (!inviteSnap.exists()) {
      throw new Error("Invite not found");
    }

    const invite = inviteSnap.data();
    const sessionId = `quiz_${invite.fromUserId}_${Date.now()}`;

    // Create new session with both players
    await setDoc(doc(db, "quizSessions", sessionId), {
      sessionId,
      player1Id: invite.fromUserId,
      player1Name: invite.fromUserName,
      player1Score: 0,
      player1Ready: false,
      player2Id: player2Id,
      player2Name: player2Name,
      player2Score: 0,
      player2Ready: false,
      topicId: invite.topicId,
      quizTitle: invite.quizTitle,
      quizQuestions: invite.quizQuestions || [],
      status: "waiting",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update invite status
    await updateDoc(doc(db, "quizInvites", inviteId), {
      status: "accepted",
      sessionId: sessionId,
      acceptedAt: serverTimestamp(),
    });

    // Create notification for inviter that invite was accepted
    await addDoc(collection(db, "notifications"), {
      userId: invite.fromUserId,
      type: "quizInviteAccepted",
      title: "Quiz Invite Accepted",
      message: `${player2Name} accepted your quiz invite!`,
      sessionId: sessionId,
      inviteId: inviteId,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return sessionId;
  } catch (error) {
    console.error("Error accepting quiz invite:", error);
    throw error;
  }
};

/**
 * Update player score when quiz is completed
 */
export const updatePlayerScore = async (sessionId, playerId, score) => {
  try {
    const sessionSnap = await getDoc(doc(db, "quizSessions", sessionId));
    if (!sessionSnap.exists()) {
      throw new Error("Session not found");
    }

    const session = sessionSnap.data();
    const isPlayer1 = playerId === session.player1Id;
    const playerKey = isPlayer1 ? "player1Score" : "player2Score";

    await updateDoc(doc(db, "quizSessions", sessionId), {
      [playerKey]: score,
      updatedAt: serverTimestamp(),
    });

    // Check if both players have completed
    const otherPlayerScore = isPlayer1
      ? session.player2Score
      : session.player1Score;
    if (otherPlayerScore > 0) {
      // Both players completed - determine winner and send notifications
      await resolveQuizSession(sessionId);
    }

    return true;
  } catch (error) {
    console.error("Error updating player score:", error);
    throw error;
  }
};

/**
 * Resolve quiz session and send winner/loser notifications
 */
export const resolveQuizSession = async (sessionId) => {
  try {
    const sessionSnap = await getDoc(doc(db, "quizSessions", sessionId));
    if (!sessionSnap.exists()) {
      throw new Error("Session not found");
    }

    const session = sessionSnap.data();
    const player1Score = session.player1Score || 0;
    const player2Score = session.player2Score || 0;

    // Update session status
    await updateDoc(doc(db, "quizSessions", sessionId), {
      status: "completed",
      updatedAt: serverTimestamp(),
    });

    // Determine winner
    if (player1Score > player2Score) {
      // Player 1 wins
      await addDoc(collection(db, "notifications"), {
        userId: session.player1Id,
        type: "quizWin",
        title: "🏆 Quiz Victory!",
        message: `You won the quiz against ${session.player2Name}! Score: ${player1Score}`,
        sessionId: sessionId,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        userId: session.player2Id,
        type: "quizLoss",
        title: "❌ Quiz Defeat",
        message: `You lost the quiz against ${session.player1Name}. Score: ${player2Score}`,
        sessionId: sessionId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } else if (player2Score > player1Score) {
      // Player 2 wins
      await addDoc(collection(db, "notifications"), {
        userId: session.player2Id,
        type: "quizWin",
        title: "🏆 Quiz Victory!",
        message: `You won the quiz against ${session.player1Name}! Score: ${player2Score}`,
        sessionId: sessionId,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        userId: session.player1Id,
        type: "quizLoss",
        title: "❌ Quiz Defeat",
        message: `You lost the quiz against ${session.player2Name}. Score: ${player1Score}`,
        sessionId: sessionId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } else {
      // Tie
      await addDoc(collection(db, "notifications"), {
        userId: session.player1Id,
        type: "quizTie",
        title: "⚖️ Quiz Tie",
        message: `You tied the quiz with ${session.player2Name}! Score: ${player1Score}`,
        sessionId: sessionId,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        userId: session.player2Id,
        type: "quizTie",
        title: "⚖️ Quiz Tie",
        message: `You tied the quiz with ${session.player1Name}! Score: ${player2Score}`,
        sessionId: sessionId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error resolving quiz session:", error);
    throw error;
  }
};

/**
 * Decline a quiz invite
 */
export const declineQuizInvite = async (inviteId) => {
  try {
    await updateDoc(doc(db, "quizInvites", inviteId), {
      status: "declined",
      declinedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error declining quiz invite:", error);
    throw error;
  }
};
