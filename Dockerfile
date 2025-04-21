# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

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

COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Set NODE_ENV for the build
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Next.js collects completely anonymous telemetry data about general usage.
# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1

# These non-sensitive build arguments are OK to use in the Dockerfile
ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL

ARG S3_BUCKET_NAME
ENV S3_BUCKET_NAME=$S3_BUCKET_NAME

ARG SES_SOURCE_EMAIL
ENV SES_SOURCE_EMAIL=$SES_SOURCE_EMAIL

ARG AWS_REGION
ENV AWS_REGION=$AWS_REGION

# MongoDB environment variables
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

# Set these temporarily for the build process only
ENV MONGODB_URI=$MONGODB_URI \
    ENCRYPTION_KEY=$ENCRYPTION_KEY \
    NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY=$NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY \
    NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
    GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
    FACEBOOK_CLIENT_ID=$FACEBOOK_CLIENT_ID \
    FACEBOOK_CLIENT_SECRET=$FACEBOOK_CLIENT_SECRET \
    AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY


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

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from the build stage
COPY --from=builder /app/public ./public
# No need to copy node_modules as they're included in the standalone output
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]