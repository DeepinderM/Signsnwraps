import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    localPatterns: [
      { pathname: "/_next/static/media/**" },
    ],
  },
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
