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
6. Full super-admin panel — **done** (code complete; runtime test pending local Docker)
7. Access Management / RBAC (roles, permissions, audit log) — **done** (code complete; runtime test pending local Docker)
8. Self-hosted storage (Sharp upload) + R2 backup — **done** (code complete; runtime test pending local Docker)

**Phase 1 is code-complete (M1–M8).** Phase 1 has NOT been pilot-tested yet
(needs a local Docker run: `docker compose up` → `prisma:deploy` → `db:seed`).

## Phase 2 (in progress, user opted to start before pilot testing)

- Drag-and-drop editor — **done** (code complete). Built on **Puck**
  (`@measured/puck`, React-native, not GrapesJS) because it edits our structured
  block JSON directly — no raw code (spec §1.4). `/dashboard/editor`; config maps
  our 9 blocks to Puck components (`src/lib/editor/puck-config.tsx`); saves via
  `updateSiteBlocks` after re-validating with `parseBlocks`.
- Feature flags (`tenant_features` + `hasFeature`) — already delivered in M6.
- Subscription/billing + payment abstraction — **done** (code complete).
  `Subscription`/`PlatformGateway` models; AES-256-GCM credential encryption
  (`src/lib/crypto/secrets.ts`, ENCRYPTION_KEY); generic `PaymentGateway`
  abstraction (`src/lib/payments/`) with a manual gateway + resolver
  (own→platform→manual) and **stubbed** bKash/SSLCommerz (live API pending
  merchant credentials, §13); subscription lifecycle + grace/suspend + sweep
  (`src/lib/billing/subscriptions.ts`); `/admin/billing` + tenant-detail
  subscription controls, gated by a new `billing` RBAC resource, audit-logged.
- Automated billing sweep — **done** (`POST /api/cron/sweep`, CRON_SECRET).
- Storefront + checkout (COD) — **done**. Customer-facing shop/product/cart/
  checkout/order under the tenant site (`src/app/s/[subdomain]/*`,
  `src/components/storefront/*`); cart is client localStorage (per-subdomain
  origin); checkout is server-authoritative (schema from host, prices re-read
  from DB) via `placeOrder` (`src/lib/tenant/checkout.ts`). Online payment plugs
  into the existing gateway abstraction once live.
- Remaining: live bKash/SSLCommerz integration (needs merchant creds + DCO),
  and pilot test. Still TODO across Phase 2/3: AI editor, more templates, Redis
  caching/ISR, i18n (bn/en), 2FA, RLS, email/SMS, automated tests, custom-domain
  SSL + monitoring (infra).

Known npm-audit items (accepted): `deepmerge-ts` (Prisma 7 CLI, build-time only)
and `uuid` (via Puck, not exploited in its usage); both would require breaking
downgrades of core deps to "fix".

@AGENTS.md
