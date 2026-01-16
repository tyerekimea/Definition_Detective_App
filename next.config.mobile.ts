import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable static export for mobile
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Disable server actions for static export
  // experimental: {
  //   serverActions: false,
  // },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
