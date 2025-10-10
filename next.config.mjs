import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Fix for pdf-parse in Next.js
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore canvas module (used by pdf-parse but not needed)
      config.resolve.alias.canvas = false
      
      // Mark pdf-parse as external to avoid bundling issues
      config.externals = config.externals || []
      config.externals.push({
        canvas: 'canvas',
      })
    }
    
    return config
  },
  
  // Tell Next.js to not bundle these packages
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'canvas'],
  },
}

export default withPayload(nextConfig)