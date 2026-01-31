import type { NextConfig } from 'next';

const RELAY_URL = process.env.RELAY_URL || 'http://localhost:3550';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hermit/protocol'],
  async rewrites() {
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
