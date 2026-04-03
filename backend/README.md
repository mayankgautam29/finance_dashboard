# Finance Dashboard — FastAPI backend

Python replacement for the original Next.js API routes. The Next.js app proxies `/api/*` to this service (see root `next.config.ts` and `BACKEND_URL`).

**Production:** Deploy this folder to **Railway** and the Next app to **Vercel** — see the repo root [`DEPLOYMENT.md`](../DEPLOYMENT.md).

**Run both** `uvicorn` (port 8000) and `next dev` (port 3000). The Next.js route handlers under `src/app/api/**` were removed on purpose so requests are not handled locally and the rewrite always hits FastAPI.

**Cookies / 401 on localhost:** Use `http://localhost:3000` (not `127.0.0.1` for the browser) consistently, and keep `SECURE_COOKIES=false` in `backend/.env` for HTTP dev. Avoid `NODE_ENV=production` in the **root** `.env` during local HTTP dev if anything still set `Secure` cookies.

**JWT:** Use the same `JWT_SECRET` in `backend/.env` as before if you need old tokens to validate; after switching to FastAPI-only auth, **log in once** to refresh the `token` cookie.

## Roles

| Role    | Permissions |
|--------|-------------|
| **viewer** | `GET /api/dashboard/summary`, legacy `GET /api/dashboard` (scoped to own data). Legacy `GET /api/records` / `POST /api/records/add` for the existing UI. No access to `GET /api/transactions`. |
| **analyst** | Summary + `GET /api/transactions` (read-only). No POST/PUT/DELETE on transactions. Legacy records list behaves like the Next app (see all records). |
| **admin** | Full CRUD on transactions, full user management, legacy admin record edits, seed route (optional). |

Signups (`POST /api/auth/signup`) accept `role`: `viewer`, `analyst`, or `admin` (case-insensitive); invalid or missing values default to `viewer`.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env   # set MONGODB_URI and JWT_SECRET
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string. Prefer a path with DB name (e.g. `.../finance_dashboard`). If the URI has **no** database path, set `MONGODB_DB_NAME`. |
| `MONGODB_DB_NAME` | Fallback database name when the URI omits it (default `finance_dashboard`). |
| `JWT_SECRET` | Secret for HS256 JWTs — **must match** the value the Next app used if you reuse existing cookies; otherwise **log in again** after switching to this API. |
| `JWT_ALGORITHM` | Default `HS256` |
| `JWT_EXPIRY_HOURS` | Default `24` |
| `PORT` | Uvicorn port (default `8000`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (include your Next.js URL) |
| `SECURE_COOKIES` | `true` in production if using HTTPS only |
| `SEED_ADMIN_KEY` | If set, enables `POST /api/auth/seed-admin` (disabled when empty) |
| `USERS_COLLECTION` | Default `users` |
| `TRANSACTIONS_COLLECTION` | Default `records` (matches existing Mongoose collection name) |

## First admin user

**Option A — seed HTTP (dev only)**  
Set `SEED_ADMIN_KEY` in `.env`, then:

```http
POST /api/auth/seed-admin
Content-Type: application/json

{
  "secret": "<same as SEED_ADMIN_KEY>",
  "email": "you@example.com",
  "password": "your-secure-password",
  "name": "Admin"
}
```

Leave `SEED_ADMIN_KEY` empty in production to disable this route (returns 404).

**Option B — MongoDB shell**

```js
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { role: "admin" } }
)
```

## API overview

- **Auth:** `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/session` (navbar/session helper).
- **Spec transactions:** ` /api/transactions` CRUD (role rules in task spec).
- **Spec dashboard:** `GET /api/dashboard/summary`.
- **Users:** `GET/GET/PUT/DELETE /api/users/...` (admin only).
- **Legacy (current Next UI):** `GET /api/logout`, `GET /api/dashboard`, `GET/PUT/DELETE /api/records`, `POST /api/records/add`.

Errors are returned as `{ "message": "...", "error": "..." }` for compatibility with the frontend.

## Frontend proxy

Set in the Next.js project root:

```env
BACKEND_URL=http://127.0.0.1:8000
```

Rewrites send all `/api/*` requests to the FastAPI server during `next dev` / `next start`.
