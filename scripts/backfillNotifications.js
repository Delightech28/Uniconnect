/**
 * Backfill Notifications Migration Script
 * 
 * This script creates notifications for existing users based on their interactions:
 * - Welcome notification for all users
 * - Connection request received notifications
 * - Profile likes notifications
 * - Messages/conversations
 * - Posts created
 * 
 * Usage:
 *   node scripts/backfillNotifications.js [--dry-run] [--limit N] [--user UID]
 * 
 * Options:
 *   --dry-run         Show what would be created without making changes
 *   --limit N         Process only first N users
 *   --user UID        Process only a specific user UID
 */

import admin from 'firebase-admin';
import minimist from 'minimist';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { readFileSync } = await import('fs');

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  boolean: ['dry-run'],
  string: ['limit', 'user'],
});

const dryRun = argv['dry-run'] || false;
const limitUsers = argv.limit ? parseInt(argv.limit, 10) : null;
const targetUser = argv.user || null;

// Initialize Firebase Admin
let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    console.log(`Loading Firebase credentials from: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  } catch (err) {
    console.error('Error loading service account key:', err.message);
    process.exit(1);
  }
} else {
  const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } catch (err) {
    console.error('Error loading service account key:', err.message);
    console.error('Please either:');
    console.error('  1. Place serviceAccountKey.json in the project root, OR');
    console.error('  2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const NOTIFICATION_CONFIG = {
  system_announcement: {
    icon: 'campaign',
    iconBg: 'bg-slate-500/10 dark:bg-slate-400/20',
    iconColor: 'text-slate-500 dark:text-slate-400',
  },
  connection_request: {
    icon: 'person_add',
    iconBg: 'bg-blue-500/10 dark:bg-blue-400/20',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  user_liked_you: {
    icon: 'favorite',
    iconBg: 'bg-red-500/10 dark:bg-red-400/20',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  new_message: {
    icon: 'chat',
    iconBg: 'bg-purple-500/10 dark:bg-purple-400/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
};

/**
 * Create a notification in Firestore
 */
async function createNotificationInDb(userId, type, title, description, metadata = {}) {
  try {
    const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.system_announcement;
    
    await db.collection('users').doc(userId).collection('notifications').add({
      type,
      title,
      description,
      ...config,
      metadata,
      unread: true,
      createdAt: admin.firestore.Timestamp.now(),
    });
    
    return true;
  } catch (error) {
    console.error(`Error creating notification for ${userId}:`, error.message);
    return false;
  }
}

/**
 * Main migration function
 */
async function backfillNotifications() {
  try {
    console.log('='.repeat(60));
    console.log('BACKFILL NOTIFICATIONS MIGRATION');
    console.log('='.repeat(60));
    console.log(`Dry Run: ${dryRun}`);
    console.log(`Limit: ${limitUsers || 'None'}`);
    console.log(`Target User: ${targetUser || 'All users'}`);
    console.log('='.repeat(60));

    let usersRef = db.collection('users');
    let userSnapshots;

    if (targetUser) {
      userSnapshots = await usersRef.where('__name__', '==', targetUser).limit(1).get();
    } else {
      userSnapshots = await usersRef.limit(limitUsers || 1000).get();
    }

    console.log(`\nProcessing ${userSnapshots.size} users...\n`);

    let processedCount = 0;
    let welcomeCreated = 0;
    let connectionRequestsCreated = 0;
    let likeNotificationsCreated = 0;
    let messageNotificationsCreated = 0;

    for (const userDoc of userSnapshots.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // Check if user already has a welcome notification
        const existingNotifications = await db
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .limit(1)
          .get();

        if (existingNotifications.empty) {
          // Create welcome notification
          if (!dryRun) {
            await createNotificationInDb(
              userId,
              'system_announcement',
              'Welcome to UniConnect! 🎉',
              'You\'re now part of a vibrant community of students and peers. Explore the marketplace, connect with classmates, and join StudyHub to ace your exams!',
              { type: 'welcome' }
            );
          }
          console.log(`✓ Welcome notification created for user: ${userId}`);
          welcomeCreated++;
        }

        // Backfill connection request notifications from connectionRequests subcollection
        const connectionRequests = await db
          .collection('users')
          .doc(userId)
          .collection('connectionRequests')
          .get();

        for (const connReqDoc of connectionRequests.docs) {
          const requesterId = connReqDoc.id;
          const requesterDoc = await db.collection('users').doc(requesterId).get();
          
          if (requesterDoc.data()) {
            const requesterData = requesterDoc.data();
            
            // Check if notification already exists for this requester
            const existingNotif = await db
              .collection('users')
              .doc(userId)
              .collection('notifications')
              .where('metadata.userId', '==', requesterId)
              .where('type', '==', 'connection_request')
              .limit(1)
              .get();

            if (existingNotif.empty) {
              if (!dryRun) {
                await createNotificationInDb(
                  userId,
                  'connection_request',
                  `${requesterData.displayName || 'Someone'} sent you a connection request`,
                  `${requesterData.displayName || 'A user'} wants to connect with you. Accept or decline their request.`,
                  {
                    userId: requesterId,
                    requesterName: requesterData.displayName || 'User',
                    requesterAvatar: requesterData.avatarUrl || null,
                  }
                );
              }
              connectionRequestsCreated++;
            }
          }
        }

        // Backfill profile like notifications from likes subcollection
        const likes = await db
          .collection('users')
          .doc(userId)
          .collection('likes')
          .get();

        for (const likeDoc of likes.docs) {
          const likerId = likeDoc.id;
          const likerDoc = await db.collection('users').doc(likerId).get();
          
          if (likerDoc.data()) {
            const likerData = likerDoc.data();
            
            // Check if notification already exists for this liker
            const existingNotif = await db
              .collection('users')
              .doc(userId)
              .collection('notifications')
              .where('metadata.userId', '==', likerId)
              .where('type', '==', 'user_liked_you')
              .limit(1)
              .get();

            if (existingNotif.empty) {
              if (!dryRun) {
                await createNotificationInDb(
                  userId,
                  'user_liked_you',
                  `${likerData.displayName || 'Someone'} liked your profile!`,
                  `${likerData.displayName || 'A user'} just liked your profile. Check it out!`,
                  {
                    userId: likerId,
                    likerName: likerData.displayName || 'User',
                    likerAvatar: likerData.avatarUrl || null,
                  }
                );
              }
              likeNotificationsCreated++;
            }
          }
        }

        // Backfill message notifications from conversations
        const conversations = await db
          .collection('conversations')
          .where('participants', 'array-contains', userId)
          .get();

        for (const convoDoc of conversations.docs) {
          const convoData = convoDoc.data();
          const otherParticipant = convoData.participants?.find(p => p !== userId);

          if (otherParticipant) {
            const otherUserDoc = await db.collection('users').doc(otherParticipant).get();
            
            if (otherUserDoc.data()) {
              const otherUserData = otherUserDoc.data();
              const messages = await db
                .collection('conversations')
                .doc(convoDoc.id)
                .collection('messages')
                .where('senderId', '==', otherParticipant)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

              if (!messages.empty) {
                const lastMessage = messages.docs[0];
                const msgData = lastMessage.data();

                // Check if notification already exists for this conversation
                const existingNotif = await db
                  .collection('users')
                  .doc(userId)
                  .collection('notifications')
                  .where('metadata.conversationId', '==', convoDoc.id)
                  .where('type', '==', 'new_message')
                  .limit(1)
                  .get();

                if (existingNotif.empty) {
                  if (!dryRun) {
                    await createNotificationInDb(
                      userId,
                      'new_message',
                      `New Message from ${otherUserData.displayName || 'User'}`,
                      `"${(msgData.text || '').substring(0, 50)}${msgData.text && msgData.text.length > 50 ? '...' : ''}"`,
                      {
                        conversationId: convoDoc.id,
                        senderId: otherParticipant,
                        senderName: otherUserData.displayName || 'User',
                        senderAvatar: otherUserData.avatarUrl || null,
                      }
                    );
                  }
                  messageNotificationsCreated++;
                }
              }
            }
          }
        }

        processedCount++;
      } catch (err) {
        console.error(`✗ Error processing user ${userId}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Users processed: ${processedCount}`);
    console.log(`Welcome notifications created: ${welcomeCreated}`);
    console.log(`Connection request notifications created: ${connectionRequestsCreated}`);
    console.log(`Profile like notifications created: ${likeNotificationsCreated}`);
    console.log(`Message notifications created: ${messageNotificationsCreated}`);
    console.log(`Total notifications created: ${welcomeCreated + connectionRequestsCreated + likeNotificationsCreated + messageNotificationsCreated}`);
    console.log(`Status: ${dryRun ? 'DRY RUN (no changes made)' : 'COMPLETE'}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Run migration
backfillNotifications();
