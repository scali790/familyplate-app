import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint during builds (pragmatic for MVP)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
