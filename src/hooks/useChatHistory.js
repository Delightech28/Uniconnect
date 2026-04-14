import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";

/**
 * Hook for managing chat history with Firestore persistence
 * Saves and retrieves chat conversations for the authenticated user
 */
export const useChatHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) setSessions([]);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user's chat sessions from Firestore
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "chatSessions"),
        where("userId", "==", currentUser.uid),
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));

        setSessions(data);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Create a new chat session
   */
  const createSession = useCallback(
    async (title = "New Chat") => {
      if (!currentUser) {
        toast.error("Please sign in to save chats");
        return null;
      }

      try {
        const docRef = await addDoc(collection(db, "chatSessions"), {
          userId: currentUser.uid,
          title,
          messages: [],
          createdAt: serverTimestamp(),
          lastModified: serverTimestamp(),
          settings: {
            accent: "US",
            tone: "TEACHER",
          },
        });

        return docRef.id;
      } catch (error) {
        console.error("Error creating session:", error);
        toast.error("Failed to create chat session");
        return null;
      }
    },
    [currentUser],
  );

  /**
   * Update a chat session's messages
   */
  const updateSession = useCallback(
    async (sessionId, messages, title = null) => {
      if (!currentUser || !sessionId) return false;

      try {
        const updateData = {
          messages,
          lastModified: serverTimestamp(),
        };

        if (title) {
          updateData.title = title;
        }

        await updateDoc(doc(db, "chatSessions", sessionId), updateData);
        return true;
      } catch (error) {
        console.error("Error updating session:", error);
        toast.error("Failed to save chat");
        return false;
      }
    },
    [currentUser],
  );

  /**
   * Delete a chat session
   */
  const deleteSession = useCallback(
    async (sessionId) => {
      if (!currentUser) return false;

      try {
        await deleteDoc(doc(db, "chatSessions", sessionId));
        toast.success("Chat deleted");
        return true;
      } catch (error) {
        console.error("Error deleting session:", error);
        toast.error("Failed to delete chat");
        return false;
      }
    },
    [currentUser],
  );

  /**
   * Clear all chat sessions
   */
  const clearAllSessions = useCallback(async () => {
    if (!currentUser) return false;

    try {
      const q = query(
        collection(db, "chatSessions"),
        where("userId", "==", currentUser.uid),
      );

      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));

      await Promise.all(deletePromises);
      toast.success("All chats cleared");
      return true;
    } catch (error) {
      console.error("Error clearing sessions:", error);
      toast.error("Failed to clear chats");
      return false;
    }
  }, [currentUser]);

  /**
   * Add a single message to a session
   */
  const addMessage = useCallback(
    async (sessionId, message) => {
      if (!currentUser || !sessionId) return false;

      try {
        const sessionRef = doc(db, "chatSessions", sessionId);
        const sessionData = sessions.find((s) => s.id === sessionId);

        if (!sessionData) {
          console.error("Session not found");
          return false;
        }

        const updatedMessages = [
          ...(sessionData.messages || []),
          {
            id: Date.now().toString(),
            ...message,
            timestamp: Date.now(),
          },
        ];

        await updateDoc(sessionRef, {
          messages: updatedMessages,
          lastModified: serverTimestamp(),
        });

        return true;
      } catch (error) {
        console.error("Error adding message:", error);
        return false;
      }
    },
    [currentUser, sessions],
  );

  /**
   * Get a specific session with its messages
   */
  const getSession = useCallback(
    (sessionId) => {
      return sessions.find((s) => s.id === sessionId) || null;
    },
    [sessions],
  );

  /**
   * Update session settings (accent, tone, etc.)
   */
  const updateSessionSettings = useCallback(
    async (sessionId, settings) => {
      if (!currentUser || !sessionId) return false;

      try {
        const sessionData = sessions.find((s) => s.id === sessionId);
        if (!sessionData) return false;

        await updateDoc(doc(db, "chatSessions", sessionId), {
          settings: {
            ...sessionData.settings,
            ...settings,
          },
          lastModified: serverTimestamp(),
        });

        return true;
      } catch (error) {
        console.error("Error updating settings:", error);
        return false;
      }
    },
    [currentUser, sessions],
  );

  return {
    sessions,
    loading,
    currentUser,
    createSession,
    updateSession,
    deleteSession,
    clearAllSessions,
    addMessage,
    getSession,
    updateSessionSettings,
  };
};
