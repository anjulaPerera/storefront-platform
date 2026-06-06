# ─── Stage 1: Install all dependencies ────────────────────────────────────────
FROM node:24-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/backend/package.json     ./apps/backend/
COPY packages/config/package.json  ./packages/config/
COPY packages/types/package.json   ./packages/types/
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY --from=deps /app/node_modules         ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .
WORKDIR /app/apps/backend
RUN pnpm build

# ─── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:24-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app
ENV NODE_ENV=production

# Copy workspace lockfile and workspace manifests for structural installation
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/backend/package.json ./apps/backend/

# Install pruned production dependencies 
RUN pnpm install --prod --frozen-lockfile

# Copy compiled distribution output from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

# Execute from the backend context where dist sits
CMD ["node", "apps/backend/dist/server.js"]