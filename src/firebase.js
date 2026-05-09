// Firebase initialization for UniConnect
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (!apiKey) {
  throw new Error(
    "Missing VITE_FIREBASE_API_KEY. Add your Firebase API key to the project .env as VITE_FIREBASE_API_KEY.",
  );
}

const firebaseConfig = {
  apiKey,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "",
};

const app = initializeApp(firebaseConfig);

// ─── Firebase App Check ───────────────────────────────────────────────────────
// App Check proves to Firebase that requests come from YOUR app, not a bot or
// scraped API call. It wraps every Firestore / Storage / Functions request with
// a reCAPTCHA v3 token that Firebase verifies server-side.
//
// Setup steps (one-time):
//  1. Go to Firebase Console → App Check → Register your app
//  2. Choose "reCAPTCHA v3" as the provider
//  3. Copy the reCAPTCHA v3 SITE KEY into .env as VITE_RECAPTCHA_SITE_KEY
//  4. In the App Check console, click "Enforce" for Firestore, Storage, Functions
//
// During local development you can use the debug token instead of reCAPTCHA:
//   self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;  ← add this to index.html <script>
//   Then copy the printed debug token into Firebase Console → App Check → Apps → Add debug token
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    // Automatically refresh the token before it expires
    isTokenAutoRefreshEnabled: true,
  });
} else if (import.meta.env.DEV) {
  // In local dev without a reCAPTCHA key, App Check is simply skipped.
  // Add VITE_RECAPTCHA_SITE_KEY to .env to test the full flow locally
  // (use a debug token in Firebase Console for localhost).
  console.warn(
    "[AppCheck] VITE_RECAPTCHA_SITE_KEY not set — App Check is disabled. " +
    "Add the key to .env to enable protection."
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
if (typeof window !== "undefined" && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  try {
    getAnalytics(app);
  } catch {
    // Analytics may throw in some environments (server-side or blocked), fail silently
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export const auth      = getAuth(app);
export const db        = getFirestore(app);
export const storage   = getStorage(app);
export const functions = getFunctions(app);

export default app;
