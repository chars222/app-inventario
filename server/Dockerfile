# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npx tsc --outDir dist --skipLibCheck 2>/dev/null || true
# Copiar prisma-client dentro de dist para que el import relativo funcione
RUN cp -r prisma-client dist/prisma-client

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

RUN chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/index.js"]
