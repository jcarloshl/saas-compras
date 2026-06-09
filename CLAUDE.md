# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-user SaaS shopping list platform. Users authenticate via JWT and manage their own shopping lists with items. Deployed on Railway (PostgreSQL + backend + frontend as separate services). Also runs locally via Docker Compose for NAS Synology deployment (see `DOCKER.md`).

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

### Docker (local / NAS Synology)

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
| `BREVO_API_KEY` | Brevo transactional email API key (HTTPS — Railway blocks SMTP) |
| `EMAIL_REMITENTE` | Sender address verified in Brevo (e.g. your Gmail) |
| `SPOONACULAR_API_KEY` | Spoonacular Recipe Search API key (free tier, 150 pts/día) |

Without `BREVO_API_KEY`, `forgot-password` still works — the reset link is printed to server logs.

## Architecture

### Backend (`backend/`)

Flat Flask app — no blueprints. All routes live in `app.py`.

- `config.py` — Config classes selected by `FLASK_ENV`: `DevelopmentConfig` (SQLite), `ProductionConfig` (PostgreSQL via `DATABASE_URL`), `TestingConfig` (in-memory SQLite). Railway's `postgres://` URLs are rewritten to `postgresql://` here. Also defines `CATEGORIAS` (11 fixed categories), `FRONTEND_URL`, `SPOONACULAR_API_KEY`, and `INGREDIENT_CATEGORIES` (keyword dict — bilingual EN+ES — used by `_cat_from_ingredient()` to map ingredient names → project categories).
- `models.py` — Seven SQLAlchemy models: `User → ShoppingList → ShoppingItem` (cascading deletes), `PurchaseHistory` (standalone, no cascade), `CatalogItem` (user_id + articulo unique per user), `FamilyMember` (up to 5 per user, has `nombre` + `color`), and `Budget` (unique per user+mes, `mes` format `YYYY-MM`). `ShoppingList.monto_total` (Float, nullable) records the total spent on a shopping trip — captured from `ShoppingModePage`. `ShoppingItem.precio` (Float, nullable) and `PurchaseHistory.precio` (Float, nullable) store the price paid per unit, entered optionally in `ShoppingModePage`. `CatalogItem` is upserted automatically when an item is added to a list. `PurchaseHistory` is written when `comprado` is toggled `true` in the PUT endpoint (not on reset). `PurchaseHistory.list_id` is a plain `Integer` with **no FK constraint** — history is preserved when a list is deleted. `_es_comprado()` is defined but never called (dead code).
- `auth.py` — Manual JWT via PyJWT. `@token_required` decorator injects `user_id` as first arg. Tokens expire in 30 days.
- `app.py` — All REST routes. Multi-tenancy enforced by checking `lst.user_id == user_id` before every operation. Private helpers: `_calcular_sugeridos(user_id)`, `_cat_from_ingredient(text)`, `_parse_spoonacular_ingredients(extended_ingredients)`.

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
PUT    /api/lists/<id>/items/<item_id>       fields: comprado, cantidad, categoria, agregado_por, precio
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

GET    /api/family/members                   list family members (max 5)
POST   /api/family/members                   create member { nombre, color }
PUT    /api/family/members/<id>              update nombre or color
DELETE /api/family/members/<id>

GET    /api/budget?mes=YYYY-MM               returns { id, monto_limite, gasto_actual, porcentaje,
                                             por_categoria, advertencia_listas_sin_monto, listas_sin_monto }
                                             Validates mes format; gasto_actual sums ShoppingList.monto_total
                                             for lists linked via PurchaseHistory in that month.
POST   /api/budget                           upsert { mes, monto_limite } — float() validated, 400 on bad input
DELETE /api/budget/<id>                      ownership-checked delete

GET    /api/recipes/search                   @token_required — ?q= — calls Edamam v2; returns { results: [...], total }
                                             results: [{ id, label, image, source, ingredientLines,
                                             ingredientes: [{ articulo, cantidad, categoria }] }]
                                             articulo is translated to Spanish via _translate_foods_es().
                                             503 if EDAMAM_APP_ID/KEY not set

GET    /api/recipes/<recipe_id>              @token_required — detail via Edamam v2 /api/recipes/v2/{id}
                                             returns { id, label, image, source, ingredientes: [...] }
                                             NOT called by RecipesPage (ingredientes already in search results)

POST   /api/recipes/to-list                  @token_required — body: { label, ingredientes }
                                             creates ShoppingList + ShoppingItems + upserts CatalogItems
                                             returns { list_id, items_count }

GET    /api/stats/articulo                   ?nombre= — purchase history stats for one article
                                             returns { total_veces, veces_este_anio, dias_desde_ultima,
                                             quien_anade_mas[{nombre, count, porcentaje}],
                                             categoria_mas_frecuente, semanas_distintas }
                                             Empty response (all zeros) if article has no history.
                                             Filtering done in Python to avoid SQLite/Postgres collation issues.

GET    /health
```

### Password Recovery Flow

JWT-based stateless tokens — no extra DB table. Token payload has `pwd_fp` (last 12 chars of password hash); changing the password invalidates the token. Expiry: 1 hour. Email is sent via **Brevo HTTP API** (`https://api.brevo.com/v3/smtp/email`) in a daemon `threading.Thread` so HTTP response never blocks. Railway blocks all outbound SMTP (ports 465 and 587) — any SMTP-based approach will fail there.

### Mercado Semanal (suggested weekly list)

`_calcular_sugeridos(user_id)` analyzes the 4 complete ISO weeks before the current week. An article is included **only if it appears in all 4 weeks** (100% recurrence). `POST /api/suggested-list` checks for an existing "Mercado Semanal" in the current ISO week before creating (returns 409 with `list_id` if duplicate). The frontend button is disabled on non-Monday days.

### Recetas (Spoonacular integration)

Uses **Spoonacular Recipe Search API** (`https://api.spoonacular.com/recipes/complexSearch`). Free tier: 150 puntos/día; cada búsqueda con `addRecipeInformation=true` y `number=10` cuesta ~11 puntos (~13 búsquedas/día).

`GET /api/recipes/search` llama a `complexSearch` con `language=es`, `addRecipeInformation=true`, `fillIngredients=true`, `number=10`. Los nombres de ingredientes llegan en español nativamente — no se requiere traducción. `_parse_spoonacular_ingredients()` convierte `extendedIngredients` en `(ingredientes, ingredient_lines)`, deduplicando por `name`. Retorna `503 { code: 'no_credentials' }` si `SPOONACULAR_API_KEY` no está configurado.

`GET /api/recipes/<id>` llama a `https://api.spoonacular.com/recipes/{id}/information?language=es`. Existe pero **no es llamado por el frontend** — `RecipesPage` usa `ingredientes` de los resultados de búsqueda directamente.

`POST /api/recipes/to-list` crea la lista, ítems y upsertea el catálogo en una sola transacción. Sin `SPOONACULAR_API_KEY`, search y to-list retornan `503 { code: 'no_credentials' }`.

### Frontend (`frontend/src/`)

**No Bootstrap.** All styling uses inline styles. Design system lives in `theme.js` and `contexts/ThemeContext.js`. Google Fonts (Newsreader + Manrope) loaded in `public/index.html`.

#### theme.js — design system

- `aPalette(dark)` — returns a full palette object based on dark/light mode. Tokens: `cream`, `paper`, `paperHi`, `ink`, `muted`, `faint`, `hairline`, `primary` (#C76A4D terracotta), `olive`, `mustard`, `plum`, `elev`, `elevHi`, `serif`, `sans`.
- `T = aPalette(false)` — static alias for backward compatibility with pages that don't use `ThemeContext` (`ForgotPasswordPage`, `ResetPasswordPage`).
- `TILE_TINTS_LIGHT` / `TILE_TINTS_DARK` — 8-color arrays for card backgrounds.
- `tileBg(dark, i)` — returns `TILE_TINTS[i % 8]` for the current theme.
- `CATEGORIAS` — 11 canonical categories, must stay in sync with `backend/config.py`.
- `CAT_META` — `{ emoji, color }` per category.
- `Ico` — SVG icon components called as `<Ico.Plus s={18} c="#fff" w={2}/>`. Available: `Plus`, `Check`, `X`, `ChevL`, `ChevR`, `Clock`, `Grid`, `Sparkle`, `Search`, `Trash`, `Edit`, `List`, `Bell`, `People`, `Mic`, `Dots`, `Heart` (prop `filled`), `Camera`, `Wallet`.
- `Spinner` — `<Spinner size={18} color="#fff"/>`.
- `formatMonto(val)` — formats a number using `es-CL` locale with no decimals (e.g. `1.234`).

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

#### MemberPicker (`components/MemberPicker.js`)

Bottom-sheet that asks "¿Quién eres?" when no active family member is selected in `localStorage`. Shows avatar buttons for each `FamilyMember` plus a "Continuar como invitado" option. `onSelect(member)` callback — caller is responsible for saving to `localStorage('cesta_member')` and closing. Used by `DashboardPage` on load and from the header chip.

#### BottomTabBar (`components/BottomTabBar.js`)

4 tabs: Listas → `/dashboard`, Categorías → `/catalog`, Historial → `/history`, Familia → `/family`. Uses `useTheme()` internally. `position: fixed, bottom: 0`. Pages that show it set `paddingBottom: 120`. **Not used** in detail pages (`ListPage`, `ShoppingModePage`, `ProductDetailPage`, `BudgetPage`, `FamilyPage`, `RecipesPage`).

#### api.js

Single Axios instance. Request interceptor injects `Bearer` token. Response interceptor redirects to `/login` on 401. Exports ten named API objects: `authAPI`, `listsAPI`, `itemsAPI`, `historyAPI`, `suggestedAPI`, `catalogAPI`, `recipesAPI`, `statsAPI`, `familyAPI`, `budgetAPI`.

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
| `/family` | FamilyPage | Yes |
| `/budget` | BudgetPage | Yes |
| `/product/:articulo` | ProductDetailPage | Yes |
| `/recipes` | RecipesPage | Yes |

#### Page summary

- **DashboardPage** — greeting header shows active family member name (from `localStorage('cesta_member')`) with "Cambiar" link + dark-mode toggle + `Ico.Wallet` (→ `/budget`) + avatar (logout); shows `MemberPicker` on load if no member saved and members exist; delete confirmation uses a custom bottom-sheet modal (`confirmDeleteId` state) instead of `window.confirm`; new lists are inserted at the front of the array; "Nueva lista" button sits inline next to the "Listas activas" title; horizontal carousel "Para ti, hoy" has 3 cards: Mercado Semanal (Monday-only, opens modal), Historial reciente (→ `/history`), Recetas (→ `/recipes`); list cards with `tileBg` + `AProgressBar` + `monto_total` (read-only, no decimals, `es-CL` locale). `BottomTabBar active="home"`.
- **ListPage** — `ChevL` → `/dashboard`; "Comprar" button → `/lists/:id/shop`; creation date + `monto_total` chip (read-only); items grouped by category with uppercase headers; `AAvatar` for `agregado_por` on pending items. `agregado_por` is sourced from `localStorage.getItem('cesta_member')?.nombre || user?.username` — there is no manual input field for it. Floating bar has two zones: text area (opens form) + mic circle (activates voice mode). Voice mode: `voiceModeRef` (ref) + `voiceMode` (state) pair; when active, final speech results auto-submit via `submitByVoice()` which calls `itemsAPI.add`, shows a toast, and restarts recognition. `submitByVoiceRef` avoids stale closure. A banner inside the form shows "Modo dictado activo" with "Detener" button. `handleArticuloChange` is wrapped in `useCallback` (dependency of `startListening`). `handleToggle` reverts both `items` AND `stats` on API failure (`prevStats` captured before optimistic update). Autocomplete uses `catalogAPI.getAll()` (not `itemsAPI.getCatalog`).
- **ShoppingModePage** — fullscreen dark gradient (`#2A1F18 → #3F2B1F`) regardless of theme; shows pending items one by one. Each item shows a Wikipedia image (fetched per-item via `es.wikipedia.org/api/rest_v1/page/summary/`; `itemImages` dict caches results, falls back to category emoji). Optional `precio` input per item; `advance(precioActual)` accumulates into `precioAcum`. `advance()` is shared by "No hay" (skips, no API call) and "Tachar y seguir" (sends `{ comprado: true, precio? }` to `itemsAPI.update`, only advances on success). Lists with no pending items go straight to the completion screen. Completion screen shows the `monto` input pre-filled with `Math.round(precioAcum)` (if prices were entered) and saves via `listsAPI.update(id, { monto_total })`.
- **HistoryPage** — period selector inline below title; monthly spend card (→ `/budget`) shown when `monto_total_periodo > 0`; items grouped by category. `BottomTabBar active="hist"`.
- **CatalogPage** — default grid view (2-col by category using `tileBg`); toggle to list view (`Ico.List`/`Ico.Grid`); pressing a category in grid filters list view; each row in list view navigates to `/product/:articulo`; edit/delete buttons wrapped in `onClick={e => e.stopPropagation()}` div. `BottomTabBar active="cat"`.
- **ProductDetailPage** — loads `statsAPI.getArticulo(decodeURIComponent(articulo))`; re-fetches if `:articulo` param changes; hero with emoji + category + "Recurrente" badge (if `semanas_distintas > 2`); 3-col stats grid (Total, Este Año, Última); horizontal percentage bars for `quien_anade_mas`; "Volver al catálogo" uses `navigate('/catalog', { replace: true })` to avoid adding a back-stack entry.
- **FamilyPage** — CRUD for up to 5 family members. Each member has `nombre` + `color` (color picker). "Soy yo" button saves the member to `localStorage('cesta_member')` and navigates to `/dashboard`. Edit inline; delete with confirmation dialog.
- **BudgetPage** — month selector (last 6 months); main card shows gasto vs. límite with `AProgressBar` + alert if ≥80%; "Definir límite" / "Editar" opens a bottom-sheet modal; category breakdown shows item counts (not amounts — labeled as "estimación"); yellow warning banner when `advertencia_listas_sin_monto` is true (lists without `monto_total` in that month).
- **RecipesPage** — `ChevL` → `/dashboard`; search input + submit calls `recipesAPI.search(q)`; results in 2-col image grid; tapping a card opens a bottom-sheet with `ingredientLines` (human-readable, English from Edamam) + "Crear lista de compras" button; button calls `recipesAPI.toList(selected.label, selected.ingredientes)` directly — `ingredientes` (in Spanish) come from the search results, no second API call needed. Returns 503 with `code: 'no_credentials'` if Edamam env vars are missing.

### Design system conventions

- Max-width `480px`, `margin: '0 auto'` — mobile-first PWA.
- Modals: bottom-sheets with `position: fixed, inset: 0` backdrop + `position: fixed, bottom: 0` sheet, `borderRadius: '24px 24px 0 0'`, grabber pill.
- `App.css`: `@keyframes cesta-spin` (Spinner), global `box-sizing: border-box`, `input:focus` ring in terracotta, `.scroll-x` scrollbar-hiding class.
- Category pills: `background: '#F1E5D2'` consistently.
- iOS safe area: `paddingBottom: 'calc(Xpx + env(safe-area-inset-bottom, 0px))'` in fixed bottom elements.
- All user-facing text in Latin American Spanish (tuteo, not voseo argentino).

### ListPage data loading pattern

`fetchData` uses three sequential `try/catch` blocks (not `Promise.all`) so items always render even if secondary calls fail:
1. `itemsAPI.getAll(id)` — critical
2. `listsAPI.get(id)` — non-critical (title)
3. `catalogAPI.getAll()` — non-critical (autocomplete, switched from `itemsAPI.getCatalog` to avoid showing deleted items)

### Autocomplete (catalog)

- `GET /api/lists/<id>/catalog` — `CatalogItem` + `ShoppingItem` fallbacks, deduplicated by `articulo.lower()`. **Not used by `ListPage`** (switched to avoid showing deleted items).
- `GET /api/catalog` — only `CatalogItem` entries. Used by both `CatalogPage` and `ListPage`.

`ListPage` autocomplete: shows after 2 chars, up to 6 results. Uses `onMouseDown` (not `onClick`) on suggestions to prevent `onBlur` closing the dropdown before selection. Dropdown opens **above** the input (bottom-sheet context).

### Deployment (Railway)

Railway auto-deploys from GitHub `main` on every push. Both services use **Docker build mode** (Dockerfiles detected automatically):

- **Backend** (`backend/Dockerfile`): `python:3.12-slim`, installs `psycopg2-binary` (not source build). CMD: `sh -c "exec waitress-serve --host=0.0.0.0 --port=${PORT:-5000} --threads=8 app:app"` — the `sh -c` is required so Railway's `$PORT` env var expands correctly. Railway start command is set to empty so the Dockerfile CMD takes precedence over any Procfile.
- **Frontend** (`frontend/Dockerfile`): multi-stage — Node 18 builds React, then nginx:stable-alpine serves it. CMD runs `envsubst '${PORT}'` on `nginx.conf` template before starting nginx, so nginx listens on Railway's assigned `$PORT`. Start command also set to empty.
- `db.create_all()` is called at module level in `app.py` — schema is created on first startup without a separate migration step. Schema is additive-only — new columns require manual `ALTER TABLE` (never rely on `db.create_all()` for existing tables).
- `backend/nixpacks.toml` — kept for reference but Railway now uses the Dockerfile, not nixpacks.

### Deployment (Docker / Synology NAS)

The Docker files (`backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, `frontend/nginx.conf`) are intended for self-hosting on a Synology NAS. `docker compose up --build` from project root. Frontend served by Nginx, backend by Waitress, PostgreSQL as `db` service.

- `frontend/nginx.conf` uses `${PORT}` placeholder (substituted by `envsubst` at startup) and `listen ${PORT}`. In Docker Compose `PORT=80` is set explicitly so nginx listens on 80 (mapped as `3000:80`).
- The `/api/` location uses `set $upstream http://backend:5000` with `resolver 127.0.0.11` (Docker DNS) to avoid nginx failing at startup when `backend` hostname is unknown — this also makes Railway-hosted nginx start correctly even though no traffic reaches that location there.

See `DOCKER.md` for NAS-specific setup.

## Key Conventions

- All API routes prefixed `/api/`. Health check at `/health`.
- `CATEGORIAS` must stay in sync between `backend/config.py` and `frontend/src/theme.js` (11 categories). When modifying: update both files + `CAT_META` in `theme.js`.
- `comprado` (boolean) — purchase state on `ShoppingItem`.
- `precio` (Float, nullable) — optional price per unit on `ShoppingItem` and `PurchaseHistory`. Set in `ShoppingModePage` when the user enters a price. Accumulated into `precioAcum` to pre-fill `monto_total`.
- `agregado_por` — auto-populated from `localStorage('cesta_member').nombre` (active family member) or `user.username` as fallback. No manual input field exists in `ListPage`.
- `localStorage` keys: `cesta_dark` (theme), `cesta_member` (active family member object `{id, nombre, color}`), `token` (JWT), `user` (user object), `dashboard_lists` (list cache).
- `monto_total` — captured by `ShoppingModePage` at end of shopping trip via `listsAPI.update(id, { monto_total })`. Not editable in `DashboardPage` or `ListPage` (read-only display only).
- `PurchaseHistory.list_id` has no FK constraint — history is preserved when a list is deleted.
- `quien_anade_mas` percentages use total compras as denominator (includes entries without `agregado_por`), so percentages may be low if many entries have no author.
- `psycopg2-binary` (not `psycopg2`) in `requirements.txt` — avoids C header compilation failure on Railway's Python 3.12 environment.
- Speech recognition uses `window.SpeechRecognition || window.webkitSpeechRecognition` with `lang: 'es-CL'`. Requires HTTPS (satisfied by Railway). Only shown if `hasSpeech` is truthy.
- Active virtual environment: `backend/venv/`. Ignore `backend/venvcd/` and `backend/backend/` (stale).
- No tests in this repo (no `backend/tests/`, no `*.test.js`).
