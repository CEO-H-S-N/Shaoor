import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["shaoor.org", "*.shaoor.org"],
    },
  },

  // Turbopack config (Next.js 16 default bundler — replaces webpack)
  // Prisma doesn't need special handling with Turbopack; it's auto-excluded as a server-only module.
  turbopack: {},

  // Security: prevent the X-Powered-By header
  poweredByHeader: false,

  // Optimize images from trusted domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },  // Google avatars
      { protocol: "https", hostname: "pub.orcid.org" },              // ORCID
      { protocol: "https", hostname: "*.amazonaws.com" },            // S3 paper files
    ],
  },
};

export default nextConfig;
