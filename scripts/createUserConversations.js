/*
  Migration helper: mirror `conversations` into `users/{userId}/conversations/{convoId}`

  Why: provides a per-user collection that always contains every conversation the user has been in,
  making it trivial to fetch "all conversations a user has ever had" without complex client queries.

  Usage:
  1. Create a Firebase service account JSON and save it locally (e.g. serviceAccountKey.json).
  2. Set the environment variable GOOGLE_APPLICATION_CREDENTIALS to the path, or pass the key directly.
  3. Install dependencies: `npm install firebase-admin` (run in project root)
  4. Run: `node scripts/createUserConversations.js`

  Note: This script writes to your Firestore. Review and run in a safe environment (staging) first.
*/

import admin from 'firebase-admin';

// If you have a service account key file, point to it here or set GOOGLE_APPLICATION_CREDENTIALS
// admin.initializeApp({ credential: admin.credential.cert(await import('../path/to/serviceAccountKey.json')) });

admin.initializeApp();
const db = admin.firestore();
async function mirrorConversations({ dryRun = false, limit = 0, targetUser = null } = {}) {
  console.log('Starting conversation mirror...', { dryRun, limit: limit || 'all', targetUser });
  let q = db.collection('conversations').orderBy('lastTimestamp', 'desc');
  if (limit && Number(limit) > 0) q = q.limit(Number(limit));
  const convSnap = await q.get();
  console.log(`Found ${convSnap.size} conversations (fetched)`);

  let processed = 0;
  for (const doc of convSnap.docs) {
    const convo = doc.data();
    const convoId = doc.id;
    const participants = convo.participants || [];

    const payload = {
      convoId,
      participants,
      lastMessage: convo.lastMessage || '',
      lastTimestamp: convo.lastTimestamp || null,
      lastSenderId: convo.lastSenderId || null,
      unreadCount: convo.unreadCount || 0,
    };

    // If targetUser provided, only write for that user (and skip others)
    const targets = targetUser ? participants.filter(u => u === targetUser) : participants;

    for (const uid of targets) {
      const ref = db.collection('users').doc(uid).collection('conversations').doc(convoId);
      try {
        if (dryRun) {
          console.log('[dry-run] would write', ref.path, payload);
        } else {
          await ref.set(payload, { merge: true });
          console.log('wrote', ref.path);
        }
      } catch (err) {
        console.error('Failed to write for user', uid, err);
      }
    }

    processed++;
    if (processed % 50 === 0) console.log(`Processed ${processed} conversations...`);
  }

  console.log('Mirror complete. Total processed:', processed);
}

// CLI arg parsing
const args = process.argv.slice(2);
const argv = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry-run') argv.dryRun = true;
  if (a === '--limit' && args[i+1]) { argv.limit = Number(args[i+1]); i++; }
  if (a === '--user' && args[i+1]) { argv.targetUser = args[i+1]; i++; }
}

mirrorConversations(argv).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
