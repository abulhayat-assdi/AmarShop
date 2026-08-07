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

## Roadmap status

**Phase 1 — Core Foundation.** Module 1 (project scaffold) is complete.
Modules follow the session breakdown in the spec (§14): Auth + tenant
provisioning, subdomain routing, block components + templates, per-tenant admin,
super-admin panel, RBAC, and self-hosted storage.
