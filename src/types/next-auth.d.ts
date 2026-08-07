import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/**
 * Augment NextAuth's types so the session/JWT carry the tenant context and role
 * that `src/auth.ts` attaches. Keep these fields in sync with the auth callbacks.
 */
declare module "next-auth" {
  interface User {
    role: UserRole;
    tenantId: string | null;
    tenantSubdomain: string | null;
    tenantSchema: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string | null;
      tenantSubdomain: string | null;
      tenantSchema: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    tenantId: string | null;
    tenantSubdomain: string | null;
    tenantSchema: string | null;
  }
}
