// Firebase initialization for UniConnect
// Replace the VITE_FIREBASE_* values in your .env file or fill the
// config object below with your Firebase project's config values.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

// Load config from Vite environment variables. Require a real API key to avoid
// sending a placeholder to the Firebase REST endpoints (causes 400 / invalid key).
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (!apiKey) {
  throw new Error(
    'Missing VITE_FIREBASE_API_KEY. Add your Firebase API key to the project .env as VITE_FIREBASE_API_KEY.'
  );
}

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
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
