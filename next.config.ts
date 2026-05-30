import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // resultado do try-on (servido pelo HF Space)
      {
        protocol: 'https',
        hostname: '*.hf.space',
      },
      {
        protocol: 'https',
        hostname: 'huggingface.co',
      },
    ],
  },
  turbopack: {},
  // permite que o @gradio/client rode no Node.js do servidor sem ser empacotado
  serverExternalPackages: ['@gradio/client'],
}

export default nextConfig
