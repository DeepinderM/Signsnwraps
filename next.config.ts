import type { NextConfig } from "next";
import path from "node:path";

// Firebase App Hosting provides the web app config as FIREBASE_WEBAPP_CONFIG at build time.
// Map it onto the NEXT_PUBLIC_* names the client uses, unless they are set explicitly.
const webAppConfig = (() => {
  try { return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG ?? "{}") as Record<string, string>; } catch { return {}; }
})();
const firebasePublicEnv = Object.fromEntries(Object.entries({
  NEXT_PUBLIC_FIREBASE_API_KEY: webAppConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: webAppConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: webAppConfig.projectId,
  NEXT_PUBLIC_FIREBASE_APP_ID: webAppConfig.appId,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: webAppConfig.storageBucket,
}).filter(([key, value]) => value && !process.env[key])) as Record<string, string>;

const nextConfig: NextConfig = {
  env: firebasePublicEnv,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      // Local Firebase Storage emulator, only when it is in use.
      ...(process.env.FIREBASE_STORAGE_EMULATOR_HOST ? [{ protocol: "http" as const, hostname: "127.0.0.1", port: "9199" }] : []),
    ],
    localPatterns: [
      { pathname: "/_next/static/media/**" },
    ],
  },
  experimental: {
    // Admin product photo uploads (4 MB max) go through a Server Action.
    serverActions: { bodySizeLimit: "5mb" },
  },
  // /wraps/film was removed; send old links and bookmarks to the PPF page.
  async redirects() {
    return [
      { source: "/wraps/film", destination: "/wraps/ppf", permanent: true },
      // One URL per service: these duplicated the Signs/Wraps pages.
      { source: "/services/signage", destination: "/signs/signage", permanent: true },
      { source: "/services/printing", destination: "/signs/printing", permanent: true },
      { source: "/services/vehicle-wraps", destination: "/wraps/vehicle-wraps", permanent: true },
      { source: "/services/ppf", destination: "/wraps/ppf", permanent: true },
    ];
  },
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
