### Dockerfile for Node API (Express + Prisma)
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps (dev deps needed to run prisma generate)
COPY package.json package-lock.json* ./
RUN npm install --silent

# Copy prisma schema early for generate
COPY prisma ./prisma
RUN npx prisma generate || true

# Copy rest of sources
COPY . .

# Remove dev deps to keep image small
RUN npm prune --production --silent || true

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
EXPOSE 3001
CMD ["node", "server/index.js"]
