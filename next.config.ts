import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['bcrypt', 'bcryptjs', '@supabase/supabase-js'],
};

export default nextConfig;
