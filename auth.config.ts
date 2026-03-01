import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no Node.js imports (no Prisma, no bcrypt).
// Used by proxy.ts (edge runtime) to protect /admin/* routes.
// auth.ts spreads this and adds the Credentials provider.
export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: { signIn: "/gateway" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      if (isOnAdmin) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
