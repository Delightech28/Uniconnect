import { useState, useEffect } from 'react';
import { getProfileStats, getPostsCount, getFollowersCount } from '../services/profileStatsService';

/**
 * useProfileStats Hook
 * Fetches and manages real-time profile statistics
 * @param {string} userId - User ID
 * @param {boolean} enabled - Whether to fetch stats
 * @returns {Object} Profile stats object
 */
export const useProfileStats = (userId, enabled = true) => {
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0,
    itemsSold: 0,
    reviews: 0,
    sellerRating: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !enabled) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const profileStats = await getProfileStats(userId);
        setStats(profileStats);
      } catch (err) {
        console.error('Error fetching profile stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Optionally set up polling for real-time updates
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [userId, enabled]);

  return { stats, loading, error };
};

export default useProfileStats;
