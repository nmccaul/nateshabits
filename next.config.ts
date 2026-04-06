import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16+ default bundler)
  turbopack: {},

  // Webpack config kept for compatibility (e.g. when --webpack flag is used)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
