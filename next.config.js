/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'via.placeholder.com'],
  },
  typescript: {
    // Don't fail build on TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Don't fail build on ESLint errors
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 