import type { NextConfig } from "next";

const isVercelDeployment = process.env.VERCEL === '1';
const isMobileBuild = process.env.MOBILE_BUILD === 'true' && !isVercelDeployment;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost', '0.0.0.0'],
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
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
          "127.0.0.1:3000",
          "*.app.github.dev",
          "*.github.dev",
        ],
      },
    },
  }),
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // For mobile builds, exclude API routes since they require server runtime
    // API routes will run on traylapps.com server, not in the static export
    if (isMobileBuild) {
      config.module.rules.push({
        test: /src\/app\/api/,
        use: 'ignore-loader',
      });
    }
    
    return config;
  },
};

export default nextConfig;
