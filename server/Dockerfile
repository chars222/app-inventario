# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Instalar dumb-init para mejor manejo de señales
RUN apk add --no-cache dumb-init

# Copiar node_modules del builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar el resto de archivos
COPY --chown=node:node . .

# Crear usuario node y usar su cuenta
USER node

# Exponer puerto
EXPOSE 3000

# Usar dumb-init para ejecutar el proceso principal
ENTRYPOINT ["dumb-init", "--"]

# Comando por defecto
CMD ["node", "index.ts"]
