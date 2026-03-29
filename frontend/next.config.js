/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' para Docker, remover para Vercel
  ...(process.env.DOCKER === 'true' ? { output: 'standalone' } : {}),
  reactStrictMode: true,
  // Otimizações de imagem para Vercel
  images: {
    unoptimized: process.env.DOCKER === 'true',
  },
};

module.exports = nextConfig;
