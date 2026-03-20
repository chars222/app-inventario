# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generar Prisma Client y compilar TypeScript
RUN npx prisma generate
RUN npx tsc --outDir dist --skipLibCheck 2>/dev/null || true

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

# Copiar todo como root antes de cambiar usuario
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma-client ./prisma-client
COPY package*.json ./

# Dar permisos a todo antes de cambiar a usuario node
RUN chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/index.js"]
