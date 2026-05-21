FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install --no-frozen-lockfile --ignore-scripts
RUN pnpm approve-builds 2>/dev/null || true
RUN pnpm install --no-frozen-lockfile

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]