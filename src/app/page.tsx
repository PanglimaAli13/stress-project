// src/app/page.tsx

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // === PERUBAHAN UTAMA DI SINI ===
  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Username dan password wajib diisi.");
      return;
    }
    setIsLoading(true);

    try {
      // 1. Buat URL untuk panggilan langsung ke Google
      const url = new URL(process.env.NEXT_PUBLIC_APPS_SCRIPT_URL!);
      url.searchParams.append('action', 'authenticateUser');
      url.searchParams.append('username', username);
      url.searchParams.append('password', password);

      // 2. Lakukan panggilan langsung dari browser
      const res = await fetch(url.toString());
      const result = await res.json();

      // 3. Periksa hasil dari Google
      if (result.status === 'success' && result.data.status === 'success') {
        const userData = result.data.userData;
        
        // 4. Jika berhasil, panggil signIn HANYA untuk membuat sesi
        const signInResult = await signIn("credentials", {
          redirect: false,
          userData: JSON.stringify(userData), // Kirim data user yang sudah valid
        });

        if (signInResult?.ok) {
          router.push("/dashboard");
        } else {
          throw new Error("Gagal membuat sesi login.");
        }

      } else {
        // Jika Google mengembalikan error (misal: password salah)
        throw new Error(result.data.message || "Autentikasi gagal.");
      }

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  // ==============================
  
  const handleKeyPress = (event: React.KeyboardEvent) => { if (event.key === 'Enter') handleLogin(); };

  const whatsappMessage = `Wahai Yang Mulia. Saya, ${username || '...'} adalah seorang pelupa...`;
  const whatsappUrl = `https://wa.me/6281318138660?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]" onKeyPress={handleKeyPress}>
        <CardHeader><CardTitle className="text-center text-2xl font-bold">STRESS Login</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="Masukkan username Anda" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-full" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleLogin} disabled={isLoading} className="w-full">{isLoading ? "Memproses..." : "Masuk"}</Button>
          <a href={username ? whatsappUrl : '#'} onClick={(e) => !username && e.preventDefault()} className={`text-sm text-blue-600 hover:underline ${!username && 'opacity-50 cursor-not-allowed'}`}>Lupa Password?</a>
        </CardFooter>
      </Card>
    </main>
  );
}
