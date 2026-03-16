/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    // Ignora erros de ESLint na hora de subir pra Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de TypeScript (tipagens) na hora de subir pra Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
