"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

// Public web-app config (safe to expose). On App Hosting these are filled from FIREBASE_WEBAPP_CONFIG in next.config.ts.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

export const isFirebaseClientConfigured = Boolean(config.apiKey && config.authDomain && config.projectId);

const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

export function clientAuth() {
  const existing = getApps()[0];
  const auth = getAuth(existing ?? initializeApp(config));
  // Local development against the Firebase emulators only.
  if (!existing && authEmulatorHost) connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
  return auth;
}

export const isClientStorageConfigured = isFirebaseClientConfigured && Boolean(config.storageBucket);
const storageEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST;
let storage: FirebaseStorage | undefined;

/** Browser access to Cloud Storage, used only to upload form attachments (see storage.rules). */
export function clientStorage() {
  if (storage) return storage;
  storage = getStorage(getApps()[0] ?? initializeApp(config));
  if (storageEmulatorHost) { const [host, port] = storageEmulatorHost.split(":"); connectStorageEmulator(storage, host, Number(port)); }
  return storage;
}
