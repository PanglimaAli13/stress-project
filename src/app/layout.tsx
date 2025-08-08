// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Impor Provider untuk sesi login (NextAuth)
import { Providers } from "./providers";
// Impor Toaster untuk notifikasi (Sonner)
import { Toaster } from "@/components/ui/sonner";

// Inisialisasi font standar dari Google Fonts
const inter = Inter({ subsets: ["latin"] });

// Metadata default untuk seluruh aplikasi
export const metadata: Metadata = {
  title: "STRESS",
  description: "Shipment Tracking Report & Engagemenet Support System", // 
};

// Ini adalah komponen Root Layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Bungkus seluruh aplikasi dengan Provider agar status login terbaca di mana saja */}
        <Providers>
          {/* {children} adalah tempat di mana konten halaman (misal: Halaman Login) akan ditampilkan */}
          {children}

          {/* Tempat untuk merender notifikasi dari Sonner */}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}