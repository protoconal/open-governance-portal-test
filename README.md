# Open Governance Portal

A **modular, plugin-based web governance platform** built with an
**ASP.NET Core 8** backend and a **Svelte / SvelteKit** frontend.

---

## What Is This?

Open Governance Portal provides a single web-based interface for an
organisation's governance needs — meetings, finances, member management, and
any other module that can be expressed as a plugin.

The project is deliberately designed around two principles:

1. **Bring Your Own Database** — no specific database is required.  SQLite
   works out of the box; SQL Server and PostgreSQL are one configuration line
   away.
2. **Plugin-first** — every functional module is a plugin.  New capabilities
   can be added by dropping a `.dll` into the plugins folder and restarting the
   API, with no source changes required.

---

## Repository Layout

```
open-governance-portal/
├── docs/                          # Architecture and design documentation
│   ├── ARCHITECTURE.md            # System architecture overview
│   ├── PLUGIN_SYSTEM.md           # How to build and distribute plugins
│   ├── DATABASE_SETUP.md          # "Bring your own database" guide
│   ├── DESIGN_DECISIONS.md        # Architecture Decision Records (ADRs)
│   └── GETTING_STARTED.md         # Quick-start guide
│
└── src/
    ├── backend/                   # ASP.NET Core 8 solution
    │   ├── GovernancePortal.Core               # Shared interfaces + base classes
    │   ├── GovernancePortal.Api                # Web API host + plugin loader
    │   ├── GovernancePortal.Plugins.Scheduling # Sample plugin — meetings
    │   ├── GovernancePortal.Plugins.Finances   # Sample plugin — transactions
    │   └── GovernancePortal.Plugins.Members    # Sample plugin — member directory
    │
    └── frontend/                  # SvelteKit application
        └── src/
            ├── lib/
            │   ├── api/           # Typed API client
            │   ├── components/    # Shared Svelte components
            │   └── plugins/       # Client-side plugin registry
            └── routes/
                ├── +layout.svelte # Root layout (NavBar, plugin load)
                ├── +page.svelte   # Dashboard
                └── plugins/[pluginId]/+page.svelte  # Generic plugin page
```

---

## Quick Start

See **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)** for the full guide.

### Prerequisites

| Tool        | Minimum version |
|-------------|-----------------|
| .NET SDK    | 8.0             |
| Node.js     | 18              |
| npm         | 9               |

### 1 — Start the backend

```bash
cd src/backend/GovernancePortal.Api
dotnet run
# API available at http://localhost:5000
# Swagger UI at  http://localhost:5000/swagger
```

### 2 — Start the frontend

```bash
cd src/frontend
npm install
npm run dev
# UI available at http://localhost:5173
```

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System overview, component diagram, data flow |
| [Plugin System](docs/PLUGIN_SYSTEM.md) | How plugins work, how to write one |
| [Database Setup](docs/DATABASE_SETUP.md) | Switching database providers |
| [Design Decisions](docs/DESIGN_DECISIONS.md) | Architecture Decision Records (ADRs) |
| [Getting Started](docs/GETTING_STARTED.md) | Step-by-step setup guide |

---

## Conflicts and Known Limitations

The following items may be surprising for a beginner developer and are called
out explicitly:

1. **SvelteKit vs "plain Svelte"** — SvelteKit is the official meta-framework
   for Svelte.  It provides routing, server-side rendering, and build tooling.
   Using plain Svelte would require significantly more manual setup.

2. **In-memory stores in sample plugins** — The three sample plugins use
   in-memory data stores.  Data is lost on API restart.  This is intentional
   for the prototype; see [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) to
   connect real database storage.

3. **No authentication** — Authentication and authorisation are not included in
   this prototype.  Adding them is documented as a future ADR in
   [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md).

4. **Adapter-auto warning** — SvelteKit prints a warning about `adapter-auto`
   during build.  This is normal; see
   [Getting Started](docs/GETTING_STARTED.md) for deployment adapter options.

---

## Licence

MIT — see [LICENSE](LICENSE).
