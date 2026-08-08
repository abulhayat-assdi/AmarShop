import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";

// A valid bcrypt hash used only to equalize authentication timing when an
// account is not found — this mitigates email enumeration via response timing.
// It is not a usable credential.
const DUMMY_PASSWORD_HASH =
  "$2b$12$CNDagSSIa4c7dS3z.mMFEOubmoqBdWDAklCA4oGBLihqcd.j1vmmu";

/**
 * NextAuth (Auth.js v5) configuration.
 *
 * Email/password via the Credentials provider, with JWT sessions so the token
 * can carry the tenant context (`tenantId`, schema, subdomain) and role — which
 * the middleware/data layer uses to resolve the correct tenant per request
 * (spec §4.3). Social login can be added later without changing this shape.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Bound how long a session (and its cached role/tenant claims) stays valid.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
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

        // Always run a comparison (against a dummy hash when the account does
        // not exist) so timing does not reveal whether the email is registered.
        const passwordOk = await compare(
          password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        );
        if (!user || !passwordOk) return null;

        // Suspended tenants cannot sign in (spec §6.4).
        if (user.tenant && user.tenant.status === "suspended") return null;

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
