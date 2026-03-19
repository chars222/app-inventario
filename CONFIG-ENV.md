# Configuración de Variables de Entorno

Este proyecto utiliza archivos `.env` para gestionar la configuración de desarrollo sin hardcodear valores sensibles.

## 📁 Archivos de Configuración

### Frontend - `.env` (Raíz del proyecto)

```env
# Frontend Configuration
# Change this to match your backend server IP/URL
VITE_API_URL=http://192.168.0.9:3000
VITE_APP_NAME=Inventory Pro App
```

**Ubicación**: `/mi-app-inventario/.env`

#### Variables Disponibles:
- `VITE_API_URL` - URL del backend (default: `http://localhost:3000`)
- `VITE_APP_NAME` - Nombre de la aplicación

### Backend - `.env` (Carpeta server/)

```env
# Environment variables for Backend Server

# ========== DATABASE ==========
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_app?schema=public"

# ========== SERVER ==========
PORT=3000
SECRET_KEY=tu_secreto_super_seguro_cambialo_en_prod

# ========== CORS ==========
CORS_ORIGIN=*

# ========== ENVIRONMENT ==========
NODE_ENV=development
```

**Ubicación**: `/mi-app-inventario/server/.env`

#### Variables Disponibles:
- `DATABASE_URL` - Cadena de conexión PostgreSQL
- `PORT` - Puerto del servidor (default: 3000)
- `SECRET_KEY` - Clave para firmar JWT (⚠️ CAMBIAR EN PRODUCCIÓN)
- `CORS_ORIGIN` - Origen CORS permitido (default: `*`)
- `NODE_ENV` - Entorno (development, staging, production)

---

## 🚀 Cómo Usarlos

### 1. Copiar Archivos de Ejemplo

```bash
# Frontend
cp .env.example .env

# Backend
cp server/.env.example server/.env
```

### 2. Editar Según tu Entorno Local

#### Para Desarrollo Local

**Frontend (`.env`)**:
```env
VITE_API_URL=http://localhost:3000
```

**Backend (`server/.env`)**:
```env
port=3000
SECRET_KEY=desarrollo_secret_cambiar_en_prod
CORS_ORIGIN=*
NODE_ENV=development
```

#### Para Red Local (Múltiples Máquinas)

Si trabajas con el backend en otra máquina/IP:

**Frontend (`.env`)**:
```env
VITE_API_URL=http://192.168.0.9:3000
```

**Backend (`server/.env`)** en `192.168.0.9`:
```env
PORT=3000
CORS_ORIGIN=http://192.168.0.100:3000
NODE_ENV=development
```

#### Para Producción

**Frontend (`.env`)**:
```env
VITE_API_URL=https://api.tu-dominio.com
VITE_APP_NAME=Inventory Pro App
```

**Backend (`server/.env`)**:
```env
PORT=3000
SECRET_KEY=GENERATE_SECURE_KEY_HERE
CORS_ORIGIN=https://tu-dominio.com
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@prod-db:5432/inventory_prod
```

---

## 🔐 Seguridad

### ⚠️ NUNCA COMMITEJES ARCHIVOS `.env`

Los archivos `.env` están en `.gitignore` por defecto. En caso de que se añada accidentalmente:

```bash
# Eliminar del historio de git
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### Generar SECRET_KEY Segura

En Node.js:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

En Python:
```python
import secrets
secrets.token_hex(32)
```

---

## 📝 Notas Importantes

1. **Variables de Entorno en Vite**
   - Deben prefijarse con `VITE_` para ser expuestas en el bundle
   - Se acceden con `import.meta.env.VITE_*`

2. **Variables de Entorno en Node.js**
   - Se acceden con `process.env.*`
   - Requiere instalar `dotenv` (ya está en dependencias)

3. **Cargar Variables en Desarrollo**
   - Frontend: Vite lo hace automáticamente
   - Backend: Agregamos `import 'dotenv/config'` en `index.ts`

---

## ✅ Checklist de Configuración

- [ ] Copiar `.env.example` a `.env` (Frontend y Backend)
- [ ] Actualizar `VITE_API_URL` con la IP/URL correcta
- [ ] Generar una `SECRET_KEY` nueva (no usar default)
- [ ] Verificar `DATABASE_URL` y credenciales PostgreSQL
- [ ] Testear conexión: `npm run dev` (Frontend) + `npm run dev` (Backend)
- [ ] No commitar archivos `.env` al repositorio

---

¿Preguntas? Revisa los archivos `.env.example` o contacta al equipo.
