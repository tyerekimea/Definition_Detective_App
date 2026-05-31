import type { NextConfig } from "next";
import path from "path";

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
    experimental: {
      // Disable server actions for mobile static export
      serverActions: false,
    },
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
    
    if (!isMobileBuild) {
      // For web builds, alias mock files to server implementations
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/actions.mock$': path.resolve(__dirname, 'src/lib/actions.server.ts'),
        '@/lib/admin-actions.mock$': path.resolve(__dirname, 'src/lib/admin-actions.server.ts'),
        '@/lib/word-generator.mock$': path.resolve(__dirname, 'src/lib/word-generator.server.ts'),
        '@/ai/flows/generate-hints.mock': path.resolve(__dirname, 'src/ai/flows/generate-hints.server.ts'),
        '@/ai/flows/generate-word-flow.mock': path.resolve(__dirname, 'src/ai/flows/generate-word-flow.server.ts'),
        '@/ai/flows/game-sounds-flow.mock': path.resolve(__dirname, 'src/ai/flows/game-sounds-flow.server.ts'),
        '@/ai/flows/generate-image-description-flow.mock': path.resolve(__dirname, 'src/ai/flows/generate-image-description-flow.server.ts'),
        '@/ai/flows/generate-batch-hint-flow.mock': path.resolve(__dirname, 'src/ai/flows/generate-batch-hint-flow.server.ts'),
        '@/ai/flows/generate-batch-word-flow.mock': path.resolve(__dirname, 'src/ai/flows/generate-batch-word-flow.server.ts'),
      };
    } else {
      // For mobile builds, strictly map all potential server imports to mocks
      // to prevent 'use server' from leaking into the static export.
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/actions.server$': path.resolve(__dirname, 'src/lib/actions.mock.ts'),
        '@/lib/admin-actions.server$': path.resolve(__dirname, 'src/lib/admin-actions.mock.ts'),
        '@/lib/word-generator.server$': path.resolve(__dirname, 'src/lib/word-generator.mock.ts'),
        '@/ai/flows/generate-hints.server$': path.resolve(__dirname, 'src/ai/flows/generate-hints.mock.ts'),
        '@/ai/flows/generate-word-flow.server$': path.resolve(__dirname, 'src/ai/flows/generate-word-flow.mock.ts'),
        '@/ai/flows/game-sounds-flow.server$': path.resolve(__dirname, 'src/ai/flows/game-sounds-flow.mock.ts'),
        '@/ai/flows/generate-image-description-flow.server$': path.resolve(__dirname, 'src/ai/flows/generate-image-description-flow.mock.ts'),
        '@/ai/flows/generate-batch-hint-flow.server$': path.resolve(__dirname, 'src/ai/flows/generate-batch-hint-flow.mock.ts'),
        '@/ai/flows/generate-batch-word-flow.server$': path.resolve(__dirname, 'src/ai/flows/generate-batch-word-flow.mock.ts'),
      };

      // For mobile builds, exclude API routes
      config.module.rules.push({
        test: /src\/app\/api/,
        use: 'ignore-loader',
      });
    }
    
    return config;
  },
};

export default nextConfig;
