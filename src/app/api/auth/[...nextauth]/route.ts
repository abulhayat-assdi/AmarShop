import { handlers } from "@/auth";

// The Credentials provider uses Prisma + pg (Node APIs), so pin to Node runtime.
export const runtime = "nodejs";

// NextAuth (Auth.js) route handlers for sign-in / callback / session endpoints.
export const { GET, POST } = handlers;
