/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'mongodb', 'pdf-parse', 'xlsx'],
  },
};

export default nextConfig;
