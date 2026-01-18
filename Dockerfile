# Root Dockerfile for Wallet App
# Supports building both backend and frontend services
# Usage: docker build --target backend -t wallet-backend .
#        docker build --target frontend -t wallet-frontend .

# ============================================================================
# BACKEND SERVICE
# ============================================================================
FROM node:18-alpine AS backend-base

FROM backend-base AS backend-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM backend-base AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/nest-cli.json ./
COPY backend/src ./src

RUN npm run build

FROM backend-base AS backend
WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=backend-builder --chown=nestjs:nodejs /app/backend/dist ./dist
COPY --from=backend-deps --chown=nestjs:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nestjs:nodejs /app/backend/package.json ./

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]

# ============================================================================
# FRONTEND SERVICE
# ============================================================================
FROM node:18-alpine AS frontend-base

FROM frontend-base AS frontend-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

FROM frontend-base AS frontend-builder
WORKDIR /app/frontend

COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
COPY frontend ./

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM frontend-base AS frontend
WORKDIR /app/frontend

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=frontend-builder /app/frontend/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000), (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
