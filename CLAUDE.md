# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-user SaaS shopping list platform. Users authenticate via JWT and manage their own shopping lists with items. Deployed on Railway (PostgreSQL + backend + frontend as separate services). Also runs locally via Docker Compose (see `DOCKER.md`).

## Development Commands

### Backend

```bash
cd backend
venv\Scripts\activate        # Windows — activate virtual environment

pip install -r requirements.txt
FLASK_ENV=development python app.py   # SQLite, port 5000
waitress-serve --host=0.0.0.0 --port=5000 app:app  # production-style local
```

### Frontend

```bash
cd frontend
npm install
npm start        # Dev server → http://localhost:3000
npm run build    # Production build (also used to verify no compile errors)
```

### Docker (local / NAS)

```bash
docker compose up --build    # Frontend :3000, Backend :5000, PostgreSQL
docker compose up --build -d # Detached (background)
```

### Environment Setup

```
# backend/.env
FLASK_ENV=development
SECRET_KEY=dev-secret-key

# frontend/.env
REACT_APP_API_URL=http://localhost:5000
```

Production env vars (Railway):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL URL (auto-provided by Railway) |
| `SECRET_KEY` | JWT signing key |
| `FRONTEND_URL` | Frontend URL for password reset links |
| `EMAIL_REMITENTE` | Gmail address for sending reset emails |
| `EMAIL_PASSWORD` | Gmail App Password (16-char) |

Without `EMAIL_REMITENTE`/`EMAIL_PASSWORD`, `forgot-password` still works — the reset link is printed to server logs.

## Architecture

### Backend (`backend/`)

Flat Flask app — no blueprints. All routes live in `app.py`.

- `config.py` — Config classes selected by `FLASK_ENV`: `DevelopmentConfig` (SQLite), `ProductionConfig` (PostgreSQL via `DATABASE_URL`), `TestingConfig` (in-memory SQLite). Railway's `postgres://` URLs are rewritten to `postgresql://` here. Also defines `CATEGORIAS` (11 fixed categories) and `FRONTEND_URL`.
- `models.py` — Five SQLAlchemy models: `User → ShoppingList → ShoppingItem` (cascading deletes), `PurchaseHistory` (standalone, no cascade), and `CatalogItem` (user_id + articulo unique per user). `ShoppingList.monto_total` (Float, nullable) records the total spent on a shopping trip — captured from `ShoppingModePage`, not `DashboardPage`. `CatalogItem` is upserted automatically when an item is added to a list. `PurchaseHistory` is written when `comprado` is toggled `true` in the PUT endpoint (not on reset). `PurchaseHistory.list_id` is a plain `Integer` with **no FK constraint** — history is preserved when a list is deleted. `_es_comprado()` is defined but never called (dead code).
- `auth.py` — Manual JWT via PyJWT. `@token_required` decorator injects `user_id` as first arg. Tokens expire in 30 days.
- `app.py` — All REST routes. Multi-tenancy enforced by checking `lst.user_id == user_id` before every operation. Contains `_calcular_sugeridos(user_id)` private helper.

### Backend Route Map

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me                          @token_required
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/lists                            @token_required
POST   /api/lists
GET    /api/lists/<id>
PUT    /api/lists/<id>                       fields: name, monto_total
DELETE /api/lists/<id>

GET    /api/lists/<id>/items                 returns { items: [...], stats: {...} }
POST   /api/lists/<id>/items
PUT    /api/lists/<id>/items/<item_id>       fields: comprado, cantidad, categoria, agregado_por
DELETE /api/lists/<id>/items/<item_id>
POST   /api/lists/<id>/reset
GET    /api/lists/<id>/catalog               CatalogItem entries + ShoppingItem fallbacks

GET    /api/history                          ?period=YYYY-MM or 'all'
                                             returns { items, total, periodo, monto_total_periodo }

GET    /api/suggested-list                   preview of recurring items (no side effects)
POST   /api/suggested-list                   creates 'Mercado Semanal'; 409 if exists this ISO week

GET    /api/catalog                          list user's CatalogItem entries
PUT    /api/catalog/<id>                     update articulo or categoria
DELETE /api/catalog/<id>

GET    /api/stats/articulo                   ?nombre= — purchase history stats for one article
                                             returns { total_veces, veces_este_anio, dias_desde_ultima,
                                             quien_anade_mas[{nombre, count, porcentaje}],
                                             categoria_mas_frecuente, semanas_distintas }
                                             Empty response (all zeros) if article has no history.
                                             Filtering done in Python to avoid SQLite/Postgres collation issues.

GET    /health
```

### Password Recovery Flow

JWT-based stateless tokens — no extra DB table. Token payload has `pwd_fp` (last 12 chars of password hash); changing the password invalidates the token. Expiry: 1 hour. Email is sent via daemon `threading.Thread` so HTTP response never blocks.

### Mercado Semanal (suggested weekly list)

`_calcular_sugeridos(user_id)` analyzes the 4 complete ISO weeks before the current week. An article is included **only if it appears in all 4 weeks** (100% recurrence). `POST /api/suggested-list` checks for an existing "Mercado Semanal" in the current ISO week before creating (returns 409 with `list_id` if duplicate). The frontend button is disabled on non-Monday days.

### Frontend (`frontend/src/`)

**No Bootstrap.** All styling uses inline styles. Design system lives in `theme.js` and `contexts/ThemeContext.js`. Google Fonts (Newsreader + Manrope) loaded in `public/index.html`.

#### theme.js — design system

- `aPalette(dark)` — returns a full palette object based on dark/light mode. Tokens: `cream`, `paper`, `paperHi`, `ink`, `muted`, `faint`, `hairline`, `primary` (#C76A4D terracotta), `olive`, `mustard`, `plum`, `elev`, `elevHi`, `serif`, `sans`.
- `T = aPalette(false)` — static alias for backward compatibility with pages that don't use `ThemeContext` (`ForgotPasswordPage`, `ResetPasswordPage`).
- `TILE_TINTS_LIGHT` / `TILE_TINTS_DARK` — 8-color arrays for card backgrounds.
- `tileBg(dark, i)` — returns `TILE_TINTS[i % 8]` for the current theme.
- `CATEGORIAS` — 11 canonical categories, must stay in sync with `backend/config.py`.
- `CAT_META` — `{ emoji, color }` per category.
- `Ico` — SVG icon components called as `<Ico.Plus s={18} c="#fff" w={2}/>`. Available: `Plus`, `Check`, `X`, `ChevL`, `ChevR`, `Clock`, `Grid`, `Sparkle`, `Search`, `Trash`, `Edit`, `List`, `Bell`, `People`, `Mic`, `Dots`, `Heart` (prop `filled`), `Camera`.
- `Spinner` — `<Spinner size={18} color="#fff"/>`.

#### ThemeContext (`contexts/ThemeContext.js`)

`ThemeProvider` wraps the entire app (outermost, outside `AuthProvider`). Persists dark/light preference in `localStorage` under `cesta_dark`. Syncs `document.body.style.background` on theme change.

```js
const { T, dark, toggleDark } = useTheme();
```

All pages except `ForgotPasswordPage` and `ResetPasswordPage` use `useTheme()` instead of the static `T` import.

#### Atomic UI components (`components/ui/`)

- `AAvatar` — circular avatar with initials. Props: `{ initials, color, size=32, ring=false, T }`.
- `AProgressBar` — horizontal progress bar. Props: `{ value, total, color, height=6, T }`. Guards against `total=0`.
- `APillTag` — rounded pill. Props: `{ children, color, bg, T }`.

#### BottomTabBar (`components/BottomTabBar.js`)

4 tabs: Listas → `/dashboard`, Categorías → `/catalog`, Historial → `/history`, Familia → `/family`. Uses `useTheme()` internally. `position: fixed, bottom: 0`. Pages that show it set `paddingBottom: 120`. **Not used** in detail pages (`ListPage`, `ShoppingModePage`, `ProductDetailPage`, `BudgetPage`, `FamilyPage`).

#### api.js

Single Axios instance. Request interceptor injects `Bearer` token. Response interceptor redirects to `/login` on 401. Exports seven named API objects: `authAPI`, `listsAPI`, `itemsAPI`, `historyAPI`, `suggestedAPI`, `catalogAPI`, `statsAPI`.

#### App.js — routes

All pages are lazy-loaded. Routes:

| Path | Page | Protected |
|---|---|---|
| `/login` | LoginPage | No |
| `/forgot-password` | ForgotPasswordPage | No |
| `/reset-password` | ResetPasswordPage | No |
| `/dashboard` | DashboardPage | Yes |
| `/lists/:id/shop` | ShoppingModePage | Yes — must be BEFORE `/lists/:id` |
| `/lists/:id` | ListPage | Yes |
| `/history` | HistoryPage | Yes |
| `/catalog` | CatalogPage | Yes |
| `/family` | FamilyPage | Yes (placeholder) |
| `/budget` | BudgetPage | Yes (placeholder) |
| `/product/:articulo` | ProductDetailPage | Yes |

#### Page summary

- **DashboardPage** — greeting header with dark-mode toggle + Bell (→ `/budget`) + avatar (logout); horizontal carousel "Para ti, hoy" (Mercado Semanal modal, History, Próximamente); list cards with `tileBg` + `AProgressBar` + `monto_total` (read-only); dashed "Nueva lista" card. `BottomTabBar active="home"`.
- **ListPage** — `ChevL` → `/dashboard`; "Comprar" button → `/lists/:id/shop`; creation date + `monto_total` chip (read-only); items grouped by category with uppercase headers; `AAvatar` for `agregado_por` on pending items; `Ico.Mic` floating bar (opens add-item bottom sheet). **Fix**: `handleToggle` reverts both `items` AND `stats` on API failure (`prevStats` captured before optimistic update).
- **ShoppingModePage** — fullscreen dark gradient (`#2A1F18 → #3F2B1F`) regardless of theme; shows pending items one by one; `advance()` helper shared by "No hay" (no API call) and "Tachar y seguir" (calls `itemsAPI.update`, only advances on success); lists with no pending items go straight to the completion screen; completion screen captures `monto_total` and saves via `listsAPI.update(id, { monto_total })` directly.
- **HistoryPage** — period selector inline below title; monthly spend card (→ `/budget`) shown when `monto_total_periodo > 0`; items grouped by category. `BottomTabBar active="hist"`.
- **CatalogPage** — default grid view (2-col by category using `tileBg`); toggle to list view (`Ico.List`/`Ico.Grid`); pressing a category in grid filters list view; each row in list view navigates to `/product/:articulo`; edit/delete buttons wrapped in `onClick={e => e.stopPropagation()}` div. `BottomTabBar active="cat"`.
- **ProductDetailPage** — loads `statsAPI.getArticulo(decodeURIComponent(articulo))`; re-fetches if `:articulo` param changes; hero with emoji + category + "Recurrente" badge (if `semanas_distintas > 2`); 3-col stats grid (Total, Este Año, Última); horizontal percentage bars for `quien_anade_mas`; "Volver al catálogo" uses `navigate('/catalog', { replace: true })` to avoid adding a back-stack entry.
- **FamilyPage / BudgetPage** — placeholders showing "Próximamente".

### Design system conventions

- Max-width `480px`, `margin: '0 auto'` — mobile-first PWA.
- Modals: bottom-sheets with `position: fixed, inset: 0` backdrop + `position: fixed, bottom: 0` sheet, `borderRadius: '24px 24px 0 0'`, grabber pill.
- `App.css`: `@keyframes cesta-spin` (Spinner), global `box-sizing: border-box`, `input:focus` ring in terracotta, `.scroll-x` scrollbar-hiding class.
- Category pills: `background: '#F1E5D2'` consistently.
- iOS safe area: `paddingBottom: 'calc(Xpx + env(safe-area-inset-bottom, 0px))'` in fixed bottom elements.

### ListPage data loading pattern

`fetchData` uses three sequential `try/catch` blocks (not `Promise.all`) so items always render even if secondary calls fail:
1. `itemsAPI.getAll(id)` — critical
2. `listsAPI.get(id)` — non-critical (title)
3. `itemsAPI.getCatalog(id)` — non-critical (autocomplete)

### Autocomplete (catalog)

- `GET /api/lists/<id>/catalog` — `CatalogItem` + `ShoppingItem` fallbacks, deduplicated by `articulo.lower()`. Used in `ListPage`.
- `GET /api/catalog` — only `CatalogItem` entries. Used in `CatalogPage`.

`ListPage` autocomplete: shows after 2 chars, up to 6 results. Uses `onMouseDown` (not `onClick`) on suggestions to prevent `onBlur` closing the dropdown before selection. Dropdown opens **above** the input (bottom-sheet context).

### Deployment (Railway)

- **Backend**: root `Procfile` — `web:` runs `waitress-serve`, `release:` runs `db.create_all()`. `db.create_all()` also called at module level in `app.py`. Schema is additive-only — new columns require manual `ALTER TABLE` or a new model (never `db.create_all()` for existing tables).
- **Frontend**: `frontend/Procfile` — serves static build with `./node_modules/.bin/serve` (locally installed, not `npx`).
- `backend/nixpacks.toml` — pins Python 3.11, includes `postgresql` nix package for `psycopg2`.
- Railway auto-deploys from GitHub `main` on every push.

### Deployment (Docker / Synology NAS)

`docker compose up --build` from project root. Frontend served by Nginx (`frontend/nginx.conf`), backend by Waitress, PostgreSQL as `db` service. Backend creates the DB schema on first start via `db.create_all()`. See `DOCKER.md` for NAS-specific setup.

## Key Conventions

- All API routes prefixed `/api/`. Health check at `/health`.
- `CATEGORIAS` must stay in sync between `backend/config.py` and `frontend/src/theme.js` (11 categories). When modifying: update both files + `CAT_META` in `theme.js`.
- `comprado` (boolean) — purchase state on `ShoppingItem`.
- `agregado_por` — free-text string tracking who added an item (supports family multi-user within one account).
- `monto_total` — captured by `ShoppingModePage` at end of shopping trip via `listsAPI.update(id, { monto_total })`. Not editable in `DashboardPage` or `ListPage` (read-only display only).
- `PurchaseHistory.list_id` has no FK constraint — history is preserved when a list is deleted.
- `quien_anade_mas` percentages use total compras as denominator (includes entries without `agregado_por`), so percentages may be low if many entries have no author.
- Active virtual environment: `backend/venv/`. Ignore `backend/venvcd/` and `backend/backend/` (stale).
- No tests in this repo (no `backend/tests/`, no `*.test.js`).
