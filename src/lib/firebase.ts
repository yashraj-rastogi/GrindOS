// ============================================================
// GrindOS — Firebase Configuration
// ============================================================
// Environment variables are loaded from .env (Vite's VITE_ prefix)

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialize if config is present (allows local-only mode without Firebase)
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

export const app = hasConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const firestore = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence for Firestore
if (firestore) {
  enableIndexedDbPersistence(firestore).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Multiple tabs open — persistence only available in one tab.');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Browser does not support offline persistence.');
    }
  });
}

/**
 * Returns true if Firebase is configured and available.
 */
export function isFirebaseConfigured(): boolean {
  return !!app;
}
