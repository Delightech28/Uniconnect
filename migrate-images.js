// Migration script to update existing listings with imageUrls
// Run this in Firebase Functions or as a one-time script

import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase-admin/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase-admin/storage";
import { initializeApp } from "firebase-admin/app";

const app = initializeApp();
const db = getFirestore(app);
const storage = getStorage(app);

export const migrateListingImages = async () => {
  const listingsRef = collection(db, "listings");
  const snapshot = await getDocs(listingsRef);

  for (const listingDoc of snapshot.docs) {
    const data = listingDoc.data();

    // If listing has images array but no imageUrls, migrate
    if (
      data.images &&
      data.images.length > 0 &&
      (!data.imageUrls || data.imageUrls.length === 0)
    ) {
      console.log(`Migrating listing ${listingDoc.id}`);

      const imageUrls = [];

      // For each base64 image, convert and upload to storage
      for (let i = 0; i < data.images.length; i++) {
        const imageData = data.images[i];

        // Check if it's base64 data URL
        if (imageData && imageData.startsWith("data:image/")) {
          try {
            // Extract base64 data
            const base64Data = imageData.split(",")[1];
            const mimeType = imageData.split(":")[1].split(";")[0];
            const extension = mimeType.split("/")[1];

            // Convert base64 to buffer
            const buffer = Buffer.from(base64Data, "base64");

            // Upload to storage
            const storageRef = ref(
              storage,
              `listings/${listingDoc.id}/images/image_${i}.${extension}`,
            );
            await uploadBytes(storageRef, buffer, { contentType: mimeType });
            const downloadURL = await getDownloadURL(storageRef);

            imageUrls.push(downloadURL);
          } catch (error) {
            console.error(
              `Failed to migrate image ${i} for listing ${listingDoc.id}:`,
              error,
            );
          }
        }
      }

      // Update the listing with imageUrls
      if (imageUrls.length > 0) {
        await updateDoc(doc(db, "listings", listingDoc.id), {
          imageUrls,
          // Keep images field for backward compatibility
        });
        console.log(
          `Updated listing ${listingDoc.id} with ${imageUrls.length} images`,
        );
      }
    }
  }

  console.log("Migration completed");
};
