// Firebase initialization for UniConnect
// Replace the VITE_FIREBASE_* values in your .env file or fill the
// config object below with your Firebase project's config values.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '<YOUR_API_KEY>',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '<YOUR_AUTH_DOMAIN>',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '<YOUR_PROJECT_ID>',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '<YOUR_STORAGE_BUCKET>',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '<YOUR_MESSAGING_SENDER_ID>',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '<YOUR_APP_ID>'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in the browser and when measurement id is present
if (typeof window !== 'undefined' && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  try {
    getAnalytics(app);
  } catch (e) {
    // Analytics may throw in some environments (server-side or blocked), fail silently
    // console.warn('Analytics not initialized', e);
  }
}

// Exports for auth, firestore and storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
