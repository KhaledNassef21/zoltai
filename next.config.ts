import type { NextConfig } from "next";

/**
 * Next.js config
 *
 * `images.remotePatterns` — whitelist of external hostnames allowed to be
 * optimized by the built-in Image Optimization API. Keeps `<Image>` usage
 * safe (prevents SSRF-style abuse) while still letting our placeholder
 * avatars + CDN hosts work without needing `unoptimized`.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "files.catbox.moe" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
    ],
  },
  // Production: drop console.* calls from client bundles (keep error/warn)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Enable gzip/brotli compression for responses
  compress: true,
  // Harden the poweredByHeader removal
  poweredByHeader: false,
};

export default nextConfig;
