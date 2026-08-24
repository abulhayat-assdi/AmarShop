# AmarShop

Multi-tenant SaaS platform that lets anyone build and run their own website
(e-commerce first; also blog, portfolio, agency, and landing pages) from
ready-made templates — no code required.

See [`AmarShop_Project_Spec.md`](./AmarShop_Project_Spec.md) for the full
product specification, architecture, and roadmap. It is the single source of
truth for this project.

## Tech stack

| Layer            | Choice                         |
| ---------------- | ------------------------------ |
| Framework        | Next.js 16 (App Router)         |
| Runtime          | Node.js 20+                     |
| Language         | TypeScript, React 19            |
| Styling          | Tailwind CSS v4                 |
| Database         | PostgreSQL (schema-per-tenant)  |
| ORM              | Prisma                          |
| Conn. pooling    | PgBouncer                       |
| Cache / queue    | Redis + BullMQ                  |
| Containerization | Docker + Docker Compose         |

## Prerequisites

- Node.js 20+ (Node 24 recommended)
- Docker Desktop (for the full local stack: PostgreSQL, PgBouncer, Redis)

## Getting started

### Option A — Full stack with Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

The app runs at http://localhost:3000. PostgreSQL, PgBouncer, and Redis start
alongside it. Inside the compose network the app reaches these services by name
(the `.env` localhost values are overridden in `docker-compose.yml`).

### Option B — App locally, services in Docker

Run only the backing services in Docker and the app on your host for the
fastest hot-reload:

```bash
cp .env.example .env
docker compose up -d postgres pgbouncer redis
npm install
npm run dev
```

### Option C — App only (no database yet)

Module 1 has no database queries, so the app boots without any services:

```bash
npm install
npm run dev
```

Health check: http://localhost:3000/api/health

## Scripts

| Script                    | Description                          |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Start the dev server                 |
| `npm run build`           | Production build (standalone output) |
| `npm run start`           | Start the production server          |
| `npm run lint`            | Run ESLint                           |
| `npm run typecheck`       | Type-check with `tsc --noEmit`       |
| `npm run format`          | Format with Prettier                 |
| `npm run prisma:generate` | Generate the Prisma client           |
| `npm run prisma:migrate`  | Run migrations (dev)                 |
| `npm run prisma:studio`   | Open Prisma Studio                   |

## Project structure

```
.
├── prisma/
│   └── schema.prisma        # Prisma datasource/generator (models: Module 2)
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/health/      # Liveness probe
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/          # Reusable / block components (Module 4)
│   ├── lib/
│   │   ├── env.ts           # Validated environment variables
│   │   └── prisma.ts        # Prisma client singleton
│   └── types/
├── templates/               # Code-based starter templates (Module 4)
├── docker-compose.yml       # Local dev stack
├── Dockerfile               # Multi-stage (dev + production)
└── AmarShop_Project_Spec.md # Product specification (source of truth)
```

## Storage & backups

Uploaded images are stored on the VPS (spec §7.1) under `UPLOAD_DIR`
(default `<project>/uploads`; `/app/uploads` in Docker, on a persistent volume).
Uploads are optimized to WebP with Sharp on upload and served by the
`/uploads/<schema>/<file>` route (a Cloudflare proxy can cache in front).

Off-server backup to Cloudflare R2 (backup-only, never served) is
`scripts/backup.sh` — it dumps the database and archives the uploads, then
uploads both to R2. Run it on the VPS via cron; see the script header for the
required env vars (`DIRECT_URL`, `R2_*`) and an example crontab entry.

## Scheduled jobs

The subscription grace/suspend sweep (spec §6.4) runs via `POST /api/cron/sweep`,
guarded by `CRON_SECRET`. Trigger it from the VPS crontab, e.g. daily:

```bash
0 3 * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://amarshop.com/api/cron/sweep
```

A super-admin can also run it on demand from `/admin/billing`.

## Roadmap status

**Phase 1 — Core Foundation: all modules code-complete** (runtime/DB testing
pending a local Docker run). Per the spec §14 session breakdown: project
scaffold, auth + schema-per-tenant provisioning, subdomain routing, block
components + TemplateRenderer + starter templates, per-tenant admin panel,
full super-admin panel, Access Management / RBAC, and self-hosted storage + R2
backup. Phase 2 (payments, subscriptions, drag-and-drop editor) is next, after
pilot testing.
