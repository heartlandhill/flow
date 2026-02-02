import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable Node.js runtime for middleware to allow Prisma database access
    middlewareNodeRuntime: true,
  },
};

export default nextConfig;
