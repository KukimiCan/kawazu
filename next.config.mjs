// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // From this specific path in our app...
        source: '/api/bungo/random',
        // ...to this exact destination URL.
        destination: 'https://api.bungomail.com/random',
      },
    ];
  },
};

export default nextConfig;