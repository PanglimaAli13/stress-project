// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userData: { label: "User Data", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.userData) return null;
        try {
          const user = JSON.parse(credentials.userData);
          if (user && user.username) {
            return {
              id: user.username,
              name: user.namaLengkap,
              status: user.status,
            };
          }
          return null;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.status = token.status;
      }
      return session;
    },
  },
  pages: { signIn: "/" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
