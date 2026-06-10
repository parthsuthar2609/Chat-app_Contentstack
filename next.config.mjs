import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Monorepo-style folder: use this app directory as tracing root on Vercel
  outputFileTracingRoot: path.join(__dirname),

  env: {
    CONTENTSTACK_API_KEY:
      process.env.CONTENTSTACK_API_KEY
      || process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY,
    NEXT_PUBLIC_CONTENTSTACK_API_KEY:
      process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY
      || process.env.CONTENTSTACK_API_KEY,
    CONTENTSTACK_DELIVERY_TOKEN: process.env.CONTENTSTACK_DELIVERY_TOKEN,
    CONTENTSTACK_BRANCH: process.env.CONTENTSTACK_BRANCH || 'main',
    CONTENTSTACK_ENVIRONMENT: process.env.CONTENTSTACK_ENVIRONMENT,
    CONTENTSTACK_REGION:
      process.env.CONTENTSTACK_REGION
      || (process.env.CONTENTSTACK_API_HOST?.includes('gcp-na') ? 'gcp-na' : 'us'),
    CONTENTSTACK_APP_HOST: process.env.CONTENTSTACK_APP_HOST,
    CONTENTSTACK_PREVIEW_HOST: process.env.CONTENTSTACK_PREVIEW_HOST,
    CONTENTSTACK_PREVIEW_TOKEN: process.env.CONTENTSTACK_PREVIEW_TOKEN,
    CONTENTSTACK_LIVE_PREVIEW: process.env.CONTENTSTACK_LIVE_PREVIEW,
    CONTENTSTACK_LIVE_EDIT_TAGS: process.env.CONTENTSTACK_LIVE_EDIT_TAGS,
    CONTENTSTACK_API_HOST: process.env.CONTENTSTACK_API_HOST,
    NEXT_PUBLIC_HOSTED_URL: process.env.NEXT_PUBLIC_HOSTED_URL,
  },

  serverExternalPackages: ['contentstack', '@contentstack/utils'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.contentstack.io' },
      { protocol: 'https', hostname: '*.contentstack.io' },
      { protocol: 'https', hostname: 'gcp-na-images.contentstack.com' },
      { protocol: 'https', hostname: '*.contentstack.com' },
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
