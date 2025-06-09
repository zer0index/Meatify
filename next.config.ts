/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for better Docker performance
  output: 'standalone',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;