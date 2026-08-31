import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    localPatterns: [{ pathname: '/api/drive-image' }],
  },
};

export default nextConfig;
