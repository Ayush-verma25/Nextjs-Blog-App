/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
  // For App Router (which you're using)
  serverRuntimeConfig: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  },
  images: {
    domains: ['localhost', 'your-domain.vercel.app'],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig
