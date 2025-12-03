
/** @type {import('next').NextConfig} */

require('dotenv').config();

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // No longer need allowedDevOrigins here
  },
  allowedDevOrigins: [
      "http://localhost:9003",
      "https://*.cloudworkstations.dev",
      "https://*.firebase.studio",
  ]
};

module.exports = nextConfig;
