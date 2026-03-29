/**
 * Offline Queue Service
 * Manages queuing of async operations when offline
 * Automatically retries when connection is restored
 */

const OFFLINE_QUEUE_KEY = 'uniconnect_offline_queue';
const QUEUE_RETRY_INTERVAL = 5000; // 5 seconds
let retryIntervalId = null;

/**
 * Add an operation to the offline queue
 */
export const queueOperation = (operationType, operationData) => {
  try {
    const queue = getOfflineQueue();
    const operation = {
      id: `${operationType}_${Date.now()}_${Math.random()}`,
      type: operationType,
      data: operationData,
      createdAt: new Date().toISOString(),
      retries: 0,
      maxRetries: 5,
    };
    
    queue.push(operation);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    
    console.log('[OfflineQueue] Operation queued:', operation.id, operationType);
    return operation.id;
  } catch (error) {
    console.error('[OfflineQueue] Error queuing operation:', error);
    return null;
  }
};

/**
 * Get all queued operations
 */
export const getOfflineQueue = () => {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('[OfflineQueue] Error reading queue:', error);
    return [];
  }
};

/**
 * Remove an operation from the queue
 */
export const removeQueuedOperation = (operationId) => {
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter(op => op.id !== operationId);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    
    console.log('[OfflineQueue] Operation removed:', operationId);
  } catch (error) {
    console.error('[OfflineQueue] Error removing operation:', error);
  }
};

/**
 * Update operation retry count and last retry time
 */
export const updateQueuedOperation = (operationId, updates) => {
  try {
    const queue = getOfflineQueue();
    const operation = queue.find(op => op.id === operationId);
    
    if (operation) {
      Object.assign(operation, {
        ...updates,
        lastRetryAt: new Date().toISOString(),
      });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log('[OfflineQueue] Operation updated:', operationId, updates);
    }
  } catch (error) {
    console.error('[OfflineQueue] Error updating operation:', error);
  }
};

/**
 * Start listening for online status and retry queued operations
 */
export const startOfflineRetryListener = (retryHandler) => {
  // Check initial online status
  if (navigator.onLine) {
    retryQueuedOperations(retryHandler);
  }

  // Listen for online event
  const handleOnline = () => {
    console.log('[OfflineQueue] 🟢 Back online! Retrying queued operations...');
    retryQueuedOperations(retryHandler);
  };

  window.addEventListener('online', handleOnline);

  // Also check periodically (in case online event doesn't fire)
  if (retryIntervalId) clearInterval(retryIntervalId);
  retryIntervalId = setInterval(() => {
    if (navigator.onLine) {
      retryQueuedOperations(retryHandler);
    }
  }, QUEUE_RETRY_INTERVAL);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    if (retryIntervalId) clearInterval(retryIntervalId);
  };
};

/**
 * Retry all queued operations using the provided handler
 */
export const retryQueuedOperations = async (retryHandler) => {
  const queue = getOfflineQueue();
  
  if (queue.length === 0) {
    console.log('[OfflineQueue] No queued operations to retry');
    return;
  }

  console.log(`[OfflineQueue] Attempting to retry ${queue.length} queued operation(s)...`);

  for (const operation of queue) {
    // Skip if max retries exceeded
    if (operation.retries >= operation.maxRetries) {
      console.warn('[OfflineQueue] Max retries exceeded for:', operation.id);
      continue;
    }

    try {
      // Call the retry handler with the operation
      await retryHandler(operation);
      
      // If successful, remove from queue
      removeQueuedOperation(operation.id);
      console.log('[OfflineQueue] ✅ Operation succeeded and removed from queue:', operation.id);
    } catch (error) {
      // Increment retry count and keep in queue
      updateQueuedOperation(operation.id, {
        retries: operation.retries + 1,
      });
      console.warn('[OfflineQueue] Operation retry failed, will retry later:', operation.id, error.message);
    }
  }
};

/**
 * Clear all queued operations
 */
export const clearOfflineQueue = () => {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('[OfflineQueue] Queue cleared');
  } catch (error) {
    console.error('[OfflineQueue] Error clearing queue:', error);
  }
};

/**
 * Get queue status
 */
export const getQueueStatus = () => {
  const queue = getOfflineQueue();
  const pending = queue.filter(op => op.type === 'send_verification_email').length;
  
  return {
    isOnline: navigator.onLine,
    pendingOperations: queue.length,
    pendingEmails: pending,
    queue: queue,
  };
};
