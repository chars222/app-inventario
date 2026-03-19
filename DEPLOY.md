# 🚀 Guía de Deploy en Hetzner

## Requisitos Previos

- Docker y Docker Compose instalados en el servidor Hetzner
- Git configurado
- Un dominio o IP pública

## Pasos de Instalación

### 1️⃣ Clonar el repositorio en Hetzner

```bash
git clone https://github.com/tu-usuario/mi-app-inventario.git
cd mi-app-inventario
```

### 2️⃣ Crear archivo `.env.production`

```bash
cp .env.production.example .env.production
```

Editar `.env.production` con valores de producción:

```bash
nano .env.production
```

**Cambios obligatorios:**
- `VITE_API_URL`: Cambiar a `https://api.tudominio.com` (o IP del servidor)
- `SECRET_KEY`: Generar con `openssl rand -hex 32`
- `CORS_ORIGIN`: Cambiar a tu dominio

### 3️⃣ Dale permisos de ejecución al script de deploy

```bash
chmod +x deploy.sh
```

### 4️⃣ Ejecutar el deploy

```bash
./deploy.sh
```

O si prefieres manualmente:

```bash
docker-compose up -d
```

## Verificación

### Ver logs en tiempo real

```bash
docker-compose logs -f
```

### Ver estado de contenedores

```bash
docker-compose ps
```

### Acceder a la base de datos

```bash
docker-compose exec db psql -U admin -d inventory_app
```

## Configuración de Nginx (Reverso Proxy)

Si usas Nginx en Hetzner, añade esta configuración:

```nginx
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:5173;
}

server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;
    
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Actualizar el código en vivo

```bash
git pull origin main
docker-compose down
docker-compose up -d
docker-compose exec -T backend npx prisma migrate deploy
```

O usa el script:

```bash
./deploy.sh
```

## Troubleshooting

### El backend no se conecta a la BD

```bash
docker-compose logs backend
```

Verifica que el `DATABASE_URL` en `.env.production` usa `db` como host (no `localhost`).

### El frontend no carga

Verifica que `VITE_API_URL` apunta al backend correcto.

### Limpiar todo y empezar de cero

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

## Backups

### Backup de la base de datos

```bash
docker-compose exec db pg_dump -U admin inventory_app > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
docker-compose exec -T db psql -U admin inventory_app < backup_fecha.sql
```

## Monitoreo

Monitorea CPU, memoria y disco:

```bash
docker stats
```

Ver logs con filtro

```bash
docker-compose logs backend --tail 100 -f
docker-compose logs frontend --tail 100 -f
docker-compose logs db --tail 100 -f
```

## ¿Necesitas SSL/HTTPS?

Usa Certbot + Let's Encrypt:

```bash
sudo apt update && sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tudominio.com -d www.tudominio.com
```

Luego actualiza la configuración de Nginx con los certificados.

---

**¡Listo! Tu aplicación debe estar corriendo en Hetzner 🎉**
