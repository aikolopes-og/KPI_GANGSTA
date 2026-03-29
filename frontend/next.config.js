/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' para Docker, remover para Vercel
  ...(process.env.DOCKER === 'true' ? { output: 'standalone' } : {}),
  reactStrictMode: true,
  images: {
    unoptimized: process.env.DOCKER === 'true',
  },
  // Garante que o JSON de dados seja incluido no bundle serverless
  experimental: {
    outputFileTracingIncludes: {
      '/api/*': ['./data/**/*'],
    },
  },
};

module.exports = nextConfig;
