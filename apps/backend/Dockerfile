# ─── Stage 1: Install all dependencies ────────────────────────────────────────
FROM node:24-alpine AS deps
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc ./
COPY apps/backend/package.json    ./apps/backend/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json  ./packages/types/
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .
WORKDIR /app/apps/backend
RUN pnpm build

# ─── Stage 3: Production runtime ──────────────────────────────────────────────
FROM node:24-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc ./
COPY apps/backend/package.json    ./apps/backend/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json  ./packages/types/
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/backend/dist   ./apps/backend/dist
COPY --from=builder /app/packages/config/src ./packages/config/src
COPY --from=builder /app/packages/types/src  ./packages/types/src

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

CMD ["node", "apps/backend/dist/server.js"]