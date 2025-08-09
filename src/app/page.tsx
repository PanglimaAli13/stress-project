// src/app/page.tsx

"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Jika pengguna sudah login, langsung arahkan ke dashboard
  if (status === "authenticated") {
    router.replace("/dashboard");
    return <div className="flex h-screen items-center justify-center">Mengalihkan ke dashboard...</div>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // URL Google Apps Script Anda
      const url = `${process.env.NEXT_PUBLIC_APPS_SCRIPT_URL}?action=login&username=${username}&password=${password}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.status === "success" && result.data) {
        // Jika login di Apps Script berhasil, lanjutkan login dengan NextAuth
        const signInResponse = await signIn("credentials", {
          redirect: false,
          userData: JSON.stringify(result.data),
        });

        if (signInResponse?.ok) {
          toast.success("Login berhasil!");
          router.push("/dashboard");
        } else {
          throw new Error(signInResponse?.error || "Gagal melakukan autentikasi.");
        }
      } else {
        throw new Error(result.message || "Username atau password salah.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login STRESS</CardTitle>
          <CardDescription>
            Shipment Tracking Report & Engagemenet Support System
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username Anda"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password Anda"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Memproses..." : <><LogIn className="mr-2 h-4 w-4" /> Masuk</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
