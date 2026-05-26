# Dockerización del proyecto

Este repositorio ya está preparado para ejecutarse en Docker con:

- `backend` en Flask + Waitress
- `frontend` en React + Nginx
- `db` en PostgreSQL

## Archivos relevantes

- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `backend/.dockerignore`
- `frontend/.dockerignore`

## Instrucciones generales

1. Colocar el repositorio en la NAS o en un servidor que tenga Docker/Docker Compose.
2. Desde la carpeta raíz del proyecto ejecutar:

```bash
docker compose up --build
```

3. Abrir en el navegador:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## Variables de entorno

El servicio `backend` utiliza estas variables:

- `FLASK_ENV=production`
- `SECRET_KEY` (obligatoria en producción)
- `DATABASE_URL` (usa PostgreSQL interno del compose por defecto)
- `FRONTEND_URL` (URL pública del frontend, usada en los enlaces de recuperación de contraseña)

Si usas la configuración del `docker-compose.yml` incluida, no necesitas cambiar nada para arranque local.

## Uso en Synology NAS

### Opción 1: DSM Container Manager

1. Copia el repositorio a una carpeta en el NAS, por ejemplo `/volume1/docker/saas-compras`.
2. Abre `Container Manager` y usa "Crear contenedor" con `docker-compose.yml`, si tu DSM soporta Docker Compose.
3. Mapea puertos:
   - `3000` al frontend
   - `5000` al backend
4. Crea un volumen o carpeta local para PostgreSQL si quieres persistencia adicional.

### Opción 2: línea de comandos SSH

1. Accede por SSH a la NAS.
2. Ve a la carpeta del proyecto:

```bash
cd /volume1/docker/saas-compras
```

3. Ejecuta:

```bash
docker compose up --build -d
```

4. Comprueba los contenedores:

```bash
docker compose ps
```

## Ajustes para producción en NAS

- Si no quieres exponer el backend en `localhost:5000`, puedes usar un proxy inverso de Synology o cambiar el puerto en `docker-compose.yml`.
- Para un dominio público recuerda actualizar `FRONTEND_URL` con la URL real del frontend.

## Cómo verificar que funciona

1. Abre `http://<tu-nas-ip>:3000`.
2. Registra un usuario y haz login.
3. Revisa que las peticiones a `/api` respondan correctamente.

## Notas adicionales

- El frontend está compilado y servido por Nginx.
- El backend crea la base de datos automáticamente en el primer arranque.
- El envío de correo de recuperación usa `EMAIL_REMITENTE` y `EMAIL_PASSWORD` si se configuran.

---

Si quieres, puedo también crear una versión alternativa de `docker-compose.override.yml` para adaptar puertos o montar volúmenes específicos de Synology.