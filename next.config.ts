import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disable optimizePackageImports for packages that use Node.js APIs
    serverComponentsExternalPackages: ['bcrypt', '@supabase/supabase-js'],
  },
};

export default nextConfig;
