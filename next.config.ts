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
    // AVIF first (smallest), WebP otherwise; resized copies are kept for 30 days instead of being remade.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      // Local Firebase Storage emulator, only when it is in use.
      ...(process.env.FIREBASE_STORAGE_EMULATOR_HOST ? [{ protocol: "http" as const, hostname: "127.0.0.1", port: "9199" }] : []),
    ],
    localPatterns: [
      { pathname: "/_next/static/media/**" },
      // Real work photos built by scripts/build-media.py.
      { pathname: "/media/**" },
    ],
  },
  experimental: {
    // Admin product photo uploads (4 MB max) go through a Server Action.
    serverActions: { bodySizeLimit: "5mb" },
  },
  // /wraps/film was removed; send old links and bookmarks to the PPF page.
  async redirects() {
    return [
      // One address for search engines: the old Vercel address sends visitors (and Google) to the real domain.
      // /api is left out so webhooks (e.g. Stripe) still pointed at the old address keep working: they don't follow redirects.
      { source: "/:path((?!api/).*)", has: [{ type: "host", value: "signsnwraps.vercel.app" }], destination: "https://signsnwraps.com.au/:path", permanent: true },
      { source: "/wraps/film", destination: "/wraps/ppf", permanent: true },
      // One URL per service: these duplicated the Signs/Wraps pages.
      { source: "/services/signage", destination: "/signs/signage", permanent: true },
      { source: "/services/printing", destination: "/signs/printing", permanent: true },
      { source: "/services/vehicle-wraps", destination: "/wraps/vehicle-wraps", permanent: true },
      { source: "/services/ppf", destination: "/wraps/ppf", permanent: true },
    ];
  },
  // Private pages (customer quotes/invoices and their PDFs, admin, accounts, APIs) are never indexed, even if a link leaks.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    // Photos, videos and posters in /media: browsers keep them a week and refresh quietly after that.
    const mediaCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }];
    return [
      ...["/billing/:path*", "/admin/:path*", "/account/:path*", "/api/:path*"].map((source) => ({ source, headers: noindex })),
      { source: "/media/:path*", headers: mediaCache },
    ];
  },
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
