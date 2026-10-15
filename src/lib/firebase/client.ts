"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// Public web-app config (safe to expose). On App Hosting these are filled from FIREBASE_WEBAPP_CONFIG in next.config.ts.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
