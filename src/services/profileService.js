import {
  db,
  auth,
} from '../firebase';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import {
  notifyNewFollower,
  notifyConnectionRequest,
  notifyConnectionAccepted,
} from './notificationService';

/**
 * PROFILE SERVICE
 * Centralized service for all profile-related operations
 */

// ============ PROFILE RETRIEVAL ============

/**
 * Get user profile data
 * @param {string} userId - User ID to fetch
 * @returns {Promise<Object>} User profile object
 */
export const getUserProfile = async (userId) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    return { id: userId, ...userSnap.data() };
  } catch (err) {
    console.error('Error fetching user profile:', err);
    throw err;
  }
};

/**
 * Get user's followers
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of follower user objects
 */
export const getFollowers = async (userId) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return [];

    const followerIds = userSnap.data().followers || [];
    if (followerIds.length === 0) return [];

    const followers = await Promise.all(
      followerIds.map(async (id) => {
        const snap = await getDoc(doc(db, 'users', id));
        return snap.exists() ? { id, ...snap.data() } : null;
      })
    );

    return followers.filter((f) => f !== null);
  } catch (err) {
    console.error('Error fetching followers:', err);
    return [];
  }
};

/**
 * Get users that a user is following
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of following user objects
 */
export const getFollowing = async (userId) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return [];

    const followingIds = userSnap.data().following || [];
    if (followingIds.length === 0) return [];

    const following = await Promise.all(
      followingIds.map(async (id) => {
        const snap = await getDoc(doc(db, 'users', id));
        return snap.exists() ? { id, ...snap.data() } : null;
      })
    );

    return following.filter((f) => f !== null);
  } catch (err) {
    console.error('Error fetching following:', err);
    return [];
  }
};

// ============ FOLLOW SYSTEM ============

/**
 * Toggle follow status (follow/unfollow)
 * @param {string} currentUserId - Current user's ID
 * @param {string} targetUserId - User to follow/unfollow
 * @returns {Promise<boolean>} True if now following, False if unfollowed
 */
export const toggleFollow = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    throw new Error('Cannot follow yourself');
  }

  try {
    const isFollowing = await checkIsFollowing(currentUserId, targetUserId);

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    if (isFollowing) {
      // Unfollow
      await Promise.all([
        updateDoc(currentUserRef, {
          following: arrayRemove(targetUserId),
          followingCount: (await getDoc(currentUserRef)).data().followingCount - 1,
        }),
        updateDoc(targetUserRef, {
          followers: arrayRemove(currentUserId),
          followerCount: (await getDoc(targetUserRef)).data().followerCount - 1,
        }),
      ]);
      return false;
    } else {
      // Follow
      await Promise.all([
        updateDoc(currentUserRef, {
          following: arrayUnion(targetUserId),
          followingCount: (await getDoc(currentUserRef)).data().followingCount + 1 || 1,
        }),
        updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId),
          followerCount: (await getDoc(targetUserRef)).data().followerCount + 1 || 1,
        }),
      ]);

      // Send notification to target user
      try {
        const currentUserData = await getUserProfile(currentUserId);
        await notifyNewFollower(targetUserId, {
          followerId: currentUserId,
          followerName: currentUserData.displayName || 'Someone',
          followerAvatar: currentUserData.avatarUrl || '/default_avatar.png',
        });
      } catch (err) {
        console.warn('Failed to send follow notification:', err);
      }

      return true;
    }
  } catch (err) {
    console.error('Error toggling follow:', err);
    throw err;
  }
};

/**
 * Check if current user is following target user
 * @param {string} currentUserId - Current user's ID
 * @param {string} targetUserId - User to check
 * @returns {Promise<boolean>} True if following
 */
export const checkIsFollowing = async (currentUserId, targetUserId) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', currentUserId));
    const following = userSnap.data()?.following || [];
    return following.includes(targetUserId);
  } catch (err) {
    console.error('Error checking follow status:', err);
    return false;
  }
};

// ============ CONNECTION REQUEST SYSTEM ============

/**
 * Send a connection request to another user
 * @param {string} currentUserId - User sending the request
 * @param {string} targetUserId - User receiving the request
 * @returns {Promise<string>} Status: 'sent', 'already_connected', 'already_pending'
 */
export const sendConnectionRequest = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    throw new Error('Cannot connect with yourself');
  }

  try {
    console.log('Sending connection request from', currentUserId, 'to', targetUserId);
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Verify users exist
    const [currentUserSnap, targetUserSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef),
    ]);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      throw new Error('User not found');
    }

    const currentUserData = currentUserSnap.data() || {};

    // Check existing connection via connections array or connections subcollection
    const existingConnections = targetUserSnap.data().connections || [];
    if (existingConnections.includes(currentUserId)) return 'already_connected';

    // Also check connections subcollection
    const connDoc = await getDoc(doc(db, 'users', targetUserId, 'connections', currentUserId));
    if (connDoc.exists()) return 'already_connected';

    // Check pending request existence via subcollection
    const pendingDoc = await getDoc(doc(db, 'users', targetUserId, 'connectionRequests', currentUserId));
    if (pendingDoc.exists()) return 'already_pending';

    // Create pending request document under target's subcollection
    await runTransaction(db, async (transaction) => {
      const reqRef = doc(db, 'users', targetUserId, 'connectionRequests', currentUserId);
      transaction.set(reqRef, {
        requesterId: currentUserId,
        createdAt: serverTimestamp(),
      });
    });

    console.log('Connection request sent successfully');

    // Send notification to target user
    if (typeof notifyConnectionRequest === 'function') {
      try {
        console.log('Sending notification to target user:', targetUserId);
        await notifyConnectionRequest(targetUserId, {
          requesterId: currentUserId,
          requesterName: currentUserData.displayName || currentUserData.email || 'Someone',
          requesterAvatar: currentUserData.avatarUrl || '/default_avatar.png',
        });
        console.log('Notification sent successfully');
      } catch (notifErr) {
        console.error('Failed to send connection notification:', notifErr);
      }
    } else {
      console.warn('notifyConnectionRequest function not available');
    }

    return 'sent';
  } catch (err) {
    console.error('Error sending connection request:', err);
    throw err;
  }
};

/**
 * Accept a connection request
 * @param {string} currentUserId - User accepting the request
 * @param {string} requesterId - User who sent the request
 * @returns {Promise<void>}
 */
export const acceptConnectionRequest = async (currentUserId, requesterId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const requesterRef = doc(db, 'users', requesterId);

    // Use transaction: create connection docs in both users' `connections` subcollections and remove pending request
    await runTransaction(db, async (transaction) => {
      const reqRef = doc(db, 'users', currentUserId, 'connectionRequests', requesterId);
      const connARef = doc(db, 'users', currentUserId, 'connections', requesterId);
      const connBRef = doc(db, 'users', requesterId, 'connections', currentUserId);

      // remove pending request
      transaction.delete(reqRef);

      // create connections
      transaction.set(connARef, { userId: requesterId, createdAt: serverTimestamp() });
      transaction.set(connBRef, { userId: currentUserId, createdAt: serverTimestamp() });
    });

    // Send notification to requester
    if (typeof notifyConnectionAccepted === 'function') {
      try {
        const currentUserSnap = await getDoc(currentUserRef);
        const currentUserData = currentUserSnap.data() || {};
        await notifyConnectionAccepted(requesterId, {
          acceptorId: currentUserId,
          acceptorName: currentUserData.displayName || 'Someone',
          acceptorAvatar: currentUserData.avatarUrl || '/default_avatar.png',
        });
      } catch (err) {
        console.warn('Failed to send acceptance notification:', err);
      }
    }
  } catch (err) {
    console.error('Error accepting connection request:', err);
    throw err;
  }
};

/**
 * Reject a connection request
 * @param {string} currentUserId - User rejecting the request
 * @param {string} requesterId - User who sent the request
 * @returns {Promise<void>}
 */
export const rejectConnectionRequest = async (currentUserId, requesterId) => {
  try {
    // Delete the pending request document under user's `connectionRequests` subcollection
    const reqRef = doc(db, 'users', currentUserId, 'connectionRequests', requesterId);
    await runTransaction(db, async (transaction) => {
      const reqSnap = await transaction.get(reqRef);
      if (reqSnap.exists()) transaction.delete(reqRef);
    });
  } catch (err) {
    console.error('Error rejecting connection request:', err);
    throw err;
  }
};

/**
 * Check if there's a pending connection request from user A to user B
 * @param {string} currentUserId - User to check
 * @param {string} targetUserId - Target user
 * @returns {Promise<boolean>} True if request is pending
 */
export const checkPendingRequest = async (currentUserId, targetUserId) => {
  try {
    // Check both legacy pendingConnections array and connectionRequests subcollection
    const userSnap = await getDoc(doc(db, 'users', targetUserId));
    const pendingRequests = userSnap.data()?.pendingConnections || [];
    if (pendingRequests.includes(currentUserId)) return true;

    const reqSnap = await getDoc(doc(db, 'users', targetUserId, 'connectionRequests', currentUserId));
    return reqSnap.exists();
  } catch (err) {
    console.error('Error checking pending request:', err);
    return false;
  }
};

/**
 * Check if two users are connected
 * @param {string} userId1 - First user
 * @param {string} userId2 - Second user
 * @returns {Promise<boolean>} True if connected
 */
export const checkIsConnected = async (userId1, userId2) => {
  try {
    // Check legacy connections array
    const userSnap = await getDoc(doc(db, 'users', userId1));
    const connections = userSnap.data()?.connections || [];
    if (connections.includes(userId2)) return true;

    // Check connections subcollection
    const connSnap = await getDoc(doc(db, 'users', userId1, 'connections', userId2));
    return connSnap.exists();
  } catch (err) {
    console.error('Error checking connection status:', err);
    return false;
  }
};

/**
 * Get user's connections (both accepted)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of connected user objects
 */
export const getConnections = async (userId) => {
  try {
    // First try connections subcollection
    const qSnap = await getDocs(collection(db, 'users', userId, 'connections'));
    if (qSnap.size > 0) {
      const connections = await Promise.all(
        qSnap.docs.map(async (d) => {
          const id = d.id;
          const snap = await getDoc(doc(db, 'users', id));
          return snap.exists() ? { id, ...snap.data() } : null;
        })
      );
      return connections.filter((c) => c !== null);
    }

    // Fallback to legacy connections array
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return [];

    const connectionIds = userSnap.data().connections || [];
    if (connectionIds.length === 0) return [];

    const connections = await Promise.all(
      connectionIds.map(async (id) => {
        const snap = await getDoc(doc(db, 'users', id));
        return snap.exists() ? { id, ...snap.data() } : null;
      })
    );

    return connections.filter((c) => c !== null);
  } catch (err) {
    console.error('Error fetching connections:', err);
    return [];
  }
};

/**
 * Get user's pending connection requests
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of pending requesters
 */
export const getPendingRequests = async (userId) => {
  try {
    // First check connectionRequests subcollection
    const qSnap = await getDocs(collection(db, 'users', userId, 'connectionRequests'));
    const pending = await Promise.all(
      qSnap.docs.map(async (d) => {
        const requesterId = d.id;
        const snap = await getDoc(doc(db, 'users', requesterId));
        return snap.exists() ? { id: requesterId, ...snap.data() } : null;
      })
    );

    if (pending.length > 0) return pending.filter((p) => p !== null);

    // Fallback to legacy array
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return [];
    const pendingIds = userSnap.data().pendingConnections || [];
    if (pendingIds.length === 0) return [];
    const pendingLegacy = await Promise.all(
      pendingIds.map(async (id) => {
        const snap = await getDoc(doc(db, 'users', id));
        return snap.exists() ? { id, ...snap.data() } : null;
      })
    );
    return pendingLegacy.filter((p) => p !== null);
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    return [];
  }
};

// ============ USER STATS & BADGES ============

/**
 * Calculate profile badges based on user data and activity
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of badge objects
 */
export const calculateBadges = async (userId) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return [];

    const userData = userSnap.data();
    const badges = [];

    // Verified Student Badge
    if (userData.verificationStatus === 'verified') {
      badges.push({
        id: 'verified-student',
        name: 'Verified Student',
        icon: '✓',
        color: 'blue',
        description: 'Verified university student',
      });
    }

    // Top Seller Badge (more than 10 items sold with 4.5+ rating)
    if (userData.itemsSold >= 10 && userData.sellerRating >= 4.5) {
      badges.push({
        id: 'top-seller',
        name: 'Top Seller',
        icon: '⭐',
        color: 'yellow',
        description: 'Excellent seller with 10+ sales',
      });
    }

    // AI Expert Badge (created 5+ AI-related posts/content)
    if (userData.aiExpertContent >= 5) {
      badges.push({
        id: 'ai-expert',
        name: 'AI Expert',
        icon: '🤖',
        color: 'purple',
        description: 'Expert contributor in AI topics',
      });
    }

    return badges;
  } catch (err) {
    console.error('Error calculating badges:', err);
    return [];
  }
};

/**
 * Get comprehensive user statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics object
 */
export const getUserStats = async (userId) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      return {
        itemsSold: 0,
        itemsListed: 0,
        sellerRating: 0,
        reviews: 0,
        postsCreated: 0,
        followerCount: 0,
        followingCount: 0,
        joinDate: null,
      };
    }

    const data = userSnap.data();
    return {
      itemsSold: data.itemsSold || 0,
      itemsListed: data.itemsListed || 0,
      sellerRating: data.sellerRating || 0,
      reviews: data.reviews || 0,
      postsCreated: data.postsCreated || 0,
      followerCount: data.followerCount || 0,
      followingCount: data.followingCount || 0,
      joinDate: data.createdAt || data.joinDate || null,
    };
  } catch (err) {
    console.error('Error fetching user stats:', err);
    return {
      itemsSold: 0,
      itemsListed: 0,
      sellerRating: 0,
      reviews: 0,
      postsCreated: 0,
      followerCount: 0,
      followingCount: 0,
      joinDate: null,
    };
  }
};

// ============ USER PORTFOLIO ============

/**
 * Get user's created posts
 * @param {string} userId - User ID
 * @param {number} limit - Max number of posts to fetch
 * @returns {Promise<Array>} Array of post objects
 */
export const getUserPosts = async (userId, limit = 10) => {
  try {
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return posts.slice(0, limit);
  } catch (err) {
    console.error('Error fetching user posts:', err);
    return [];
  }
};

/**
 * Get user's sold items
 * @param {string} userId - User ID
 * @param {number} limit - Max number of items to fetch
 * @returns {Promise<Array>} Array of item objects
 */
export const getUserSoldItems = async (userId, limit = 10) => {
  try {
    const q = query(
      collection(db, 'items'),
      where('sellerId', '==', userId),
      where('sold', '==', true)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return items.slice(0, limit);
  } catch (err) {
    console.error('Error fetching user sold items:', err);
    return [];
  }
};

/**
 * Get user's active listings
 * @param {string} userId - User ID
 * @param {number} limit - Max number of items to fetch
 * @returns {Promise<Array>} Array of active item objects
 */
export const getUserActiveListings = async (userId, limit = 10) => {
  try {
    const q = query(
      collection(db, 'items'),
      where('sellerId', '==', userId),
      where('sold', '==', false)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return items.slice(0, limit);
  } catch (err) {
    console.error('Error fetching user active listings:', err);
    return [];
  }
};

// ============ PRIVACY SETTINGS ============

/**
 * Get user privacy settings
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Privacy settings object
 */
export const getPrivacySettings = async (userId) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      return getDefaultPrivacySettings();
    }

    return (
      userSnap.data().privacySettings || getDefaultPrivacySettings()
    );
  } catch (err) {
    console.error('Error fetching privacy settings:', err);
    return getDefaultPrivacySettings();
  }
};

/**
 * Get default privacy settings
 * @returns {Object} Default privacy settings
 */
export const getDefaultPrivacySettings = () => ({
  // Profile Visibility
  profileVisibility: 'public', // 'public', 'verified-only', 'private'
  canBeFollowed: true,
  
  // Messaging Settings
  canReceiveMessages: true,
  messageFilter: 'everyone', // 'everyone', 'followers-only', 'verified-only', 'none'
  blockList: [],
  
  // Interaction Settings
  canBeLiked: true,
  canBeTagged: true,
  
  // Visibility Settings
  canSeeUserStats: true,
  canSeeUserPosts: true,
  canSeeUserItems: true,
  canSeeFollowers: true,
  canSeeTransactionHistory: false,
  
  // Search & Discoverability
  searchable: true,
  includeInRecommendations: true,
  
  // Request Settings
  requireApprovalForMessages: false,
  allowBuyerRequests: true,
  allowSellerRequests: true,
});

/**
 * Update privacy settings
 * @param {string} userId - User ID
 * @param {Object} settings - New privacy settings
 * @returns {Promise<void>}
 */
export const updatePrivacySettings = async (userId, settings) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      privacySettings: {
        ...getDefaultPrivacySettings(),
        ...settings,
      },
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error updating privacy settings:', err);
    throw err;
  }
};

/**
 * Check if viewing user can see target user's profile based on privacy
 * @param {string} viewingUserId - User viewing the profile
 * @param {string} targetUserId - User whose profile is being viewed
 * @returns {Promise<boolean>} True if can view
 */
export const canViewProfile = async (viewingUserId, targetUserId) => {
  try {
    // Can always view own profile
    if (viewingUserId === targetUserId) return true;

    const privacySettings = await getPrivacySettings(targetUserId);

    if (privacySettings.profileVisibility === 'private') {
      // Only followers can view private profiles
      const targetUser = await getUserProfile(targetUserId);
      return (targetUser.followers || []).includes(viewingUserId);
    }

    if (privacySettings.profileVisibility === 'verified-only') {
      // Only verified users can view
      const viewingUser = await getUserProfile(viewingUserId);
      return viewingUser.verificationStatus === 'verified';
    }

    // Public profile - can view
    return true;
  } catch (err) {
    console.error('Error checking profile visibility:', err);
    return false;
  }
};

/**
 * Check if viewing user can interact with target user (follow, message, like)
 * @param {string} viewingUserId - User trying to interact
 * @param {string} targetUserId - User being interacted with
 * @param {string} interactionType - 'follow', 'message', 'like'
 * @returns {Promise<boolean>} True if allowed
 */
export const canInteract = async (viewingUserId, targetUserId, interactionType) => {
  try {
    if (viewingUserId === targetUserId) return false;

    const privacySettings = await getPrivacySettings(targetUserId);

    switch (interactionType) {
      case 'follow':
        return privacySettings.canBeFollowed;
      case 'message':
        return privacySettings.canReceiveMessages;
      case 'like':
        return privacySettings.canBeLiked;
      default:
        return true;
    }
  } catch (err) {
    console.error('Error checking interaction permission:', err);
    return false;
  }
};

// ============ PROFILE UPDATES ============

/**
 * Increment a user stat (e.g., itemsSold)
 * @param {string} userId - User ID
 * @param {string} statField - Field to increment
 * @param {number} amount - Amount to increment by (default 1)
 * @returns {Promise<void>}
 */
export const incrementUserStat = async (userId, statField, amount = 1) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const currentValue = userSnap.data()?.[statField] || 0;

    await updateDoc(userRef, {
      [statField]: currentValue + amount,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error(`Error incrementing ${statField}:`, err);
    throw err;
  }
};

/**
 * Add AI Expert content count (for AI Expert badge)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const incrementAIExpertContent = async (userId) => {
  await incrementUserStat(userId, 'aiExpertContent', 1);
};

/**
 * Update seller rating
 * @param {string} userId - Seller ID
 * @param {number} rating - New rating (0-5)
 * @returns {Promise<void>}
 */
export const updateSellerRating = async (userId, rating) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const data = userSnap.data();

    const currentRating = data?.sellerRating || 0;
    const reviewCount = data?.reviews || 0;

    // Calculate average rating
    const newRating = (currentRating * reviewCount + rating) / (reviewCount + 1);

    await updateDoc(userRef, {
      sellerRating: newRating,
      reviews: reviewCount + 1,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error updating seller rating:', err);
    throw err;
  }
};

// ============ LIKES SYSTEM ============

/**
 * Check if user likes another user (using subcollection)
 * @param {string} likerUserId - User doing the liking
 * @param {string} likedUserId - User being liked
 * @returns {Promise<boolean>} True if likes
 */
export const checkUserLike = async (likerUserId, likedUserId) => {
  try {
    const likeDocRef = doc(db, 'users', likedUserId, 'likes', likerUserId);
    const likeSnap = await getDoc(likeDocRef);
    return likeSnap.exists();
  } catch (err) {
    console.error('Error checking like status:', err);
    return false;
  }
};

/**
 * Toggle user like using transactions (like posts do)
 * @param {string} likerUserId - User doing the liking
 * @param {string} likedUserId - User to like/unlike
 * @returns {Promise<boolean>} True if now liked, false if unliked
 */
export const toggleUserLike = async (likerUserId, likedUserId) => {
  if (likerUserId === likedUserId) {
    throw new Error('Cannot like yourself');
  }

  try {
    console.log('Toggling like from', likerUserId, 'to', likedUserId);
    const likeDocRef = doc(db, 'users', likedUserId, 'likes', likerUserId);
    const likedUserRef = doc(db, 'users', likedUserId);

    let isNowLiked = false;

    await runTransaction(db, async (transaction) => {
      const likeSnap = await transaction.get(likeDocRef);
      const userSnap = await transaction.get(likedUserRef);

      if (likeSnap.exists()) {
        // Unlike
        console.log('Unliking...');
        transaction.delete(likeDocRef);
        transaction.update(likedUserRef, {
          likeCount: Math.max((userSnap.data()?.likeCount || 0) - 1, 0),
        });
        isNowLiked = false;
      } else {
        // Like
        console.log('Liking...');
        transaction.set(likeDocRef, { userId: likerUserId, createdAt: serverTimestamp() });
        transaction.update(likedUserRef, {
          likeCount: (userSnap.data()?.likeCount || 0) + 1,
        });
        isNowLiked = true;
      }
    });

    console.log('Like toggle completed, isNowLiked:', isNowLiked);
    return isNowLiked;
  } catch (err) {
    console.error('Error toggling like:', err);
    throw err;
  }
};

// Legacy functions (kept for compatibility, but use new methods above)
export const addUserLike = async (likerUserId, likedUserId) => {
  const isNowLiked = await toggleUserLike(likerUserId, likedUserId);
  if (!isNowLiked) {
    // Was unliked, so try again to like
    return toggleUserLike(likerUserId, likedUserId);
  }
};

export const removeUserLike = async (likerUserId, likedUserId) => {
  const isNowLiked = await toggleUserLike(likerUserId, likedUserId);
  if (isNowLiked) {
    // Was liked, so try again to unlike
    return toggleUserLike(likerUserId, likedUserId);
  }
};
