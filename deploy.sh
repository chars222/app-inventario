#!/bin/bash

# ========================================
# Script de Deploy en Hetzner
# ========================================

set -e  # Salir en caso de error

echo "🚀 Iniciando deploy en Hetzner..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Actualizar repositorio
echo -e "${YELLOW}1️⃣  Actualizando código...${NC}"
git pull origin main || { echo -e "${RED}Error en git pull${NC}"; exit 1; }

# 2. Copiar .env de producción
echo -e "${YELLOW}2️⃣  Configurando variables de entorno...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Falta .env.production - Crear desde .env.production.example${NC}"
    exit 1
fi

# 3. Detener contenedores anteriores
echo -e "${YELLOW}3️⃣  Deteniendo contenedores anteriores...${NC}"
docker-compose down || true

# 4. Construir imágenes
echo -e "${YELLOW}4️⃣  Construyendo imágenes Docker...${NC}"
docker-compose build --no-cache || { echo -e "${RED}Error en build${NC}"; exit 1; }

# 5. Iniciar servicios
echo -e "${YELLOW}5️⃣  Iniciando servicios...${NC}"
docker-compose up -d || { echo -e "${RED}Error iniciando servicios${NC}"; exit 1; }

# 6. Esperar a que la BD esté lista
echo -e "${YELLOW}6️⃣  Esperando a que PostgreSQL esté listo...${NC}"
sleep 10

# 7. Ejecutar migraciones
echo -e "${YELLOW}7️⃣  Ejecutando migraciones de Prisma...${NC}"
docker-compose exec -T backend npx prisma migrate deploy || { echo -e "${RED}Error en migraciones${NC}"; exit 1; }

# 8. Ejecutar seed (opcional)
echo -e "${YELLOW}8️⃣  ¿Ejecutar seed? (s/n)${NC}"
read -r response
if [ "$response" = "s" ]; then
    docker-compose exec -T backend curl -X POST http://localhost:3000/seed || echo "Seed completado (o es la primera ejecución)"
fi

# 9. Ver logs
echo -e "${YELLOW}9️⃣  Verificando logs...${NC}"
docker-compose logs -f --tail=50

echo -e "${GREEN}✅ Deploy completado!${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}⚙️  Backend: http://localhost:3001${NC}"
echo -e "${GREEN}🗄️  Database: localhost:5432${NC}"
