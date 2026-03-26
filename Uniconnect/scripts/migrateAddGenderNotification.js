/*
Migration script: Send gender selection notification to all users without gender

Usage:
1. Create a Firebase service account JSON and set the env var (PowerShell):
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccountKey.json"

2. Install dependency (if not installed):
   npm install firebase-admin

3. Dry-run to see which users would be notified:
   node scripts/migrateAddGenderNotification.js --dry-run

4. Run to send notifications:
   node scripts/migrateAddGenderNotification.js

Notes:
- The script reads all users and creates notifications for those without a gender field
- Notifications are created in users/{uid}/notifications subcollection
- Run where you have permission to read/write user documents (e.g., local machine with service account)
- For production use, consider running from a Cloud Function with proper error handling
*/

import admin from 'firebase-admin';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

const dryRun = !!argv['dry-run'] || !!argv['dryrun'];

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS not set. Set it to your service account JSON path.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function main() {
  console.log('Starting migration. dryRun=', dryRun);

  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} users. Scanning for missing gender field...`);

  let checked = 0;
  let notified = 0;
  let alreadyHasGender = 0;

  for (const userDoc of usersSnap.docs) {
    checked++;
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Skip if user already has gender set
    if (userData.gender) {
      alreadyHasGender++;
      console.log(`✓ User ${userId} already has gender: ${userData.gender}`);
      continue;
    }

    // Create notification for user to select gender
    const notificationData = {
      type: 'gender_selection_required',
      title: 'Complete Your Profile',
      message: 'Please select your gender to complete your profile. This helps us personalize your experience.',
      action: 'select_gender',
      actionUrl: '/edit-profile',
      unread: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      priority: 'high',
    };

    if (dryRun) {
      console.log(`[DRY-RUN] Would notify user ${userId} to select gender`);
      console.log(`  Notification data:`, notificationData);
      notified++;
    } else {
      try {
        await db.collection('users').doc(userId).collection('notifications').add(notificationData);
        console.log(`✓ Notified user ${userId} to select gender`);
        notified++;
      } catch (err) {
        console.error(`✗ Failed to notify user ${userId}:`, err.message);
      }
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Total users checked: ${checked}`);
  console.log(`Users already with gender: ${alreadyHasGender}`);
  console.log(`Users notified (or would be notified): ${notified}`);
  console.log(`Dry run: ${dryRun}`);

  if (dryRun) {
    console.log('\nRun without --dry-run to apply changes');
  } else {
    console.log('\nNotifications have been sent to users!');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
