// src/app/providers.tsx

"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  // Buat instance QueryClient
  const [queryClient] = useState(() => new QueryClient());

  return (
    // Sediakan client untuk seluruh aplikasi
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}