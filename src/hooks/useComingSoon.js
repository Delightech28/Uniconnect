import { useEffect, useState } from 'react';

/**
 * useComingSoon Hook
 * Manages the coming soon overlay logic for features under development
 * 
 * Usage:
 * const { isComingSoon } = useComingSoon('unimarket');
 * if (isComingSoon) return <ComingSoonOverlay featureName="UniMarket" />;
 */
export const useComingSoon = (featureName = 'Feature') => {
  const [isComingSoon, setIsComingSoon] = useState(false);

  useEffect(() => {
    // Check if deadline has passed
    const deadline = localStorage.getItem('comingSoonDeadline');
    
    if (deadline) {
      const now = Date.now();
      const deadlineTime = parseInt(deadline, 10);
      
      if (now >= deadlineTime) {
        // Deadline has passed, feature is now available
        setIsComingSoon(false);
        localStorage.removeItem('comingSoonDeadline');
      } else {
        // Still in coming soon period
        setIsComingSoon(true);
      }
    } else {
      // First time visiting, set coming soon
      setIsComingSoon(true);
    }
  }, [featureName]);

  return {
    isComingSoon,
    resetDeadline: () => localStorage.removeItem('comingSoonDeadline'),
    getTimeRemaining: () => {
      const deadline = localStorage.getItem('comingSoonDeadline');
      if (!deadline) return null;
      
      const remaining = parseInt(deadline, 10) - Date.now();
      if (remaining <= 0) return null;
      
      return {
        days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
        hours: Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((remaining % (1000 * 60)) / 1000),
      };
    },
  };
};

export default useComingSoon;
