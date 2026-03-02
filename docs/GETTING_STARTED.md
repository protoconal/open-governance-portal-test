# Getting Started

> Traceability tag: SETUP-001

This guide walks you from a freshly cloned repository to a running development
environment.

---

## Prerequisites

| Tool | Minimum version | Install guide |
|---|---|---|
| .NET SDK | 8.0 | https://dotnet.microsoft.com/download |
| Node.js | 18 | https://nodejs.org |
| npm | 9 | bundled with Node.js |
| Git | any | https://git-scm.com |

Optional but recommended:

- **VS Code** with the C# Dev Kit and Svelte extensions.
- **DB Browser for SQLite** to inspect the default database.

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/open-governance-portal.git
cd open-governance-portal
```

---

## 2. Start the Backend API

```bash
cd src/backend/GovernancePortal.Api
dotnet run
```

The API starts on **http://localhost:5000** (HTTP) and **https://localhost:5001**
(HTTPS, if a dev certificate is trusted).

Verify it is running:

```bash
curl http://localhost:5000/api/health
# {"status":"healthy","utc":"..."}

curl http://localhost:5000/api/plugins
# [{"pluginId":"scheduling","displayName":"Scheduling",...}, ...]
```

The interactive **Swagger UI** is available at
**http://localhost:5000/swagger** in development mode.

---

## 3. Start the Frontend

Open a **second terminal**:

```bash
cd src/frontend
npm install           # first time only
npm run dev
```

The Svelte dev server starts on **http://localhost:5173**.

Open that address in your browser to see the dashboard with the three sample
plugin cards.

---

## 4. Explore the Sample Plugins

| Plugin | Dashboard card | API base |
|---|---|---|
| Scheduling | ✅ | `http://localhost:5000/api/plugins/scheduling/` |
| Finances | ✅ | `http://localhost:5000/api/plugins/finances/` |
| Members | ✅ | `http://localhost:5000/api/plugins/members/` |

Try creating a meeting via the API:

```bash
curl -X POST http://localhost:5000/api/plugins/scheduling/meetings \
     -H "Content-Type: application/json" \
     -d '{"title":"Board Meeting","startsAtUtc":"2025-06-01T09:00:00Z","endsAtUtc":"2025-06-01T11:00:00Z"}'
```

Then list meetings:

```bash
curl http://localhost:5000/api/plugins/scheduling/meetings
```

---

## 5. Running Tests

There are no automated tests in this prototype version.  The backend and
frontend build cleanly without errors.  See the future work section in
`docs/DESIGN_DECISIONS.md` for planned test coverage.

---

## 6. Building for Production

### Backend

```bash
cd src/backend/GovernancePortal.Api
dotnet publish -c Release -o publish/
```

The output in `publish/` is a self-contained deployment ready for any server
running .NET 8+.

### Frontend

```bash
cd src/frontend
npm run build
```

The output in `.svelte-kit/output/` (or `build/` depending on the adapter)
can be served by any static or Node-based web server.

> **Adapter note:** The default `@sveltejs/adapter-auto` is used in the
> prototype.  For a specific deployment target, replace it with the
> appropriate adapter in `svelte.config.js`:
>
> | Target | Adapter package |
> |---|---|
> | Node.js server | `@sveltejs/adapter-node` |
> | Static hosting | `@sveltejs/adapter-static` |
> | Vercel | `@sveltejs/adapter-vercel` |
> | Cloudflare Pages | `@sveltejs/adapter-cloudflare` |

---

## 7. Changing the Database

See **[docs/DATABASE_SETUP.md](DATABASE_SETUP.md)** for instructions on
switching from the default SQLite to SQL Server or PostgreSQL.

---

## 8. Writing Your First Plugin

See **[docs/PLUGIN_SYSTEM.md](PLUGIN_SYSTEM.md)** for a step-by-step guide on
creating and registering a new plugin.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `curl http://localhost:5000/api/health` returns "connection refused" | Make sure `dotnet run` is running in `src/backend/GovernancePortal.Api` |
| Frontend shows "Could not load plugins" banner | Check the VITE_API_BASE_URL in `src/frontend/.env` matches the API address |
| HTTPS certificate errors on macOS | Run `dotnet dev-certs https --trust` |
| Port 5000 already in use | Change the API port in `Properties/launchSettings.json` and update `VITE_API_BASE_URL` |
