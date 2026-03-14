# Open Governance Portal

A **web-based governance platform** powered by a **Directus 11** headless CMS
backend and a **SvelteKit** single-page application frontend.

---

## What Is This?

Open Governance Portal provides a single web-based interface for an
organisation's governance needs — meetings, finances, member management, and
any other module that can be modelled as a Directus collection.

The project is built around two principles:

1. **Bring Your Own Database** — SQLite works out of the box; PostgreSQL and
   MySQL/MariaDB are one `.env` change away.
2. **Content-model-first** — every governance module is a Directus collection.
   New modules are added through the Directus admin panel — no custom backend
   code required (ADR-006).

---

## Repository Layout

```
open-governance-portal/
├── docs/                          # Architecture and design documentation
│   ├── ARCHITECTURE.md            # System architecture overview
│   ├── BLOCK_EDITOR.md            # Block editor framework guide
│   ├── CONTENT_MODEL.md           # Content model & collections guide
│   ├── DATABASE_SETUP.md          # Database configuration guide
│   ├── DESIGN_DECISIONS.md        # Architecture Decision Records (ADRs)
│   └── GETTING_STARTED.md         # Quick-start guide
│
└── src/
    ├── backend/                   # Directus 11 headless CMS
    │   ├── .env.example           # Environment template
    │   ├── package.json           # Directus dependency
    │   ├── extensions/            # Custom Directus extensions (hooks, endpoints)
    │   └── snapshots/
    │       └── schema.yaml        # Schema snapshot for version control
    │
    └── frontend/                  # SvelteKit application (CSR SPA)
        └── src/
            ├── lib/
            │   ├── api/           # Directus API client (REST)
            │   ├── components/    # Shared Svelte components
            │   ├── block-editor/  # Block editor framework (ADR-005)
            │   ├── chat/          # Mattermost chat integration
            │   └── realtime/      # WebSocket client
            └── routes/
                ├── +layout.svelte # Root layout (NavBar)
                ├── +page.svelte   # Dashboard
                └── modules/       # Governance module pages
```

---

## Quick Start

See **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)** for the full guide.

### Prerequisites

| Tool    | Version  |
|---------|----------|
| Node.js | 18–22 LTS |
| npm     | 9+       |

### 1 — Start the backend (Directus)

```bash
cd src/backend
cp .env.example .env          # configure secrets and DB
npm install
npx directus bootstrap        # initialise database & admin user
npm run dev                    # http://localhost:8055
```

### 2 — Start the frontend (SvelteKit)

```bash
cd src/frontend
cp .env.example .env           # set VITE_API_BASE_URL=http://localhost:8055
npm install
npm run dev                    # http://localhost:5173
```

---

## Tech Stack

| Layer     | Technology                  | Purpose                              |
|-----------|-----------------------------|--------------------------------------|
| Backend   | Directus 11                 | Headless CMS, REST + GraphQL API, admin panel, auth, RBAC |
| Frontend  | SvelteKit (`adapter-static`, `ssr=false`) | CSR single-page application |
| Database  | SQLite (default) / PostgreSQL / MySQL | Relational storage via Directus      |
| Graphing  | D3.js                       | Interactive data visualisations       |
| Chat      | Mattermost                  | Integrated team communication         |
| Editor    | Block editor (ADR-005)      | WYSIWYG document editing              |

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System overview, component diagram, data flow |
| [Content Model](docs/CONTENT_MODEL.md) | Directus collections, schema snapshots, extensions |
| [Database Setup](docs/DATABASE_SETUP.md) | Switching database providers |
| [Design Decisions](docs/DESIGN_DECISIONS.md) | Architecture Decision Records (ADRs) |
| [Getting Started](docs/GETTING_STARTED.md) | Step-by-step setup guide |
| [Block Editor](docs/BLOCK_EDITOR.md) | Block-based WYSIWYG editor framework |

---

## Notes for Beginners

1. **SvelteKit vs "plain Svelte"** — SvelteKit is the official meta-framework
   for Svelte.  It provides routing and build tooling.  The app is configured
   as a client-side rendered (CSR) SPA using `adapter-static` and `ssr=false`.

2. **Directus admin panel** — After running `npx directus bootstrap`, open
   `http://localhost:8055/admin` to manage collections, permissions, and
   content through a visual interface.

3. **Authentication is built in** — Directus provides email/password, OAuth,
   SSO, and API token authentication out of the box (ADR-006).

---

## Licence

MIT — see [LICENSE](LICENSE).
