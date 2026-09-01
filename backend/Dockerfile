# ── Build stage ──────────────────────────────────────────────────────────────
# Compile TypeScript to JavaScript so the final image only needs Node,
# not the TypeScript toolchain.
FROM node:26-alpine AS builder

WORKDIR /app

# Install dependencies first — separate layer so Docker can cache it
# and skip re-installing when only source files change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
# Start fresh from a clean image — no TypeScript compiler, no dev deps,
# just the compiled JS and production dependencies.
FROM node:26-alpine AS production

WORKDIR /app

# Only install production dependencies.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled output from the builder stage.
COPY --from=builder /app/dist ./dist

# The app reads config from environment variables at runtime.
# Do NOT copy .env — secrets are injected by ECS task definition.
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
