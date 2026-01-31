import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';
const RELAY_URL = process.env.RELAY_URL || 'http://localhost:3550';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hermit/protocol'],
  async rewrites() {
    // Only proxy in dev - production uses ingress routing
    if (!isDev) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${RELAY_URL}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${RELAY_URL}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
