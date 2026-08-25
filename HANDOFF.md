# AmarShop — Handoff & Status

This file is the cross-machine context for AmarShop. Read it first when picking
up work on another machine (e.g. after a Docker pilot test).

## Where the plan / status lives

- **`AmarShop_Project_Spec.md`** — the product spec (single source of truth for
  architecture, features, data model, roadmap). Referred to as §-sections below.
- **`CLAUDE.md`** — project guide + **module status** (which modules are done).
  Auto-loaded by Claude Code. Update it as work progresses.
- **`HANDOFF.md`** (this file) — current status, how to run, what to watch for at
  runtime, and the remaining-work list to continue from.

> Note: earlier sessions also kept notes in Claude Code's local memory
> (`~/.claude/.../memory/`). That is **machine-local and NOT in git**, so on a
> different PC it won't be present — this file + `CLAUDE.md` + the spec are the
> authoritative shared context.

## Repo

- GitHub: `https://github.com/abulhayat-assdi/AmarShop` (branch `main`).
- Everything described below is committed and pushed.

---

## Status at a glance

**Phase 1 (M1–M8): code-complete.** Scaffold, Auth (NextAuth/Auth.js v5) +
schema-per-tenant provisioning, subdomain routing, block components +
TemplateRenderer + starter templates, per-tenant admin (products/orders/
inventory), full super-admin panel, RBAC + audit log, self-hosted storage
(Sharp) + R2 backup.

**Phase 2: mostly done.**
- Drag-and-drop editor (Puck) — `/dashboard/editor`.
- Subscriptions + billing + payment abstraction (bKash/SSLCommerz **stubbed**).
- Automated billing sweep — `POST /api/cron/sweep` + `/admin/billing` button.
- **Storefront + checkout (Cash on Delivery)** — `/shop`, `/product/[id]`,
  `/cart`, `/checkout`, `/order/[id]` on the tenant site.
- Feature flags (from M6).

**Phase 3: partial.**
- AI design editor (Claude API, JSON-bounded) — `/dashboard/editor/ai`.
- Custom-domain routing (app-side) — needs Traefik/Coolify SSL to fully work.
- 7 starter templates (all five site types).
- Automated tests (vitest) — `npm test` (32 passing; pure/security logic only).

**🚨 Never runtime-tested.** All of the above passes `typecheck`, `lint`,
`next build`, and the unit tests, but **has not been run against a real
PostgreSQL database**. The Docker pilot test is the first runtime run.

---

## How to run the pilot test (on a machine with Docker)

```bash
# 1. Env — copy the example and set real-ish local values
cp .env.example .env
#    Make sure these are set in .env (local dev values are fine):
#      POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB, REDIS_PASSWORD
#      DATABASE_URL / DIRECT_URL / REDIS_URL, ROOT_DOMAIN=localhost:3000
#      AUTH_SECRET (openssl rand -base64 32), SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
#      ENCRYPTION_KEY (>=16 chars), CRON_SECRET (>=16 chars)
#      ANTHROPIC_API_KEY (optional — enables the AI editor)

# 2. Bring up the full stack (app + postgres + pgbouncer + redis)
docker compose up --build -d

# 3. Apply migrations to the public schema, then seed
docker compose exec app npm run prisma:deploy
docker compose exec app npm run db:seed

# 4. Try the flows in a browser
#    Platform:     http://localhost:3000  -> sign up (creates a tenant + schema)
#    Owner admin:  /dashboard (products, editor, AI edit, orders, inventory, billing-less)
#    Super-admin:  log in with SUPER_ADMIN_EMAIL/PASSWORD -> /admin
#    Storefront:   http://<your-subdomain>.localhost:3000  (e.g. myshop.localhost:3000)
#                  -> /shop -> add to cart -> /checkout (Cash on Delivery) -> /order/<id>
```

If the app isn't run in Docker, run services in Docker and the app on the host:
`docker compose up -d postgres pgbouncer redis && npm install && npm run prisma:deploy && npm run db:seed && npm run dev`.

Migrations are already committed under `prisma/migrations/` — on a real DB use
`prisma migrate deploy` (the offline `migrate diff` trick was only needed on the
dev machine that had no database).

---

## Watch-list — most likely runtime failure points (never tested)

When an error appears, these are the first places to look:

1. **Prisma 7 + driver adapter** (`src/lib/prisma.ts`, `prisma.config.ts`).
   Prisma 7 removed `url` from `schema.prisma`; the runtime uses the
   `@prisma/adapter-pg` adapter with `DATABASE_URL`, and migrations use
   `DIRECT_URL` from `prisma.config.ts`. If the client fails to init or connect,
   start here.
2. **PgBouncer transaction pooling** — `DATABASE_URL` points at pgbouncer:6432,
   `DIRECT_URL` at postgres:5432. If prepared-statement / pooling errors appear,
   check `docker-compose.yml` pgbouncer env and the connection URLs.
3. **Tenant schema provisioning** (`src/lib/tenant/provision.ts`,
   `schema-sql.ts`) — runs raw `CREATE SCHEMA`/`CREATE TABLE` via a direct pg
   connection on sign-up. If sign-up fails, check this + `DIRECT_URL`.
4. **Raw SQL tenant queries** (`src/lib/tenant/*.ts`: products, orders,
   checkout, site-config, storefront) — schema-qualified `$queryRawUnsafe` /
   `$executeRawUnsafe`. JSONB casting and `id = ANY($1::text[])` in
   `checkout.ts` are the least-tested bits.
5. **Middleware routing** (`src/middleware.ts`) — `*.localhost:3000` must reach
   the tenant site. `ROOT_DOMAIN` must match the host. Behind a proxy it reads
   `x-forwarded-host`.
6. **Auth.js v5 (beta)** (`src/auth.ts`) — Credentials + JWT. Watch login,
   session shape, and the `@auth/core/jwt` type augmentation.
7. **Sharp on Alpine** (`src/lib/storage/local.ts`) — image upload/optimize.
   Needs the musl native binary; `serverExternalPackages: ["sharp"]` keeps it in
   the standalone build. If uploads fail, check Sharp loaded.
8. **Checkout transaction** (`src/lib/tenant/checkout.ts`) — customer + order +
   stock decrement in one `$transaction`. Verify orders/stock after a test order.
9. **Impersonation** — `impersonate_tenant_id` httpOnly cookie honored only for
   a live super-admin (`src/lib/auth/current-tenant.ts`).

---

## Remaining work (continue from here after the pilot test)

**Buildable app-code (do after pilot test):**
- [ ] 2FA for super-admin (spec §8) — TOTP; modifies the auth flow.
- [ ] i18n bn/en (spec §2) — bilingual UI; large, touches most components.
- [ ] Redis caching / ISR (spec §7.2) — cache hot tenant lookups (graceful
      fallback), ISR for storefront. Redis is already provisioned.
- [ ] RLS (spec §4.3) — needs per-tenant DB roles or session GUCs; **develop
      against a running DB** (schema isolation already blocks cross-tenant).

**Blocked on your input / infra (cannot finish in code alone):**
- [ ] Live bKash/SSLCommerz — needs merchant credentials + DCO registration
      (§13). Abstraction is ready: `src/lib/payments/` — fill in
      `createBkashGateway` / `createSslcommerzGateway`.
- [ ] Custom-domain auto-SSL — Traefik/Coolify config on the VPS (app-side
      routing done).
- [ ] Monitoring — UptimeRobot on `/api/health` + resource alerts (§7.2).
- [ ] Real email/SMS provider — pick one, then implement an adapter in
      `src/lib/notifications/` (interface + console stub already there).

**Then:** pilot test with 3–5 real users (spec Phase 2), and Phase 3 polish
(20–30 templates, performance/caching audit, backup polish).

## Working rules (unchanged)

- Communicate with the user in Bangla; all code/comments/commits in English.
- One module at a time; stop for confirmation after each.
- After completing something, run: `npm run typecheck && npm run lint && npm run build && npm test`.
- Update `CLAUDE.md` module status and this file's Status section as work lands.

## Commit history (Phase 2/3, newest first)

`96183ec` custom domain routing · `9fce2b6` notifications + templates ·
`e9e9e97` AI editor · `9b9221e` tests · `d5f5675` storefront/checkout ·
`4fd5338` cron sweep · `eaaadc3` billing/subscriptions/payments ·
`19b0213` editor (Puck). Phase 1 is `68d7a28`…`bccb797`.
