# AmarShop — Project guide for Claude Code

**Single source of truth:** `AmarShop_Project_Spec.md`. Always defer to it for
architecture, tech stack, data model, features, and roadmap.

## Working rules

- **Communicate with the user in Bangla**; keep ALL code, comments, variable
  names, commit messages, and documentation in **English**.
- **Work one module at a time.** After finishing a module, stop and wait for the
  user's confirmation before starting the next.
- If anything in the spec is ambiguous, ask the user (in Bangla) before assuming.

## What this is

Multi-tenant SaaS website builder (e-commerce first; also blog / portfolio /
agency / landing). One codebase, many tenants. Templates are read-only
blueprints; a tenant's site is a deep copy stored as structured JSON. Users
never write raw code.

## Architecture essentials

- **Multi-tenancy: schema-per-tenant.** One PostgreSQL database; a `public`
  schema for global data; one `tenant_<x>` schema per tenant. Prisma manages
  `public`; tenant schemas are provisioned/migrated by a custom SQL runner.
- **Routing:** subdomain / custom domain → resolve tenant in middleware; JWT
  carries `tenant_id`; the correct schema is selected per request.
- Connection pooling via PgBouncer (transaction mode → `pgbouncer=true` in
  `DATABASE_URL`; `DIRECT_URL` for migrations).

## Tech stack (follow exactly)

Next.js 16 (App Router) · Node 20+ · TypeScript · React 19 · Tailwind CSS v4 ·
PostgreSQL + Prisma · PgBouncer · NextAuth.js · Redis + BullMQ · Sharp ·
self-hosted VPS file storage (Cloudflare R2 for backup only) · Docker Compose ·
Traefik · Coolify.

## Common commands

```bash
npm run dev          # dev server
npm run build        # production build (standalone)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier
docker compose up    # full local stack (app + postgres + pgbouncer + redis)
```

## Phase 1 module status

1. Project scaffold — **done**
2. Auth (NextAuth) + schema-per-tenant provisioning — **done** (code complete; DB apply/runtime test pending local Docker)
3. Subdomain routing middleware — **done** (code complete; runtime test pending local Docker + a provisioned tenant)
4. Block components + TemplateRenderer + starter templates — **done** (code complete; runtime test pending local Docker)
5. Per-tenant admin panel (product/order/inventory) — **done** (code complete; runtime test pending local Docker)
6. Full super-admin panel
7. Access Management / RBAC (roles, permissions, audit log)
8. Self-hosted storage (Sharp upload) + R2 backup

Do not start Phase 2/3 until Phase 1 is complete and pilot-tested.

@AGENTS.md
