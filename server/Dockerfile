# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# OpenSSL necesario para Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npx tsc --outDir dist --skipLibCheck 2>/dev/null || true

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# OpenSSL necesario en runtime también
RUN apk add --no-cache dumb-init openssl

# Copiar como root
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma-client ./prisma-client
COPY package*.json ./

# Permisos antes de cambiar usuario
RUN chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/index.js"]
