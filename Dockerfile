# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Compile TypeScript server files that server.js needs (these aren't bundled by SvelteKit)
RUN mkdir -p build/lib/server && \
    npx tsc src/lib/server/*.ts \
    --outDir build/lib/server \
    --module esnext \
    --target es2022 \
    --moduleResolution node \
    --esModuleInterop \
    --skipLibCheck \
    --resolveJsonModule

# Production stage
FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js ./

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
