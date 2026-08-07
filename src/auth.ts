import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";

/**
 * NextAuth (Auth.js v5) configuration.
 *
 * Email/password via the Credentials provider, with JWT sessions so the token
 * can carry the tenant context (`tenantId`, schema, subdomain) and role — which
 * the middleware/data layer uses to resolve the correct tenant per request
 * (spec §4.3). Social login can be added later without changing this shape.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });
        if (!user) return null;

        const passwordOk = await compare(password, user.passwordHash);
        if (!passwordOk) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantSubdomain: user.tenant?.subdomain ?? null,
          tenantSchema: user.tenant?.schemaName ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on sign-in; copy the tenant context onto the token.
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSubdomain = user.tenantSubdomain;
        token.tenantSchema = user.tenantSchema;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role;
      session.user.tenantId = token.tenantId;
      session.user.tenantSubdomain = token.tenantSubdomain;
      session.user.tenantSchema = token.tenantSchema;
      return session;
    },
  },
});
