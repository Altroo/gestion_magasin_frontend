# Multi-stage Dockerfile for gestion_magasin_frontend (Bun runtime)
# Build stage
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Install build deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy sources and build
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Runtime stage
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and production deps
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3006
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD pgrep -f bun || exit 1

CMD ["bun", "run", "start"]
