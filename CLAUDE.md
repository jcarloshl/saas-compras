# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-user SaaS shopping list platform. Users authenticate via JWT and manage their own shopping lists with items. Deployed on Railway (PostgreSQL + backend + frontend as separate services).

## Development Commands

### Backend

```bash
cd backend

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server (SQLite, port 5000)
FLASK_ENV=development python app.py

# Run with waitress (production-style local)
waitress-serve --host=0.0.0.0 --port=5000 app:app
```

### Frontend

```bash
cd frontend

npm install
npm start        # Dev server → http://localhost:3000
npm run build    # Production build
```

### Environment Setup

For local development, the backend auto-uses SQLite (`backend/instance/compras_local.db`) — no PostgreSQL needed.

```
# backend/.env
FLASK_ENV=development
SECRET_KEY=dev-secret-key

# frontend/.env
REACT_APP_API_URL=http://localhost:5000
```

Production-only env vars (Railway):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL URL (auto-provided by Railway) |
| `SECRET_KEY` | JWT signing key |
| `FRONTEND_URL` | Frontend URL for password reset links (e.g. `https://app.railway.app`) |
| `EMAIL_REMITENTE` | Gmail address for sending reset emails |
| `EMAIL_PASSWORD` | Gmail App Password (16-char, not account password) |

Without `EMAIL_REMITENTE`/`EMAIL_PASSWORD`, `forgot-password` still works — the reset link is printed to server logs instead of sent by email.

## Architecture

### Backend (`backend/`)

Flat Flask app — no blueprints. All routes live in `app.py`.

- `config.py` — Config classes selected by `FLASK_ENV`: `DevelopmentConfig` (SQLite), `ProductionConfig` (PostgreSQL via `DATABASE_URL`), `TestingConfig` (in-memory SQLite). Railway's `postgres://` URLs are rewritten to `postgresql://` here. Also defines `CATEGORIAS` (11 fixed categories) and `FRONTEND_URL`.
- `models.py` — Five SQLAlchemy models: `User → ShoppingList → ShoppingItem` (cascading deletes), `PurchaseHistory` (standalone, no cascade), and `CatalogItem` (user_id + articulo unique per user). `CatalogItem` is upserted automatically when an item is added to a list. `PurchaseHistory` is written when an item's `comprado` is toggled `true` in the PUT endpoint (not on reset). `PurchaseHistory.list_id` is a plain `Integer` with **no FK constraint** — purchase history is intentionally preserved when a list is deleted. `_es_comprado()` helper is defined here but is **not currently used** anywhere (imported in `app.py` but never called; stats use `it['comprado']` directly).
- `auth.py` — Manual JWT implementation using PyJWT. `@token_required` decorator injects `user_id` as first arg to protected routes. Tokens expire in 30 days.
- `app.py` — All REST routes. Multi-tenancy enforced by checking `lst.user_id == user_id` before every list/item operation.

### Backend Route Map

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                          @token_required
POST   /api/auth/forgot-password             generates JWT reset token, sends email async
POST   /api/auth/reset-password              validates token fingerprint, updates password

GET    /api/lists                            @token_required
POST   /api/lists
GET    /api/lists/<id>
DELETE /api/lists/<id>

GET    /api/lists/<id>/items                 returns { items: [...], stats: {...} }
POST   /api/lists/<id>/items
PUT    /api/lists/<id>/items/<item_id>        fields: comprado, cantidad, categoria, agregado_por (NOT articulo — items cannot be renamed)
DELETE /api/lists/<id>/items/<item_id>
POST   /api/lists/<id>/reset
GET    /api/lists/<id>/catalog               global: all items from ALL user's lists

GET    /api/history                          @token_required — ?period=YYYY-MM or 'all'

GET    /api/catalog                          @token_required — list user's catalog entries
PUT    /api/catalog/<id>                     update articulo or categoria
DELETE /api/catalog/<id>                     remove entry

GET    /health
```

### Password Recovery Flow

Uses JWT-based stateless tokens (no extra DB table). The token payload contains a `pwd_fp` fingerprint (last 12 chars of the password hash) — if the password changes after the token is issued, the fingerprint no longer matches and the token is rejected. Expiry: 1 hour. Email is sent via `threading.Thread` (daemon) so the HTTP response is never blocked by SMTP.

### Frontend (`frontend/src/`)

- `api.js` — Single Axios instance with base URL from `REACT_APP_API_URL`. Request interceptor injects `Bearer` token from `localStorage`. Response interceptor redirects to `/login` on 401. Exports five named API objects: `authAPI`, `listsAPI`, `itemsAPI`, `historyAPI`, `catalogAPI`.
- `AuthContext.js` — React context providing `{ user, token, loading, login, register, logout }`. Persists session to `localStorage`.
- `App.js` — React Router v6 with lazy-loaded pages. `ProtectedRoute` wrapper redirects unauthenticated users to `/login`.
- Pages: `LoginPage` (login + register tabs, with "¿Olvidaste tu contraseña?" link), `DashboardPage` (list of user's lists), `ListPage` (items within a list), `ForgotPasswordPage` (`/forgot-password`), `ResetPasswordPage` (`/reset-password?token=...`), `HistoryPage` (`/history` — purchased items by period), `CatalogPage` (`/catalog` — manage autocomplete suggestions: edit name/category, delete).

### ListPage data loading pattern

`fetchData` uses **three independent `try/catch` blocks** in priority order — not `Promise.all`. This ensures items always render even if secondary calls fail:
1. `itemsAPI.getAll(id)` — critical, failure shows error
2. `listsAPI.get(id)` — non-critical (navbar title), failure ignored silently
3. `itemsAPI.getCatalog(id)` — non-critical (autocomplete), failure ignored silently

`handleToggle` and `handleDelete` use **optimistic UI updates** — the local state is updated immediately and reverted on API failure.

### Autocomplete (catalog)

Two catalog endpoints with different data sources:
- `GET /api/lists/<id>/catalog` — combines `CatalogItem` entries (persistent catalog) with `ShoppingItem` fallbacks from all user lists. Used by `ListPage` for autocomplete; deduplicates by `articulo.lower()`.
- `GET /api/catalog` — returns only `CatalogItem` table entries. Used by `CatalogPage` for management (edit/delete).

In `ListPage`, suggestions appear after 2 characters, up to 6 results. `onMouseDown` (not `onClick`) is used on suggestion items to prevent `onBlur` from closing the dropdown before the click registers.

### Deployment (Railway)

- **Backend service**: root `Procfile` — `web:` runs `waitress-serve`, `release:` runs `db.create_all()` on each deploy (no migration tool — schema is additive-only, new columns require manual `ALTER TABLE` or a new model). `db.create_all()` is also called at module level in `app.py` so it runs automatically on dev startup too.
- **Frontend service**: deploys from `frontend/` directory — `frontend/Procfile` serves the static build with `./node_modules/.bin/serve -s build -l $PORT` (uses the locally installed `serve` package, not `npx serve`).
- `backend/nixpacks.toml` pins Python 3.11 and includes `postgresql` nix package (needed for `psycopg2` source build).

## Key Conventions

- All API routes are prefixed `/api/`. Health check at `/health`.
- `CATEGORIAS` is defined in `config.py` (backend), `ListPage.js`, and `HistoryPage.js` (both frontend). **`ListPage.js` is out of sync with the backend**: it has `"Enlatados y Conservas"` and `"Limpieza"` instead of `"Almacén / Despensa"` and `"Limpieza del Hogar"`. `HistoryPage.js` uses the backend-aligned names. Must be kept in sync manually when modified. Both `ListPage.js` and `HistoryPage.js` have their own `CATEGORIA_COLORS` map (Bootstrap color per category) that must also be updated alongside `CATEGORIAS`.
- `comprado` (boolean) is the purchase state field on `ShoppingItem`.
- `agregado_por` tracks who added an item (free-text string, supports family multi-user within one account).
- The `backend/venv/` directory is the active virtual environment. Ignore `backend/venvcd/` and `backend/backend/` (stale).
- There are currently **no tests** in this repo (no `backend/tests/` directory, no `*.test.js` files in frontend).
