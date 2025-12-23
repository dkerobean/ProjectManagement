import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {  
  // ... existing config ...
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    _next_intl_trailing_slash: "false",
  },
  webpack: (config, { isServer, dev }) => {
    // Handle missing optional dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "bufferutil": false,
      "utf-8-validate": false,
    };

    // Ignore specific warnings for server-side builds
    if (isServer) {
      config.externals = [...(config.externals || []), 'bufferutil', 'utf-8-validate'];
    }

    // Fix for dynamic imports and chunking issues in production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Separate auth-related components into their own chunk
            auth: {
              test: /[\\/]components[\\/]auth[\\/]/,
              name: 'auth',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }

    return config;
  },
  eslint: {
    // Disable ESLint during build for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during build for deployment
    ignoreBuildErrors: true,
  },
};

export default withPWA(withNextIntl(nextConfig));
