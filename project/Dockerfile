### Multi-stage Dockerfile for Vite + React production build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (including dev deps needed to build)
COPY package.json package-lock.json* ./
RUN npm install --silent

# Copy sources and build
COPY . .
RUN npm run build

# Production image: serve built assets with nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
