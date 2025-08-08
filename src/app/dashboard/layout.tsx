// src/app/dashboard/layout.tsx

"use client"; // Kita butuh state, jadi jadikan client component

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State untuk mengontrol kondisi sidebar (terbuka/tertutup)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Kirim state dan fungsi untuk mengubahnya ke komponen Sidebar */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      {/* Atur margin kiri dari konten utama berdasarkan kondisi sidebar */}
      <main 
        className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {children}
      </main>
    </div>
  );
}