# Getting Started

> Traceability tag: SETUP-001
> Relates to: ADR-006

This guide walks you from a freshly cloned repository to a running development
environment with Directus and SvelteKit.

---

## Prerequisites

| Tool    | Version    | Install guide |
|---------|------------|---------------|
| Node.js | 18–22 LTS  | https://nodejs.org |
| npm     | 9+         | Bundled with Node.js |
| Git     | any        | https://git-scm.com |

Optional but recommended:

- **VS Code** with the Svelte extension.
- **DB Browser for SQLite** to inspect the default database.

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/open-governance-portal.git
cd open-governance-portal
```

---

## 2. Start the Backend (Directus)

```bash
cd src/backend

# Copy the environment template and configure it
cp .env.example .env
```

Edit `.env` to set your admin credentials and secrets:

```bash
# src/backend/.env (key settings)
SECRET="replace-with-a-long-random-string"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="changeme"

DB_CLIENT="sqlite3"
DB_FILENAME="./data.db"

WEBSOCKETS_ENABLED=true
```

Then install dependencies, initialise the database, and start the server:

```bash
npm install
npx directus bootstrap   # creates DB schema + admin user
npm run dev               # starts Directus on http://localhost:8055
```

Verify it is running:

```bash
# Health check
curl http://localhost:8055/server/health
# {"status":"ok"}

# List governance modules (after creating some in the admin panel)
curl http://localhost:8055/items/governance_modules
# {"data":[...]}
```

The **Directus admin panel** is available at **http://localhost:8055/admin**.
Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` file.

---

## 3. Start the Frontend (SvelteKit)

Open a **second terminal**:

```bash
cd src/frontend

# Copy the environment template
cp .env.example .env
```

Ensure `.env` points to your Directus instance:

```bash
# src/frontend/.env
VITE_API_BASE_URL=http://localhost:8055
```

Then install and run:

```bash
npm install
npm run dev               # starts SvelteKit on http://localhost:5173
```

Open **http://localhost:5173** in your browser to see the dashboard.

---

## 4. First Steps

1. **Open the admin panel** — Go to `http://localhost:8055/admin` and log in.
2. **Explore collections** — You should see `governance_modules`, `meetings`,
   `transactions`, and `members` in the sidebar.
3. **Create a governance module** — Click `governance_modules` → "+" and
   create an entry (e.g. "Scheduling", "Finances").
4. **Create some content** — Add entries to `meetings` or `transactions`.
5. **Verify the dashboard** — Refresh `http://localhost:5173` and confirm the
   governance modules appear.

Try the REST API directly:

```bash
# Create a meeting
curl -X POST http://localhost:8055/items/meetings \
     -H "Content-Type: application/json" \
     -d '{"title":"Board Meeting","starts_at":"2025-06-01T09:00:00Z","ends_at":"2025-06-01T11:00:00Z"}'

# List meetings
curl http://localhost:8055/items/meetings
# {"data":[{"id":1,"title":"Board Meeting",...}]}
```

---

## 5. Useful Commands

| Command | Directory | Description |
|---|---|---|
| `npx directus bootstrap` | `src/backend` | Initialise database and admin user |
| `npm run dev` | `src/backend` | Start Directus dev server (port 8055) |
| `npx directus schema snapshot ./snapshots/schema.yaml` | `src/backend` | Export current schema |
| `npx directus schema apply ./snapshots/schema.yaml` | `src/backend` | Apply schema from snapshot |
| `npm run dev` | `src/frontend` | Start SvelteKit dev server (port 5173) |
| `npm run build` | `src/frontend` | Build frontend for production |
| `npm run preview` | `src/frontend` | Preview production build locally |

---

## 6. Building for Production

### Backend (Directus)

For production, configure the `.env` with a production database (PostgreSQL
recommended), set a strong `SECRET`, and start with:

```bash
cd src/backend
npx directus bootstrap
npx directus start
```

See the [Directus deployment docs](https://docs.directus.io/self-hosted/quickstart.html)
for advanced options (Docker, PM2, systemd, etc.).

### Frontend (SvelteKit)

```bash
cd src/frontend
npm run build
```

The output in `build/` is a set of static files (CSR SPA) deployable to any
CDN or file server (Nginx, Caddy, S3, Vercel, Cloudflare Pages, etc.).

---

## 7. Changing the Database

See **[docs/DATABASE_SETUP.md](DATABASE_SETUP.md)** for instructions on
switching from the default SQLite to PostgreSQL or MySQL.

---

## 8. Adding Governance Modules

See **[docs/CONTENT_MODEL.md](CONTENT_MODEL.md)** for a guide on creating new
collections and managing the content model.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `curl http://localhost:8055/server/health` returns "connection refused" | Make sure `npm run dev` is running in `src/backend` |
| Frontend shows "Could not load modules" banner | Check `VITE_API_BASE_URL` in `src/frontend/.env` matches the Directus address |
| `npx directus bootstrap` fails with "database already exists" | Delete `data.db` (SQLite) or drop the database, then re-run |
| Port 8055 already in use | Change `PORT` in `src/backend/.env` and update `VITE_API_BASE_URL` |
| Schema out of sync after pulling | Run `npx directus schema apply ./snapshots/schema.yaml` in `src/backend` |
| Admin password forgotten | Set `ADMIN_PASSWORD` in `.env` and run `npx directus bootstrap` |
