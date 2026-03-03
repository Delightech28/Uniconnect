import { useState, useEffect } from 'react';
import { subscribeToUnreadCount } from '../services/notificationService';

/**
 * useUnreadNotifications Hook
 * Manages real-time unread notification count
 * @param {string} userId - Current user ID
 * @returns {number} Unread notification count
 */
export const useUnreadNotifications = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUnreadCount(userId, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [userId]);

  return unreadCount;
};

export default useUnreadNotifications;
