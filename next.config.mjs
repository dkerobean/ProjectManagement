import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    _next_intl_trailing_slash: "false",
  },
  webpack: (config, { isServer }) => {
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

export default withNextIntl(nextConfig);
