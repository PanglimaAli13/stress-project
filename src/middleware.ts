// src/middleware.ts

// Impor middleware otentikasi dari NextAuth
export { default } from "next-auth/middleware";

// Tentukan rute mana yang ingin Anda proteksi
export const config = {
  matcher: [
    "/dashboard/:path*", // Melindungi semua rute yang diawali dengan /dashboard
  ],
};