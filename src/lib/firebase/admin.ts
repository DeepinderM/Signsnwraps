import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Credentials, in order of preference:
// - Firebase App Hosting / Cloud Run: FIREBASE_CONFIG + the runtime service account (no keys needed).
// - Local: FIREBASE_SERVICE_ACCOUNT_KEY (service account JSON) or `gcloud auth application-default login`
//   with NEXT_PUBLIC_FIREBASE_PROJECT_ID set.
export function isFirebaseConfigured() {
  return Boolean(process.env.FIREBASE_CONFIG || process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIRESTORE_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  if (process.env.FIREBASE_CONFIG && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return initializeApp();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  return initializeApp({ credential: serviceAccount ? cert(JSON.parse(serviceAccount)) : applicationDefault(), projectId, storageBucket });
}

export const db = () => getFirestore(adminApp());
export const adminAuth = () => getAuth(adminApp());
export const bucket = () => getStorage(adminApp()).bucket();
