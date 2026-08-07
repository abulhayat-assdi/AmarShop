# syntax=docker/dockerfile:1

# ============================================================
# AmarShop — multi-stage Dockerfile
# Targets: `dev` (hot-reload) and `runner` (production standalone).
# ============================================================

# ---- Base ----
FROM node:24-alpine AS base
# libc6-compat + openssl are required by the Prisma engine (and Sharp later)
# on Alpine.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
# Copy the Prisma schema + config so the client can be generated here and
# inherited by later stages.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
# Prisma 7 has no install hook, so generate the client explicitly. A placeholder
# DIRECT_URL satisfies prisma.config.ts; `generate` makes no database connection.
RUN DIRECT_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

# ---- Development (used by docker-compose) ----
FROM base AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Builder (production) ----
FROM base AS builder
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder connection URLs so `prisma generate` / `next build` do not require
# real credentials at build time (no database connection is made during build).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DIRECT_URL="postgresql://build:build@localhost:5432/build"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Runner (production) ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
