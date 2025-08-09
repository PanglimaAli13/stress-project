// src/types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      status?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    status?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    status?: string;
  }
}
