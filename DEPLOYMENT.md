# Deploy: Railway (backend) + Vercel (frontend)

The browser only talks to **Vercel**. Next.js **rewrites** `/api/*` to your **Railway** FastAPI URL (`BACKEND_URL`), so cookies stay on your Vercel hostname.

## 1. Railway — FastAPI backend

### Prerequisites

- GitHub repo connected (this project).
- MongoDB Atlas (or Railway MongoDB) **connection string** ready.

### Create the service

1. Open [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select this repo.
2. **Settings → Service → Root Directory** → set to `backend`  
   (so Railway runs `requirements.txt` and `main.py` from the `backend` folder).
3. **Settings → Networking → Generate Domain** (public HTTPS URL).  
   Copy it — you will use it as `BACKEND_URL` on Vercel (no trailing slash).

### Environment variables (Railway → Variables)

Add the following (names match `backend/.env.example`):

| Variable | Notes |
|----------|--------|
| `MONGODB_URI` | Full URI, preferably with DB path `.../finance_dashboard` |
| `MONGODB_DB_NAME` | e.g. `finance_dashboard` if URI has no DB name |
| `JWT_SECRET` | Long random string; keep stable across deploys |
| `JWT_ALGORITHM` | `HS256` (default) |
| `JWT_EXPIRY_HOURS` | e.g. `24` |
| `ALLOWED_ORIGINS` | Comma-separated: `https://your-app.vercel.app,http://localhost:3000` |
| `SECURE_COOKIES` | `true` in production (HTTPS) |
| `SEED_ADMIN_KEY` | Optional; leave empty in production unless you need seed route |
| `USERS_COLLECTION` | Default `users` |
| `TRANSACTIONS_COLLECTION` | Default `records` |

**Do not** commit real secrets. Use Railway’s UI (or CLI) only.

Railway injects **`PORT`** automatically. The app starts via `Procfile` / `railway.toml`:

- `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Health check

`railway.toml` uses **`GET /docs`** (FastAPI Swagger). After deploy, open `https://<your-railway-domain>/docs` to confirm the API is up.

### Deploy

Push to your default branch (if auto-deploy is on), or use **Deploy** in the Railway UI.

---

## 2. Vercel — Next.js frontend

### Create the project

1. [Vercel](https://vercel.com) → **Add New… → Project** → import the **same** GitHub repo.
2. **Root Directory**: leave as repository root (where `package.json` lives).
3. Framework: **Next.js** (auto-detected).

### Environment variable (Vercel → Settings → Environment Variables)

| Name | Value | Environments |
|------|--------|--------------|
| `BACKEND_URL` | Your Railway **public HTTPS** URL, **no** trailing slash | Production, Preview (optional), Development (optional) |

Example: `https://finance-dashboard-api-production.up.railway.app`

Redeploy after changing env vars.

### Build

Default `npm run build` / `next build` is enough. Rewrites are in `next.config.ts`.

---

## 3. Checklist

- [ ] Railway **Root Directory** = `backend`
- [ ] Railway has `MONGODB_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS` (includes Vercel URL), `SECURE_COOKIES=true`
- [ ] Vercel has `BACKEND_URL` = Railway URL
- [ ] Log in on the **Vercel** URL (not Railway) so the session cookie applies to the UI origin
- [ ] `.env` files stay local only; use `.env.example` files as templates (they are not ignored by git in this repo)

---

## 4. Troubleshooting

- **`ECONNREFUSED` / 502 on `/api/*`**: Vercel cannot reach Railway — check `BACKEND_URL`, Railway deployment logs, and that the Railway service has a public domain.
- **401 / not logged in**: Open the app only on the **same** Vercel hostname you put in `ALLOWED_ORIGINS`. Use `SECURE_COOKIES=true` on Railway when the site is served over HTTPS.
- **CORS errors** (rare with proxy setup): Add your exact Vercel origin to `ALLOWED_ORIGINS` on Railway.
