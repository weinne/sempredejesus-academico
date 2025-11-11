# Multi-stage Dockerfile for Seminário Acadêmico

# Stage 1: Base dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile

# Stage 2: Build packages
FROM base AS builder
RUN turbo run build

# Stage 3: Build portal (frontend)
FROM base AS portal-builder
WORKDIR /app/apps/portal
RUN pnpm run build

# Stage 4: Production API image
FROM node:20-alpine AS production

# Install production dependencies
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Copy built packages
COPY --from=builder /app/packages/*/dist ./packages/*/dist

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/src/db ./apps/api/src/db
COPY scripts/start-production.sh ./scripts/start-production.sh

# Copy built portal (static files)
COPY --from=portal-builder /app/apps/portal/dist ./public

# Set working directory to API
WORKDIR /app/apps/api

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
RUN chmod +x /app/scripts/start-production.sh
USER nextjs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application with migrations
WORKDIR /app
CMD ["/app/scripts/start-production.sh"] 