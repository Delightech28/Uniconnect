import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Profile Stats Service
 * Provides real-time profile statistics
 */

/**
 * Get comprehensive profile stats
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Stats object with posts, followers, following, sales, ratings
 */
export const getProfileStats = async (userId) => {
  try {
    const stats = {};

    // Get user profile for basic stats
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const userData = userDoc.data();

    // Count followers
    stats.followers = (userData.followers || []).length;

    // Count following
    stats.following = (userData.following || []).length;

    // Count posts (use authorId field which is used across the app)
    const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    stats.posts = postsSnapshot.size;

    // Count items sold across common collections (items, listings, marketplace)
    const itemCollections = [
      { name: 'items', soldField: { key: 'sold', value: true } },
      { name: 'listings', soldField: { key: 'status', value: 'sold' } },
      { name: 'marketplace', soldField: { key: 'status', value: 'sold' } },
    ];
    let soldCount = 0;
    for (const col of itemCollections) {
      try {
        const colRef = collection(db, col.name);
        const q = query(
          colRef,
          where('sellerId', '==', userId),
          where(col.soldField.key, '==', col.soldField.value)
        );
        const snap = await getDocs(q);
        soldCount += snap.size;
      } catch (e) {
        // collection might not exist in this project; ignore and continue
        console.warn(`Could not query collection ${col.name}:`, e.message || e);
      }
    }
    stats.itemsSold = soldCount;

    // Get seller rating and reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('sellerId', '==', userId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => doc.data());

    stats.reviews = reviews.length;
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      stats.sellerRating = (totalRating / reviews.length).toFixed(1);
    } else {
      stats.sellerRating = 0;
    }

    return stats;
  } catch (err) {
    console.error('Error fetching profile stats:', err);
    return {
      followers: 0,
      following: 0,
      posts: 0,
      itemsSold: 0,
      reviews: 0,
      sellerRating: 0,
    };
  }
};

/**
 * Get real-time followers count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Followers count
 */
export const getFollowersCount = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return 0;
    return (userDoc.data().followers || []).length;
  } catch (err) {
    console.error('Error fetching followers count:', err);
    return 0;
  }
};

/**
 * Get real-time following count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Following count
 */
export const getFollowingCount = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return 0;
    return (userDoc.data().following || []).length;
  } catch (err) {
    console.error('Error fetching following count:', err);
    return 0;
  }
};

/**
 * Get real-time posts count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Posts count
 */
export const getPostsCount = async (userId) => {
  try {
    const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    return postsSnapshot.size;
  } catch (err) {
    console.error('Error fetching posts count:', err);
    return 0;
  }
};

/**
 * Get items sold count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Items sold count
 */
export const getItemsSoldCount = async (userId) => {
  try {
    const itemsQuery = query(
      collection(db, 'marketplace'),
      where('sellerId', '==', userId),
      where('status', '==', 'sold')
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    return itemsSnapshot.size;
  } catch (err) {
    console.error('Error fetching items sold count:', err);
    return 0;
  }
};

/**
 * Get seller rating
 * @param {string} userId - User ID
 * @returns {Promise<number>} Average seller rating
 */
export const getSellerRating = async (userId) => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('sellerId', '==', userId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => doc.data());

    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return parseFloat((totalRating / reviews.length).toFixed(1));
  } catch (err) {
    console.error('Error fetching seller rating:', err);
    return 0;
  }
};

/**
 * Get reviews count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of reviews
 */
export const getReviewsCount = async (userId) => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('sellerId', '==', userId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    return reviewsSnapshot.size;
  } catch (err) {
    console.error('Error fetching reviews count:', err);
    return 0;
  }
};
