/*
Migration script: populate `sellerAvatarUrl` on existing `listings` documents

Usage:
1. Create a Firebase service account JSON and set the env var (PowerShell):
   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccountKey.json"

2. Install dependency (if not installed):
   npm install firebase-admin

3. Dry-run to see proposed updates:
   node scripts/migrateAddSellerAvatar.js --dry-run

4. Run to apply changes:
   node scripts/migrateAddSellerAvatar.js

Notes:
- The script reads all documents in `listings` and updates those missing `sellerAvatarUrl`.
- Run where you have permission to read `users/{uid}` and write `listings/{id}` (e.g., local machine with service account).
- For large collections, consider running with pagination or from a Cloud Function.
*/

const admin = require('firebase-admin');
const argv = require('minimist')(process.argv.slice(2));

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

  const listingsSnap = await db.collection('listings').get();
  console.log(`Found ${listingsSnap.size} listings. Scanning for missing sellerAvatarUrl...`);

  let checked = 0;
  let updated = 0;
  let skippedNoSeller = 0;
  let noAvatarOnUser = 0;

  for (const doc of listingsSnap.docs) {
    checked++;
    const data = doc.data();
    if (data.sellerAvatarUrl) continue; // already has avatar
    if (!data.sellerId) { skippedNoSeller++; continue; }

    try {
      const userRef = db.collection('users').doc(data.sellerId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) { noAvatarOnUser++; continue; }
      const avatarUrl = userSnap.get('avatarUrl');
      if (!avatarUrl) { noAvatarOnUser++; continue; }

      console.log(`[+] Will set sellerAvatarUrl for listing ${doc.id} -> ${avatarUrl}`);
      if (!dryRun) {
        await doc.ref.update({ sellerAvatarUrl: avatarUrl });
        updated++;
      }
    } catch (err) {
      console.error(`Error processing listing ${doc.id}:`, err.message || err);
    }
  }

  console.log('--- Migration summary ---');
  console.log('Listings scanned:', checked);
  console.log('Listings updated:', updated);
  console.log('Listings skipped (no sellerId):', skippedNoSeller);
  console.log('Listings with no avatar on user:', noAvatarOnUser);
  console.log('Done.');
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
