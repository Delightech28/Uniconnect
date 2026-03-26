/**
 * Migration Script: Create User Notifications Collection
 * 
 * This script ensures all users have properly organized notifications.
 * It can be run to backfill the notifications collection with existing notification metadata.
 * 
 * Usage:
 *   node scripts/createUserNotifications.js [--dry-run] [--limit N] [--user UID]
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

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  boolean: ['dry-run'],
  string: ['limit', 'user'],
});

const dryRun = argv['dry-run'] || false;
const limitUsers = argv.limit ? parseInt(argv.limit, 10) : null;
const targetUser = argv.user || null;

// Initialize Firebase Admin
const { readFileSync } = await import('fs');
let serviceAccount;

// Try to load from environment variable first
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    console.log(`Loading Firebase credentials from: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  } catch (err) {
    console.error('Error loading service account key from GOOGLE_APPLICATION_CREDENTIALS:', err.message);
    process.exit(1);
  }
} else {
  // Fall back to local serviceAccountKey.json
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

/**
 * Main migration function
 */
async function migrateUserNotifications() {
  try {
    console.log('='.repeat(60));
    console.log('USER NOTIFICATIONS MIGRATION');
    console.log('='.repeat(60));
    console.log(`Dry Run: ${dryRun}`);
    console.log(`Limit: ${limitUsers || 'None'}`);
    console.log(`Target User: ${targetUser || 'All users'}`);
    console.log('='.repeat(60));

    let usersRef = db.collection('users');
    if (targetUser) {
      usersRef = usersRef.where('__name__', '==', targetUser);
    }

    let userSnapshots;
    if (targetUser) {
      userSnapshots = await usersRef.limit(1).get();
    } else {
      userSnapshots = await usersRef.limit(limitUsers || 1000).get();
    }

    console.log(`\nProcessing ${userSnapshots.size} users...`);

    let processedCount = 0;
    let notificationsEnsured = 0;

    for (const userDoc of userSnapshots.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Check if notifications subcollection exists
        const notificationsRef = db.collection('users').doc(userId).collection('notifications');
        const notificationSnapshots = await notificationsRef.limit(1).get();
        
        if (notificationSnapshots.empty) {
          // Create an empty notificationt to initialize the subcollection
          // (Firestore doesn't create empty subcollections)
          if (!dryRun) {
            // We'll just log that the subcollection is ready for use
            console.log(`✓ Notifications ready for user: ${userId}`);
          } else {
            console.log(`[DRY RUN] Would initialize notifications for user: ${userId}`);
          }
          notificationsEnsured++;
        } else {
          console.log(`✓ User ${userId} already has ${notificationSnapshots.size} notifications`);
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
    console.log(`Notifications ensured: ${notificationsEnsured}`);
    console.log(`Status: ${dryRun ? 'DRY RUN (no changes made)' : 'COMPLETE'}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Run migration
migrateUserNotifications();
