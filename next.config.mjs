import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  async rewrites() {
    const apiBaseUrl = process.env.AOZORA_API_URL;

    if (!apiBaseUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("AOZORA_API_URL is not set. /api/aozora/* proxy routes are disabled.");
      }
      return [];
    }

    let destinationUrl = apiBaseUrl.trim();

    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      destinationUrl = `https://${destinationUrl}`;
    }

    const cleanedDestinationUrl = destinationUrl.endsWith('/') ? destinationUrl.slice(0, -1) : destinationUrl;

    return [
      {
        source: '/api/aozora/:path*',
        destination: `${cleanedDestinationUrl}/:path*`,
      },
    ];
  },
});

export default nextConfig;
