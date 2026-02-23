import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@brandflow/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Handle canvas module for Konva.js (used only on client)
    if (!isServer) {
      // On client side, canvas is not needed (browser provides it)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    } else {
      // On server side, externalize canvas to prevent bundling
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('canvas');
      }
    }
    return config;
  },
};

export default nextConfig;
