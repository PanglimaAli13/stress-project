/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // PERINGATAN: Ini mengizinkan build produksi berhasil
    // meskipun proyek Anda memiliki error ESLint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;