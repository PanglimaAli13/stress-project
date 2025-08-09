// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// PERUBAHAN DI SINI: Hapus kata 'export'
const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        // Kita sekarang akan mengirim data user yang sudah diverifikasi
        userData: { label: "User Data", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.userData) {
          return null;
        }

        try {
          // Langsung parse data user dari frontend
          const user = JSON.parse(credentials.userData);
          
          // Jika data user valid, buat sesi
          if (user && user.username) {
            return {
              id: user.username,
              name: user.namaLengkap,
              status: user.status,
            };
          }
          
          return null; // Gagal jika data tidak valid

        } catch (error: any) {
          console.error("Authorize error:", error.message);
          throw new Error(error.message);
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Hanya ekspor GET dan POST yang diizinkan
export { handler as GET, handler as POST };
