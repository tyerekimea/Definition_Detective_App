import type { NextConfig } from "next";

const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable static export for mobile builds
  ...(isMobileBuild && {
    output: 'export',
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  }),
  // Server actions only for web builds
  ...(!isMobileBuild && {
    experimental: {
      serverActions: {
        allowedOrigins: [
          "*.firebase.studio",
          "localhost:3000",
          "localhost:9003",
          "*.app.github.dev",
          "*.github.dev",
        ],
      },
    },
  }),
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;