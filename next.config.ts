import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy runs in Node.js runtime by default in Next.js 16
  // Session validation in proxy checks cookie format only
  // Full database validation happens in server components
};

export default nextConfig;
