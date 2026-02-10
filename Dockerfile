# ============================================
# Multi-Stage Dockerfile for Chess Learning PWA
# Optimized for minimal image size (<50MB)
# ============================================

# ============================================
# Stage 1: Dependencies (cached layer)
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies only (with cache mount for speed)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --ignore-scripts

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

# Copy source code
COPY . .

# Build TypeScript and bundle with Vite
# This creates optimized production files in ./dist
RUN npm run build

# ============================================
# Stage 3: Production (minimal runtime)
# ============================================
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy assets (directly accessible)
COPY --from=builder /app/assets /usr/share/nginx/html/assets

# Create nginx user for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    # Create cache directory
    mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    # Create log directory  
    mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expose port 80
EXPOSE 80

# Run as non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Image size: ~50MB (nginx:alpine + dist)
# ============================================
