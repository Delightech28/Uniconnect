/**
 * Notification Service
 * Handles creation, retrieval, and management of user notifications
 * Integrates with Firebase Firestore for real-time updates
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  limit,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Track active conversation views in memory
 * Maps conversationId => Set of userIds currently viewing it
 */
const activeConversationViews = new Map();

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  // Marketplace
  ITEM_LISTED: 'item_listed',
  OFFER_RECEIVED: 'offer_received',
  OFFER_ACCEPTED: 'offer_accepted',
  ITEM_SOLD: 'item_sold',
  ITEM_PURCHASE: 'item_purchase',
  
  // Messaging
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'message_read',
  
  // Verification
  VERIFICATION_SUBMITTED: 'verification_submitted',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  VERIFICATION_REMINDER: 'verification_reminder',
  
  // Study
  NEW_QUIZ: 'new_quiz',
  QUIZ_RESULTS: 'quiz_results',
  DOCUMENT_UPLOADED: 'document_uploaded',
  
  // Social
  NEW_FOLLOWER: 'new_follower',
  POST_LIKED: 'post_liked',
  POST_COMMENTED: 'post_commented',
  USER_LIKED_YOU: 'user_liked_you',
  CONNECTION_REQUEST: 'connection_request',
  
  // Referral
  REFERRAL_JOINED: 'referral_joined',
  REFERRAL_REWARD: 'referral_reward',
  
  // System
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
};

/**
 * Notification metadata configuration
 */
const NOTIFICATION_CONFIG = {
  item_listed: {
    icon: 'shopping_bag',
    iconBg: 'bg-blue-500/10 dark:bg-blue-400/20',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  offer_received: {
    icon: 'local_offer',
    iconBg: 'bg-orange-500/10 dark:bg-orange-400/20',
    iconColor: 'text-orange-500 dark:text-orange-400',
  },
  offer_accepted: {
    icon: 'check_circle',
    iconBg: 'bg-green-500/10 dark:bg-green-400/20',
    iconColor: 'text-green-500 dark:text-green-400',
  },
  item_sold: {
    icon: 'receipt_long',
    iconBg: 'bg-green-500/10 dark:bg-green-400/20',
    iconColor: 'text-green-500 dark:text-green-400',
  },
  item_purchase: {
    icon: 'shopping_cart_checkout',
    iconBg: 'bg-green-500/10 dark:bg-green-400/20',
    iconColor: 'text-green-500 dark:text-green-400',
  },
  new_message: {
    icon: 'chat',
    iconBg: 'bg-purple-500/10 dark:bg-purple-400/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
  verification_submitted: {
    icon: 'hourglass_empty',
    iconBg: 'bg-yellow-500/10 dark:bg-yellow-400/20',
    iconColor: 'text-yellow-500 dark:text-yellow-400',
  },
  verification_approved: {
    icon: 'verified_user',
    iconBg: 'bg-green-500/10 dark:bg-green-400/20',
    iconColor: 'text-green-500 dark:text-green-400',
  },
  verification_rejected: {
    icon: 'block',
    iconBg: 'bg-red-500/10 dark:bg-red-400/20',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  verification_reminder: {
    icon: 'warning',
    iconBg: 'bg-red-500/10 dark:bg-red-400/20',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  new_quiz: {
    icon: 'school',
    iconBg: 'bg-purple-500/10 dark:bg-purple-400/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
  quiz_results: {
    icon: 'assignment',
    iconBg: 'bg-blue-500/10 dark:bg-blue-400/20',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  new_follower: {
    icon: 'person_add',
    iconBg: 'bg-pink-500/10 dark:bg-pink-400/20',
    iconColor: 'text-pink-500 dark:text-pink-400',
  },
  post_liked: {
    icon: 'favorite',
    iconBg: 'bg-red-500/10 dark:bg-red-400/20',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  post_commented: {
    icon: 'comment',
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-400/20',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
  },
  user_liked_you: {
    icon: 'favorite',
    iconBg: 'bg-red-500/10 dark:bg-red-400/20',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  connection_request: {
    icon: 'person_add',
    iconBg: 'bg-blue-500/10 dark:bg-blue-400/20',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  referral_joined: {
    icon: 'person_add',
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-400/20',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
  },
  referral_reward: {
    icon: 'card_giftcard',
    iconBg: 'bg-amber-500/10 dark:bg-amber-400/20',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  system_announcement: {
    icon: 'campaign',
    iconBg: 'bg-slate-500/10 dark:bg-slate-400/20',
    iconColor: 'text-slate-500 dark:text-slate-400',
  },
};

/**
 * ========== CONVERSATION ACTIVITY TRACKING ==========
 * These functions track which users are actively viewing which conversations
 * to avoid sending notifications when the recipient is already viewing the chat
 */

/**
 * Mark a user as actively viewing a conversation
 * Call this when user opens/focuses a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 */
export const trackConversationView = (conversationId, userId) => {
  if (!activeConversationViews.has(conversationId)) {
    activeConversationViews.set(conversationId, new Set());
  }
  activeConversationViews.get(conversationId).add(userId);
  console.log(`User ${userId} now viewing conversation ${conversationId}`);
};

/**
 * Unmark a user from viewing a conversation
 * Call this when user closes/unfocuses a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 */
export const untrackConversationView = (conversationId, userId) => {
  if (activeConversationViews.has(conversationId)) {
    activeConversationViews.get(conversationId).delete(userId);
    if (activeConversationViews.get(conversationId).size === 0) {
      activeConversationViews.delete(conversationId);
    }
  }
  console.log(`User ${userId} stopped viewing conversation ${conversationId}`);
};

/**
 * Check if a user is currently actively viewing a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {boolean} - True if user is actively viewing
 */
export const isUserViewingConversation = (conversationId, userId) => {
  return activeConversationViews.has(conversationId) && 
         activeConversationViews.get(conversationId).has(userId);
};

/**
 * Create a notification in Firestore
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {Object} metadata - Additional metadata (productId, senderId, etc.)
 * @returns {Promise<string>} - Document ID of created notification
 */
export const createNotification = async (
  userId,
  type,
  title,
  description,
  metadata = {}
) => {
  try {
    console.log(`Creating ${type} notification for user ${userId}:`, { title, description, metadata });
    const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.system_announcement;

    const notificationRef = await addDoc(
      collection(db, 'users', userId, 'notifications'),
      {
        type,
        title,
        description,
        ...config,
        metadata,
        unread: true,
        createdAt: serverTimestamp(),
      }
    );

    console.log(`Notification created with ID: ${notificationRef.id}`);
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for item sold scenario
 * @param {string} sellerId - Seller user ID
 * @param {string} buyerId - Buyer user ID
 * @param {Object} productData - Product details
 * @param {number} price - Sale price
 */
export const notifyItemSold = async (sellerId, buyerId, productData, price) => {
  try {
    // Notify seller
    await createNotification(
      sellerId,
      NOTIFICATION_TYPES.ITEM_SOLD,
      `Item Sold: "${productData.name}"`,
      `Your item has been sold! ₦${price.toLocaleString()} has been credited to your UniWallet.`,
      {
        productId: productData.id,
        productName: productData.name,
        buyerId,
        price,
      }
    );

    // Notify buyer
    await createNotification(
      buyerId,
      NOTIFICATION_TYPES.ITEM_PURCHASE,
      `Purchase Confirmed: "${productData.name}"`,
      `You have successfully purchased "${productData.name}" for ₦${price.toLocaleString()}.`,
      {
        productId: productData.id,
        productName: productData.name,
        sellerId,
        price,
      }
    );
  } catch (error) {
    console.error('Error notifying item sold:', error);
  }
};

/**
 * Notify when item is listed
 * @param {string} userId - User ID
 * @param {Object} itemData - Item details
 */
export const notifyItemListed = async (userId, itemData) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.ITEM_LISTED,
      `Item Listed: "${itemData.name}"`,
      `Your item "${itemData.name}" has been listed successfully and is now visible to buyers.`,
      {
        productId: itemData.id,
        productName: itemData.name,
        price: itemData.price,
        category: itemData.category,
      }
    );
  } catch (error) {
    console.error('Error notifying item listed:', error);
  }
};

/**
 * Notify when offer is received
 * @param {string} sellerId - Seller user ID
 * @param {Object} offerData - Offer details
 */
export const notifyOfferReceived = async (sellerId, offerData) => {
  try {
    await createNotification(
      sellerId,
      NOTIFICATION_TYPES.OFFER_RECEIVED,
      `New Offer on "${offerData.productName}"`,
      `You've received a new offer of ₦${offerData.offerPrice.toLocaleString()} for your listing. Respond now to complete the sale.`,
      {
        productId: offerData.productId,
        productName: offerData.productName,
        buyerId: offerData.buyerId,
        offerPrice: offerData.offerPrice,
        offerId: offerData.offerId,
      }
    );
  } catch (error) {
    console.error('Error notifying offer received:', error);
  }
};

/**
 * Notify when message is received
 * @param {string} recipientId - Recipient user ID
 * @param {Object} messageData - Message details
 */
export const notifyNewMessage = async (recipientId, messageData) => {
  try {
    // First check an in-memory tracker (fast) and then check Firestore presence doc for the recipient
    // If recipient is actively viewing this conversation, skip notification
    const convoId = messageData.conversationId;
    if (isUserViewingConversation(convoId, recipientId)) {
      console.log(`Skipping notification (in-memory): User ${recipientId} is actively viewing conversation ${convoId}`);
      return;
    }

    // Check Firestore presence doc at conversations/{convoId}/views/{recipientId}
    try {
      const presenceRef = doc(db, 'conversations', convoId, 'views', recipientId);
      const presenceSnap = await getDoc(presenceRef);
      if (presenceSnap.exists()) {
        const lastActive = presenceSnap.data()?.lastActive;
        // Accept either Firestore Timestamp or millis
        const lastMillis = lastActive && lastActive.toMillis ? lastActive.toMillis() : (lastActive || 0);
        const now = Date.now();
        // If user was active in last 10 seconds, skip notification
        if (lastMillis && (now - lastMillis) < 10000) {
          console.log(`Skipping notification (presence): User ${recipientId} recently active in conversation ${convoId}`);
          return;
        }
      }
    } catch (presenceErr) {
      console.warn('Failed to check conversation presence doc:', presenceErr);
      // Fall through and send notification (safer than silently ignoring)
    }

    await createNotification(
      recipientId,
      NOTIFICATION_TYPES.NEW_MESSAGE,
      `New Message from ${messageData.senderName}`,
      `"${messageData.messagePreview || 'New message'}"`,
      {
        conversationId: messageData.conversationId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        senderAvatar: messageData.senderAvatar,
      }
    );
    console.log(`Notification sent to ${recipientId} for new message in conversation ${messageData.conversationId}`);
  } catch (error) {
    console.error('Error notifying new message:', error);
  }
};

/**
 * Notify when verification is submitted
 * @param {string} userId - User ID
 */
export const notifyVerificationSubmitted = async (userId) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.VERIFICATION_SUBMITTED,
      'Verification Submitted',
      'Your student verification has been submitted. Our team will review it within 24-48 hours.',
      { userId }
    );
  } catch (error) {
    console.error('Error notifying verification submitted:', error);
  }
};

/**
 * Notify when verification is approved
 * @param {string} userId - User ID
 */
export const notifyVerificationApproved = async (userId) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.VERIFICATION_APPROVED,
      'Verification Complete',
      'Congratulations! Your student account has been verified. You now have full access to CampusFeed and marketplace features.',
      { userId }
    );
  } catch (error) {
    console.error('Error notifying verification approved:', error);
  }
};

/**
 * Notify when verification is rejected
 * @param {string} userId - User ID
 * @param {string} reason - Rejection reason
 */
export const notifyVerificationRejected = async (userId, reason = '') => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.VERIFICATION_REJECTED,
      'Verification Failed',
      `Your verification was not approved. Reason: ${reason || 'Document quality or information issues. Please resubmit.'}`,
      { userId, reason }
    );
  } catch (error) {
    console.error('Error notifying verification rejected:', error);
  }
};

/**
 * Notify when new quiz is available
 * @param {string} userId - User ID
 * @param {Object} quizData - Quiz details
 */
export const notifyNewQuiz = async (userId, quizData) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.NEW_QUIZ,
      `New Quiz: "${quizData.title}"`,
      `A new quiz "${quizData.title}" has been created. Test your knowledge!`,
      {
        quizId: quizData.id,
        quizTitle: quizData.title,
        module: quizData.module,
      }
    );
  } catch (error) {
    console.error('Error notifying new quiz:', error);
  }
};

/**
 * Notify when referral joins
 * @param {string} userId - User ID
 * @param {Object} referralData - Referral details
 */
export const notifyReferralJoined = async (userId, referralData) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.REFERRAL_JOINED,
      `New Referral: ${referralData.referreeName}`,
      `${referralData.referreeName} joined using your referral link!`,
      {
        referralId: referralData.id,
        refereeName: referralData.referreeName,
        refereeId: referralData.refereeId,
      }
    );
  } catch (error) {
    console.error('Error notifying referral joined:', error);
  }
};

/**
 * Notify when referral reward is earned
 * @param {string} userId - User ID
 * @param {number} reward - Reward amount
 */
export const notifyReferralReward = async (userId, reward) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.REFERRAL_REWARD,
      'Referral Reward Earned',
      `You've earned ₦${reward.toLocaleString()} from a referral bonus!`,
      { reward, userId }
    );
  } catch (error) {
    console.error('Error notifying referral reward:', error);
  }
};

/**
 * Get notifications for a user (one-time fetch)
 * @param {string} userId - User ID
 * @param {number} limitCount - Max number of notifications to fetch
 * @returns {Promise<Array>} - Array of notifications
 */
export const getNotifications = async (userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      time: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'Just now',
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Listen to real-time notifications (for NotificationsPage)
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function with notifications array
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
  try {
    console.log(`Subscribing to notifications for user: ${userId}`);
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        console.log(`Received ${snapshot.size} notifications for user ${userId}`);
        const notifications = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`Notification ${doc.id}:`, { type: data.type, title: data.title });
          return {
            id: doc.id,
            ...data,
            time: data.createdAt
              ? getTimeAgo(new Date(data.createdAt.toDate()))
              : 'Just now',
          };
        });
        callback(notifications);
      },
      (error) => {
        console.error(`Error listening to notifications for user ${userId}:`, error);
        // Call callback with empty array on error to prevent UI from hanging
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up notification subscription:', error);
    return () => {};
  }
};

/**
 * Fetch notifications manually (for debugging)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of notifications
 */
export const fetchNotificationsOnce = async (userId) => {
  try {
    console.log(`Fetching notifications for user: ${userId}`);
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} notifications`);
    
    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log(`Notification ${doc.id}:`, { type: data.type, title: data.title });
      return {
        id: doc.id,
        ...data,
        time: data.createdAt
          ? getTimeAgo(new Date(data.createdAt.toDate()))
          : 'Just now',
      };
    });
    
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with count
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToUnreadCount = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('unread', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  } catch (error) {
    console.error('Error subscribing to unread count:', error);
    return () => {};
  }
};

/**
 * Mark notification as read
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID
 */
export const markAsRead = async (userId, notificationId) => {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notifRef, { unread: false });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Mark all notifications as read
 * @param {string} userId - User ID
 */
export const markAllAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('unread', '==', true)
    );

    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { unread: false })
    );

    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
};

/**
 * Delete a notification
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID
 */
export const deleteNotification = async (userId, notificationId) => {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notifRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

/**
 * Delete all notifications
 * @param {string} userId - User ID
 */
export const deleteAllNotifications = async (userId) => {
  try {
    const q = collection(db, 'users', userId, 'notifications');
    const snapshot = await getDocs(q);

    const deletes = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletes);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
  }
};

/**
 * Helper: Convert timestamp to "X minutes ago" format
 * @param {Date} date - Date object
 * @returns {string} - Time ago string
 */
export const getTimeAgo = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
};

/**
 * ========== EXTENDED NOTIFICATIONS ==========
 */

/**
 * Notify when user creates a post
 * @param {string} userId - User ID
 * @param {Object} postData - Post details
 */
export const notifyPostCreated = async (userId, postData) => {
  try {
    await createNotification(
      userId,
      'system_announcement',
      `Post Published: "${postData.title}"`,
      `Your post "${postData.title}" has been published on CampusFeed. Check out the engagement!`,
      {
        postId: postData.id,
        postTitle: postData.title,
      }
    );
  } catch (error) {
    console.error('Error notifying post created:', error);
  }
};

/**
 * Notify all users (except optionally the author) that a new post was created.
 * Use with caution for large userbases — this does a simple one-time fan-out.
 * @param {Object} postData - { id, title }
 * @param {string} [excludeUserId] - optional userId to exclude (e.g., author)
 */
export const notifyAllUsersPostCreated = async (postData, excludeUserId = null) => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const promises = [];
    usersSnap.forEach((u) => {
      if (excludeUserId && u.id === excludeUserId) return; // skip author if requested
      promises.push(
        createNotification(
          u.id,
          'system_announcement',
          `New Post: "${postData.title}"`,
          `${postData.title} — A new post was published on CampusFeed.`,
          { postId: postData.id, postTitle: postData.title }
        )
      );
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying all users about new post:', error);
  }
};

/**
 * Notify when a post gets liked
 * @param {string} postAuthorId - Post author user ID
 * @param {Object} likeData - Like details
 */
export const notifyPostLiked = async (postAuthorId, likeData) => {
  try {
    await createNotification(
      postAuthorId,
      NOTIFICATION_TYPES.POST_LIKED,
      `${likeData.likerName} liked your post`,
      `"${likeData.postTitle}" received a like from ${likeData.likerName}`,
      {
        postId: likeData.postId,
        postTitle: likeData.postTitle,
        likerId: likeData.likerId,
        likerName: likeData.likerName,
        likerAvatar: likeData.likerAvatar,
      }
    );
  } catch (error) {
    console.error('Error notifying post liked:', error);
  }
};

/**
 * Notify when a post gets commented
 * @param {string} postAuthorId - Post author user ID
 * @param {Object} commentData - Comment details
 */
export const notifyPostCommented = async (postAuthorId, commentData) => {
  try {
    await createNotification(
      postAuthorId,
      NOTIFICATION_TYPES.POST_COMMENTED,
      `${commentData.commenterName} commented on your post`,
      `"${commentData.commentText.substring(0, 50)}..." - ${commentData.commenterName} on "${commentData.postTitle}"`,
      {
        postId: commentData.postId,
        postTitle: commentData.postTitle,
        commentId: commentData.commentId,
        commenterId: commentData.commenterId,
        commenterName: commentData.commenterName,
        commenterAvatar: commentData.commenterAvatar,
        commentText: commentData.commentText,
      }
    );
  } catch (error) {
    console.error('Error notifying post commented:', error);
  }
};

/**
 * Notify when user gets a new follower
 * @param {string} userId - User ID
 * @param {Object} followerData - Follower details
 */
export const notifyNewFollower = async (userId, followerData) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.NEW_FOLLOWER,
      `${followerData.followerName} started following you`,
      `${followerData.followerName} is now following your profile. Check out their profile!`,
      {
        followerId: followerData.followerId,
        followerName: followerData.followerName,
        followerAvatar: followerData.followerAvatar,
      }
    );
  } catch (error) {
    console.error('Error notifying new follower:', error);
  }
};

/**
 * Notify on wallet transaction
 * @param {string} userId - User ID
 * @param {Object} transactionData - Transaction details
 */
export const notifyWalletTransaction = async (userId, transactionData) => {
  try {
    const isDeposit = transactionData.type === 'deposit';
    const icon = isDeposit ? 'card_giftcard' : 'withdraw';
    const action = isDeposit ? 'Deposit' : 'Withdrawal';

    await createNotification(
      userId,
      'system_announcement',
      `${action}: ₦${transactionData.amount.toLocaleString()}`,
      `${action} of ₦${transactionData.amount.toLocaleString()} has been ${isDeposit ? 'added to' : 'withdrawn from'} your wallet. Balance: ₦${transactionData.newBalance.toLocaleString()}`,
      {
        transactionId: transactionData.id,
        amount: transactionData.amount,
        type: transactionData.type,
        newBalance: transactionData.newBalance,
      }
    );
  } catch (error) {
    console.error('Error notifying wallet transaction:', error);
  }
};

/**
 * Notify on payment received
 * @param {string} userId - User ID
 * @param {Object} paymentData - Payment details
 */
export const notifyPaymentReceived = async (userId, paymentData) => {
  try {
    await createNotification(
      userId,
      'receipt_long',
      `Payment Received: ₦${paymentData.amount.toLocaleString()}`,
      `You have received ₦${paymentData.amount.toLocaleString()} from ${paymentData.senderName}. Your new balance: ₦${paymentData.newBalance.toLocaleString()}`,
      {
        paymentId: paymentData.id,
        senderId: paymentData.senderId,
        senderName: paymentData.senderName,
        amount: paymentData.amount,
        newBalance: paymentData.newBalance,
      }
    );
  } catch (error) {
    console.error('Error notifying payment received:', error);
  }
};

/**
 * Notify on payment failure
 * @param {string} userId - User ID
 * @param {Object} failureData - Failure details
 */
export const notifyPaymentFailed = async (userId, failureData) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.VERIFICATION_REJECTED,
      'Payment Failed',
      `Payment of ₦${failureData.amount.toLocaleString()} failed. Reason: ${failureData.reason || 'Insufficient funds or connection issue'}. Please try again.`,
      {
        paymentId: failureData.id,
        amount: failureData.amount,
        reason: failureData.reason,
      }
    );
  } catch (error) {
    console.error('Error notifying payment failed:', error);
  }
};

/**
 * Notify when low wallet balance
 * @param {string} userId - User ID
 * @param {number} balance - Current balance
 */
export const notifyLowBalance = async (userId, balance) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.VERIFICATION_REMINDER,
      'Low Wallet Balance',
      `Your UniWallet balance is low (₦${balance.toLocaleString()}). Top up to continue using marketplace features.`,
      {
        balance,
      }
    );
  } catch (error) {
    console.error('Error notifying low balance:', error);
  }
};

/**
 * Notify about item expiration
 * @param {string} userId - User ID
 * @param {Object} itemData - Item details
 */
export const notifyItemExpiring = async (userId, itemData) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.VERIFICATION_REMINDER,
      `Item Expiring Soon: "${itemData.name}"`,
      `Your listing "${itemData.name}" will expire in 24 hours. Renew or relist to keep it visible.`,
      {
        productId: itemData.id,
        productName: itemData.name,
      }
    );
  } catch (error) {
    console.error('Error notifying item expiring:', error);
  }
};

/**
 * Notify about system announcements
 * @param {string} userId - User ID
 * @param {Object} announcementData - Announcement details
 */
export const notifySystemAnnouncement = async (userId, announcementData) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
      announcementData.title,
      announcementData.description,
      {
        announcementId: announcementData.id,
        link: announcementData.link,
      }
    );
  } catch (error) {
    console.error('Error notifying system announcement:', error);
  }
};

/**
 * Notify about security alerts
 * @param {string} userId - User ID
 * @param {Object} alertData - Alert details
 */
export const notifySecurityAlert = async (userId, alertData) => {
  try {
    await createNotification(
      userId,
      NOTIFICATION_TYPES.VERIFICATION_REJECTED,
      `Security Alert: ${alertData.title}`,
      alertData.description,
      {
        alertType: alertData.type,
        timestamp: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error('Error notifying security alert:', error);
  }
};

/**
* Notify when someone likes the user's profile
* @param {string} userId - User whose profile was liked
* @param {Object} likerData - Liker's details
*/
export const notifyUserLiked = async (userId, likerData) => {
  try {
    console.log(`Creating user_liked_you notification for user: ${userId}`, likerData);
    await createNotification(
      userId,
      'user_liked_you',
      `${likerData.likerName} liked your profile!`,
      `${likerData.likerName} just liked your profile. Check it out!`,
      {
        userId: likerData.likerId,
        likerName: likerData.likerName,
        likerAvatar: likerData.likerAvatar,
      }
    );
    console.log(`User liked notification created successfully for user: ${userId}`);
  } catch (error) {
    console.error('Error notifying user liked:', error);
    throw error;
  }
};

/**
 * Notify on connection request
 * @param {string} userId - User ID receiving the request
 * @param {Object} requesterData - Requester details
 */
export const notifyConnectionRequest = async (userId, requesterData) => {
  try {
    console.log(`Creating connection request notification for user: ${userId}`, requesterData);
    await createNotification(
      userId,
      'connection_request',
      `${requesterData.requesterName} sent you a connection request`,
      `${requesterData.requesterName} wants to connect with you. Accept or decline their request.`,
      {
        userId: requesterData.requesterId,
        requesterName: requesterData.requesterName,
        requesterAvatar: requesterData.requesterAvatar,
      }
    );
    console.log(`Connection request notification created successfully for user: ${userId}`);
  } catch (error) {
    console.error('Error notifying connection request:', error);
    throw error;
  }
};

/**
 * Notify on connection accepted
 * @param {string} userId - User ID whose request was accepted
 * @param {Object} acceptorData - Acceptor details
 */
export const notifyConnectionAccepted = async (userId, acceptorData) => {
  try {
    await createNotification(
      userId,
      'new_follower',
      `${acceptorData.acceptorName} accepted your connection request`,
      `You are now connected with ${acceptorData.acceptorName}. Start engaging!`,
      {
        acceptorId: acceptorData.acceptorId,
        acceptorName: acceptorData.acceptorName,
        acceptorAvatar: acceptorData.acceptorAvatar,
        type: 'connection_accepted',
      }
    );
  } catch (error) {
    console.error('Error notifying connection accepted:', error);
  }
};

/**
* Bulk notify multiple users
* @param {Array<string>} userIds - Array of user IDs
* @param {string} type - Notification type
* @param {string} title - Notification title
* @param {string} description - Notification description
* @param {Object} metadata - Additional metadata
*/
export const bulkNotify = async (userIds, type, title, description, metadata = {}) => {
  try {
    const promises = userIds.map(userId =>
      createNotification(userId, type, title, description, metadata)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error bulk notifying users:', error);
  }
};
