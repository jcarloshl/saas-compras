# SaaS Lista de Compras - Backend + Frontend

Plataforma SaaS multi-usuario para administrar listas de compras familiares con autenticación JWT y persistencia en PostgreSQL (Railway).

## 🎯 Características

- ✅ Autenticación con JWT (login/registro)
- ✅ CRUD completo de listas y artículos por usuario
- ✅ Multi-tenancy: cada usuario sus propios datos
- ✅ Estadísticas en tiempo real (total, comprados, pendientes, %)
- ✅ Autocompletar artículos
- ✅ API REST con CORS habilitado
- ✅ Frontend React + Axios
- ✅ Deployment en Railway (PostgreSQL + Backend + Frontend)

## 🛠️ Tech Stack

**Backend:**
- Flask 2.3
- SQLAlchemy ORM
- JWT Auth
- PostgreSQL (Railway)
- Gunicorn

**Frontend:**
- React 18
- Axios
- React Router
- Bootstrap 5

## 📋 Requisitos

- Python 3.9+
- Node.js 16+
- Git
- Cuenta [Railway.app](https://railway.app) (gratis)

## 🚀 Setup Local

### Backend

1. **Clonar y configurar**
   ```bash
   git clone <repo-url>
   cd saas-compras
   cp .env.example .env
   ```

2. **Crear entorno virtual**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Variables de entorno**
   ```bash
   # En backend/.env
   FLASK_ENV=development
   SECRET_KEY=dev-secret-key
   ```

4. **Ejecutar servidor**
   ```bash
   python app.py
   # → http://localhost:5000
   ```

5. **Probar API**
   ```bash
   # Register
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"pass123","username":"Test User"}'

   # Login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"pass123"}'
   ```

### Frontend

1. **Setup**
   ```bash
   cd frontend
   npm install
   ```

2. **Variables de React**
   ```bash
   # frontend/.env
   REACT_APP_API_URL=http://localhost:5000
   ```

3. **Ejecutar app**
   ```bash
   npm start
   # → http://localhost:3000
   ```

## 📡 Deployment en Railway

### 1. Crear cuenta Railway
- Ir a [railway.app](https://railway.app)
- Sign up con GitHub, Google o email

### 2. Crear nuevo proyecto

**Opción A: Desde GitHub (recomendado)**
```bash
# 1. Push código a GitHub
git remote add origin <tu-repo>
git push -u origin main

# 2. En railway.app: New Project → GitHub Repo → conectar
```

**Opción B: Desde CLI**
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Crear proyecto
railway init

# Deploy
railway up
```

### 3. Configurar Base de Datos PostgreSQL

1. En Railway dashboard: Add → PostgreSQL
2. Railway genera `DATABASE_URL` automáticamente
3. Vincularlo al backend: Variables → DATABASE_URL ← PostgreSQL

### 4. Configurar Backend

1. En Railway: Add → GitHub Repo
2. Seleccionar rama `main`
3. Build command: (dejar en blanco o `pip install -r requirements.txt`)
4. Start command: `gunicorn backend.app:app`
5. Port: 5000

**Variables de entorno en Railway:**
```
FLASK_ENV=production
SECRET_KEY=<generar-aleatoriamente>
EMAIL_REMITENTE=<tu-email>
EMAIL_PASSWORD=<app-password>
```

### 5. Configurar Frontend

1. En Railway: Add → GitHub Repo (rama main, directorio: frontend)
2. Build command: `npm build`
3. Start command: `npm start` o usar Static Build
4. Environment:
   ```
   REACT_APP_API_URL=https://<backend-url>.railway.app
   ```

### 6. Conectar Dominios

En Railway → Project → Domains:
```
- backend: https://saas-compras-api.railway.app
- frontend: https://saas-compras.railway.app
```

## 📊 Estructura de Base de Datos

```sql
-- Users
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100),
  password_hash VARCHAR(255),
  created_at TIMESTAMP
);

-- Shopping Lists
CREATE TABLE shopping_lists (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  name VARCHAR(200),
  created_at TIMESTAMP
);

-- Shopping Items
CREATE TABLE shopping_items (
  id INT PRIMARY KEY,
  list_id INT REFERENCES shopping_lists(id),
  articulo VARCHAR(200),
  cantidad VARCHAR(50),
  categoria VARCHAR(100),
  comprado BOOLEAN,
  created_at TIMESTAMP
);
```

## 🔑 API Endpoints

### Auth
```
POST   /api/auth/register      { email, password, username }
POST   /api/auth/login         { email, password }
GET    /api/auth/me            (Bearer token)
```

### Listas
```
GET    /api/lists              (mi lista principal)
POST   /api/lists              { name }
GET    /api/lists/<id>         (detalle con items)
DELETE /api/lists/<id>
```

### Items
```
GET    /api/lists/<id>/items           (items + stats)
POST   /api/lists/<id>/items           { articulo, cantidad, categoria, agregado_por }
PUT    /api/lists/<id>/items/<id>      { comprado }
DELETE /api/lists/<id>/items/<id>
```

### Utilidades
```
POST   /api/lists/<id>/reset           (limpiar lista)
GET    /api/lists/<id>/catalog         (autocompletar)
```

## 🧪 Testing

```bash
# Backend - pytest (cuando esté configurado)
cd backend
pytest tests/

# Frontend - jest (cuando esté configurado)
cd frontend
npm test
```

## 📝 Migración del Proyecto Original

El nuevo SaaS reutiliza la lógica del proyecto original:

- ✅ Categorías (las 11 del proyecto)
- ✅ Validaciones (artículo no vacío, etc.)
- ✅ Estadísticas
- ✅ Lógica de `_es_comprado()`

Cambios principales:
- Google Sheets → PostgreSQL
- Sin autenticación → JWT
- HTML/Jinja2 → React SPA

## 🐛 Troubleshooting

**Railway deployment falla:**
```bash
# Ver logs en Railway dashboard
# O vía CLI:
railway logs
```

**Database no se conecta:**
```bash
# Verificar DATABASE_URL está en Railway
# En railway.app: Project → Variables → DATABASE_URL
```

**CORS error en frontend:**
```bash
# Backend tiene CORS habilitado, pero verifica:
# - REACT_APP_API_URL correcto en .env
# - Backend URL accesible desde frontend
```

## 📚 Documentación Adicional

- [Flask SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- [JWT en Python](https://pyjwt.readthedocs.io/)
- [Railway Docs](https://docs.railway.app/)
- [React Hooks](https://react.dev/reference/react)

## 📄 Licencia

MIT

## 👤 Autor

Desarrollado como SaaS escalable desde el proyecto original "Lista de Compras Familiar".
