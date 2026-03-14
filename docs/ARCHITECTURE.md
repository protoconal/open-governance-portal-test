# Architecture Overview

> Traceability tag: ARCH-001
> Relates to: ADR-004, ADR-005, ADR-006
> Last updated: 2025

---

## Goals

1. Provide an extensible, web-based governance platform for organisations.
2. Eliminate custom backend code — use a headless CMS for content and API.
3. Support multiple relational databases without code changes.
4. Give beginners a clear, navigable codebase with documented reasoning.

---

## High-Level Component Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                              │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    SvelteKit Frontend (CSR SPA)                │   │
│  │                                                                │   │
│  │  ┌──────────┐  ┌─────────────────┐  ┌──────────────────────┐  │   │
│  │  │ NavBar   │  │  Dashboard page │  │  Module pages        │  │   │
│  │  └──────────┘  └─────────────────┘  └──────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │   │
│  │  │ Block Editor │  │  D3 Graphs   │  │  Mattermost Chat    │ │   │
│  │  │ (ADR-005)    │  │              │  │                      │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │   │
│  │                                                                │   │
│  │  API Client (REST) ─── WebSocket Client (realtime)            │   │
│  └────────────────────────────────────────────────────────────────┘   │
│              │ HTTP/JSON + WebSocket                                   │
└──────────────┼────────────────────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────────────────────┐
│                        Directus 11 (Backend)                          │
│                                                                       │
│  ┌────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │  REST API      │  │  Admin Panel      │  │  GraphQL API        │  │
│  │  /items/{col}  │  │  /admin           │  │  /graphql           │  │
│  └────────────────┘  └───────────────────┘  └─────────────────────┘  │
│                                                                       │
│  ┌────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │  Auth & RBAC   │  │  File Storage     │  │  WebSockets         │  │
│  │  (built-in)    │  │  (built-in)       │  │  (native)           │  │
│  └────────────────┘  └───────────────────┘  └─────────────────────┘  │
│                                                                       │
│  ┌────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │  Extensions    │  │  Webhooks &       │  │  Schema Snapshots   │  │
│  │  (hooks,       │  │  Flows            │  │  (version control)  │  │
│  │   endpoints)   │  │                   │  │                     │  │
│  └────────────────┘  └───────────────────┘  └─────────────────────┘  │
│                               │                                       │
│  ┌────────────────────────────▼───────────────────────────────────┐   │
│  │           Database (SQLite / PostgreSQL / MySQL)               │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow — Loading the Dashboard

```
Browser                         SvelteKit                    Directus API
  │                                │                              │
  │── navigate to /  ──────────────▶                              │
  │                             +layout.svelte mounts             │
  │                             loadModules() called              │
  │                                │                              │
  │                                │── GET /items/governance_modules ──▶│
  │                                │                         returns   │
  │                                │                         { data: [...] }
  │                                │◀── 200 JSON ────────────────│
  │                             modules store updated             │
  │                             (snake_case → camelCase)          │
  │                             NavBar + Dashboard rendered       │
  │◀── rendered SPA ───────────────│                              │
  │                                │                              │
  │    (user opens Meetings)       │                              │
  │── navigate to /modules/meetings ▶                             │
  │                                │── GET /items/meetings ──────▶│
  │                                │◀── 200 JSON ────────────────│
  │◀── rendered meeting list ──────│                              │
```

---

## Data Flow Diagram

```
 ┌─────────────┐     REST / GraphQL     ┌──────────────┐     SQL      ┌──────────┐
 │  SvelteKit  │ ◀────────────────────▶ │   Directus   │ ◀──────────▶ │ Database │
 │  Frontend   │                        │   Server     │              │ (SQLite/ │
 │  (browser)  │     WebSocket          │              │              │  PG/MySQL│
 │             │ ◀────────────────────▶ │              │              │  )       │
 └─────────────┘                        └──────────────┘              └──────────┘
                                              │
                                              │ Webhooks / Flows
                                              ▼
                                        ┌──────────────┐
                                        │  External    │
                                        │  Services    │
                                        └──────────────┘
```

---

## Key Design Decisions (see also docs/DESIGN_DECISIONS.md)

| Decision | Choice | Reason |
|---|---|---|
| Backend platform | Directus 11 headless CMS (ADR-006) | No custom backend code; instant REST + GraphQL APIs |
| Frontend framework | SvelteKit (CSR SPA, `adapter-static`) (ADR-004) | Lightweight, reactive, beginner-friendly |
| Content modelling | Directus collections | Visual admin panel; schema snapshots for version control |
| Database strategy | Directus-managed (SQLite/PostgreSQL/MySQL) | Single `.env` change to switch providers |
| Authentication | Directus built-in (email/password, OAuth, SSO, tokens) | No custom auth code required |
| Authorisation | Directus built-in RBAC | Visual role/permission editor in admin panel |
| Real-time | Directus native WebSockets (`WEBSOCKETS_ENABLED=true`) | Push updates without polling |
| Block editor | Custom block framework (ADR-005) | Extensible, WCAG 2.0 AA, editor-agnostic |

---

## Layer Responsibilities

### Directus Backend (`src/backend/`)

- **REST API** — Automatic CRUD endpoints at `/items/{collection}` for every
  collection (e.g. `/items/governance_modules`, `/items/meetings`).
- **GraphQL API** — Full GraphQL endpoint at `/graphql`.
- **Admin panel** — Visual interface at `/admin` for managing collections,
  fields, roles, permissions, and content.
- **Authentication** — Built-in email/password, OAuth 2.0, SSO, and static
  API tokens.
- **RBAC** — Role-based access control with per-collection, per-field
  permissions configured in the admin panel.
- **File storage** — Built-in asset management with configurable storage
  adapters (local, S3, etc.).
- **WebSockets** — Native real-time subscriptions for collection changes.
- **Schema snapshots** — Export/apply schema as YAML for version control
  (`src/backend/snapshots/schema.yaml`).
- **Extensions** — Custom hooks, endpoints, and operations when built-in
  features are insufficient.

### SvelteKit Frontend (`src/frontend/`)

- Runs as a **pure CSR single-page application** (`adapter-static`,
  `ssr=false`).
- Fetches governance module metadata from `GET /items/governance_modules` on
  startup and stores it in a Svelte writable store.
- Normalises Directus `{ data: [...] }` envelope responses and converts
  `snake_case` field names to `camelCase`.
- Renders navigation, dashboard cards, and module pages dynamically.
- Provides the block editor framework (ADR-005) for rich content editing.
- Integrates D3.js graph visualisations as an optional block editor plugin.
- Integrates Mattermost chat via `$lib/chat`.
- Connects to Directus WebSockets for real-time updates via `$lib/realtime`.
