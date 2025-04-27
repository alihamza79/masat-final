# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Set production as default environment
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV \
    NEXT_TELEMETRY_DISABLED=1


# Stage for updating the lock file
FROM base AS deps-updater
WORKDIR /app
COPY package.json ./
# Update the lock file
RUN npm install --package-lock-only


# Install dependencies only when needed
# Install dependencies with the updated lock file
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY --from=deps-updater /app/package-lock.json ./
# Now npm ci should work fine
RUN npm ci


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Set environment variables first - these rarely change
ARG NEXTAUTH_URL
ARG S3_BUCKET_NAME
ARG SES_SOURCE_EMAIL
ARG AWS_REGION
ARG MONGODB_URI
ARG ENCRYPTION_KEY
ARG NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY
ARG NEXTAUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG FACEBOOK_CLIENT_ID
ARG FACEBOOK_CLIENT_SECRET
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

ENV NEXTAUTH_URL=$NEXTAUTH_URL \
    S3_BUCKET_NAME=$S3_BUCKET_NAME \
    SES_SOURCE_EMAIL=$SES_SOURCE_EMAIL \
    AWS_REGION=$AWS_REGION \
    MONGODB_URI=$MONGODB_URI \
    ENCRYPTION_KEY=$ENCRYPTION_KEY \
    NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY=$NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY \
    NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
    GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
    FACEBOOK_CLIENT_ID=$FACEBOOK_CLIENT_ID \
    FACEBOOK_CLIENT_SECRET=$FACEBOOK_CLIENT_SECRET \
    AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY


COPY --from=deps /app/node_modules ./node_modules

# Copy package.json - needed for the build process
COPY package.json ./
# Copy configuration files next - these change occasionally
COPY next.config.mjs tsconfig*.json ./

COPY public ./public
COPY src ./src

# Prune development dependencies
RUN npm prune --production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for better security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.next && \
    chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
# Copy the entire .next directory
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# Copy public directory
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Copy the standalone directory structure if it exists (ensuring it doesn't fail if missing)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/ ./


USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]