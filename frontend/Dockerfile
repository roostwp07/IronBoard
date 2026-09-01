# ── Build stage ───────────────────────────────────────────────────────────────
# Use Node to run Vite and compile the React app into static files.
FROM node:26-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

RUN npm run build
# Output lands in /app/dist as plain HTML, CSS, and JS.

# ── Production stage ──────────────────────────────────────────────────────────
# nginx is a tiny, fast static file server — perfect for serving a
# React app. No Node needed at runtime.
FROM nginx:alpine AS production

# Replace the default nginx config with ours.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files into nginx's serving directory.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
