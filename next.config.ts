import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Make the API key available on the client-side for the warning message.
  // This does NOT expose the key itself, only whether it has been set.
  env: {
    NEXT_PUBLIC_API_KEY_CONFIGURED: (!!process.env.GEMINI_API_KEY).toString(),
  },
  experimental: {
    // This is to fix the cross-origin error in development environments like Firebase Studio
    allowedDevOrigins: ['https://*.cloudworkstations.dev'],
  },
};

export default nextConfig;
