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

// In NextAuth v5 the JWT interface lives in @auth/core/jwt (next-auth/jwt only
// re-exports it), so the augmentation must target that module.
declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole;
    tenantId: string | null;
    tenantSubdomain: string | null;
    tenantSchema: string | null;
  }
}
