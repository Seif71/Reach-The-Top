import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "USER" | "ADMIN";
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: "USER" | "ADMIN";
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
    id?: string;
  }
}

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
        session.user.email = (token.email as string) ?? session.user.email;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
