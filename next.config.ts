import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Middleware runs in Edge Runtime by default in Next.js 16
  // Session validation in middleware checks cookie format only
  // Full database validation happens in server components
};

export default nextConfig;
