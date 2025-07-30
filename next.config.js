/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Add these for better CSS handling
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Ensure proper asset handling
  images: {
    domains: [], // Add your image domains if any
  },
};

module.exports = nextConfig;
