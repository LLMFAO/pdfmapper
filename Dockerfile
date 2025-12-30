
# ═══════════════════════════════════════════════════════════════════════════
# NEXT.JS FRONTEND DOCKERFILE
# Multi-stage build for Cloud Run deployment
# ═══════════════════════════════════════════════════════════════════════════

# 1. Base image for dependencies
FROM node:20-alpine AS base

# 2. Dependency Installation
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry disable for privacy/speed
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# 4. Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Create simple non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Cloud Run expects the container to listen on $PORT
CMD ["node", "server.js"]
