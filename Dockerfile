# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar la aplicación Vite
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Production (Nginx)
FROM node:18-alpine

WORKDIR /app

# Instalar dumb-init
RUN apk add --no-cache dumb-init

# Copiar node_modules del builder solo si se necesita para runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Crear usuario
USER node

# Exponer puerto
EXPOSE 5173

ENTRYPOINT ["dumb-init", "--"]

# Comando para servir la aplicación
CMD ["npm", "run", "preview", "--", "--host"]
