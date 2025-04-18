# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json ./
RUN npm i


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

# MongoDB environment variables
ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI

ARG MONGODB_CLUSTER
ENV MONGODB_CLUSTER=$MONGODB_CLUSTER

ARG MONGODB_DATABASE
ENV MONGODB_DATABASE=$MONGODB_DATABASE

# Encryption environment variables
ARG ENCRYPTION_KEY
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY

ARG NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY
ENV NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY=$NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY

ARG ENCRYPTION_IV
ENV ENCRYPTION_IV=$ENCRYPTION_IV

# NextAuth environment variables
ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL

# Set NODE_ENV for the build
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Google OAuth environment variables
ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Facebook OAuth environment variables
ARG FACEBOOK_CLIENT_ID
ENV FACEBOOK_CLIENT_ID=$FACEBOOK_CLIENT_ID

ARG FACEBOOK_CLIENT_SECRET
ENV FACEBOOK_CLIENT_SECRET=$FACEBOOK_CLIENT_SECRET

# AWS S3 environment variables
# In ECS, these will be ignored and the application will use the IAM role:
ARG AWS_REGION
ENV AWS_REGION=$AWS_REGION

ARG AWS_ACCESS_KEY_ID
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID

ARG AWS_SECRET_ACCESS_KEY
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

ARG S3_BUCKET_NAME
ENV S3_BUCKET_NAME=$S3_BUCKET_NAME

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from the build stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy environment variables from build args
ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI
ARG MONGODB_CLUSTER
ENV MONGODB_CLUSTER=$MONGODB_CLUSTER
ARG MONGODB_DATABASE
ENV MONGODB_DATABASE=$MONGODB_DATABASE
ARG ENCRYPTION_KEY
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ARG NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY
ENV NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY=$NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY
ARG ENCRYPTION_IV
ENV ENCRYPTION_IV=$ENCRYPTION_IV
ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ARG FACEBOOK_CLIENT_ID
ENV FACEBOOK_CLIENT_ID=$FACEBOOK_CLIENT_ID
ARG FACEBOOK_CLIENT_SECRET
ENV FACEBOOK_CLIENT_SECRET=$FACEBOOK_CLIENT_SECRET
ARG AWS_REGION
ENV AWS_REGION=$AWS_REGION
ARG AWS_ACCESS_KEY_ID
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ARG S3_BUCKET_NAME
ENV S3_BUCKET_NAME=$S3_BUCKET_NAME

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