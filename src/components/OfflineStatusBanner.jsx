/**
 * OfflineStatusBanner Component
 * Shows offline/queue status to users in a friendly way
 * Usage: <OfflineStatusBanner />
 */

import React from 'react';
import { useOfflineQueue } from '../hooks/useOfflineQueue';

export const OfflineStatusBanner = ({ compact = false }) => {
  const { isOnline, pendingOperations, pendingEmails } = useOfflineQueue();

  if (isOnline && pendingOperations === 0) {
    return null; // Don't show if online and no pending operations
  }

  const bannerClasses = compact 
    ? 'p-2 text-xs'
    : 'p-4 text-sm';

  const containerClasses = !isOnline && pendingOperations > 0
    ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700'
    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600';

  const textClasses = !isOnline && pendingOperations > 0
    ? 'text-amber-800 dark:text-amber-200'
    : 'text-gray-600 dark:text-gray-300';

  const statusIndicator = !isOnline && pendingOperations > 0
    ? 'animate-pulse bg-amber-500'
    : 'bg-gray-400';

  return (
    <div className={`${containerClasses} rounded-lg ${bannerClasses} flex items-center gap-2`}>
      <span className={`inline-block w-2 h-2 ${statusIndicator} rounded-full`}></span>
      
      {isOnline && pendingOperations === 0 ? (
        <span className={textClasses}>✓ All operations synced</span>
      ) : isOnline && pendingOperations > 0 ? (
        <span className={textClasses}>
          ⟳ Syncing {pendingOperations} operation{pendingOperations > 1 ? 's' : ''}...
        </span>
      ) : pendingOperations > 0 ? (
        <span className={textClasses}>
          📧 {pendingEmails > 0 ? `${pendingEmails} email${pendingEmails > 1 ? 's' : ''}` : `${pendingOperations} operation${pendingOperations > 1 ? 's' : ''}`} queued — will send when online
        </span>
      ) : (
        <span className={textClasses}>You're offline</span>
      )}
    </div>
  );
};

export default OfflineStatusBanner;
