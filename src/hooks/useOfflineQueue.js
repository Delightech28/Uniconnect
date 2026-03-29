/**
 * useOfflineQueue Hook
 * Monitor and interact with offline queue status
 * Usage: const { isOnline, pendingOperations, queueStatus } = useOfflineQueue();
 */

import { useState, useEffect } from 'react';
import { getQueueStatus, startOfflineRetryListener } from '../services/offlineQueueService';

export const useOfflineQueue = (retryHandler = null) => {
  const [queueStatus, setQueueStatus] = useState({
    isOnline: navigator.onLine,
    pendingOperations: 0,
    pendingEmails: 0,
    queue: [],
  });

  useEffect(() => {
    // Initialize offline queue listener if retry handler provided
    let cleanup = () => {};
    if (retryHandler) {
      cleanup = startOfflineRetryListener(retryHandler);
    }

    // Update status periodically
    const updateStatus = () => {
      setQueueStatus(getQueueStatus());
    };

    // Initial update
    updateStatus();

    // Poll for status changes
    const statusInterval = setInterval(updateStatus, 2000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cleanup();
      clearInterval(statusInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryHandler]);

  return {
    ...queueStatus,
    isPending: queueStatus.pendingOperations > 0,
  };
};
