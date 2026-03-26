import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook for optimistic UI updates
 * Updates UI immediately, then syncs with server
 * If server fails, reverts the UI change
 */
export const useOptimisticUpdate = () => {
  const [loading, setLoading] = useState(false);

  const executeOptimistic = useCallback(
    async (
      optimisticUpdate, // Function that updates local state immediately
      asyncOperation,   // Function that makes the server call
      onSuccess,        // Callback on success
      onError,          // Callback on error (receives error)
      rollback          // Function to revert UI if server fails
    ) => {
      try {
        setLoading(true);

        // 1. Update UI immediately (optimistic)
        optimisticUpdate();

        // 2. Perform server operation in background
        const result = await asyncOperation();

        // 3. On success, run success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        console.error('Optimistic update failed:', error);

        // 4. On error, revert the UI change
        if (rollback) {
          rollback();
        }

        // Show error message
        toast.error(error.message || 'Action failed. Please try again.');

        // 5. Run error callback if provided
        if (onError) {
          onError(error);
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { executeOptimistic, loading };
};
