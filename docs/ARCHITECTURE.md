# Architecture Overview

> Traceability tag: ARCH-001
> Last updated: 2025 (prototype)

---

## Goals

1. Provide an extensible, web-based governance platform for organisations.
2. Keep the host application small; all functional modules are plugins.
3. Support any relational database without code changes (ADR-002).
4. Give beginners a clear, navigable codebase with documented reasoning.

---

## High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser / Client                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  SvelteKit Frontend                          │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌─────────────────┐  ┌────────────────────┐  │   │
│  │  │ NavBar   │  │  Dashboard page │  │  Plugin page [id]  │  │   │
│  │  └──────────┘  └─────────────────┘  └────────────────────┘  │   │
│  │                                                              │   │
│  │  Plugin Registry (Svelte store) ─── API Client              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                             │ HTTP/JSON                             │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                    ASP.NET Core 8 API Host                          │
│                                                                     │
│  ┌──────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │  Core routes │  │   Plugin Loader   │  │   Swagger / OpenAPI │  │
│  │  /api/plugins│  │  PluginDiscovery  │  │   (dev only)        │  │
│  │  /api/health │  │  PluginExtensions │  └─────────────────────┘  │
│  └──────────────┘  └─────────┬─────────┘                           │
│                               │ loads                               │
│  ┌────────────────────────────▼──────────────────────────────────┐  │
│  │  Registered IPlugin implementations                          │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐  │  │
│  │  │ Scheduling │  │  Finances  │  │  Members   │  │  ...   │  │  │
│  │  │  Plugin    │  │  Plugin    │  │  Plugin    │  │        │  │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └───┬───┘  │  │
│  └────────┼───────────────┼───────────────┼──────────────┼──────┘  │
│           │ EF Core ctx   │               │              │          │
│           ▼               ▼               ▼              ▼          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │         Database (SQLite / SQL Server / PostgreSQL)         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow — Loading the Dashboard

```
Browser                         SvelteKit                    ASP.NET API
  │                                │                              │
  │── navigate to /  ──────────────▶                              │
  │                             +layout.svelte mounts             │
  │                             loadPlugins() called              │
  │                                │── GET /api/plugins ─────────▶│
  │                                │                         returns list of
  │                                │                         PluginManifest[]
  │                                │◀── 200 JSON ────────────────│
  │                             plugins store updated             │
  │                             NavBar + Dashboard rendered       │
  │◀── HTML with plugin cards ─────│                              │
```

---

## Key Design Decisions (see also docs/DESIGN_DECISIONS.md)

| Decision | Choice | Reason |
|---|---|---|
| Backend framework | ASP.NET Core 8 (minimal-API style) | Strong typing, performance, wide ecosystem |
| Frontend framework | SvelteKit | Lightweight, reactive, beginner-friendly |
| Plugin model | DI-based `IPlugin` contract | No MEF complexity; discoverable, testable |
| Database strategy | EF Core + provider swap | Single config change to switch providers |
| Plugin discovery | Assembly scan + directory probe | No XML manifests; works at compile and runtime |
| Authentication | Not included in prototype | Would add scope; marked as future work |

---

## Layer Responsibilities

### `GovernancePortal.Core`

- Defines `IPlugin` — the single interface every plugin must implement.
- Defines `PluginDbContext` — the base EF Core context plugins should extend.
- Defines `PluginManifest` — the JSON-serialisable plugin descriptor.
- Has **no dependency** on any specific plugin or database provider.

### `GovernancePortal.Api`

- Hosts the ASP.NET Core web application.
- Discovers plugins via `PluginDiscovery.Discover()`.
- Calls `ConfigureServices()` then `MapEndpoints()` on each plugin.
- Exposes `GET /api/plugins` and `GET /api/health` as core endpoints.

### `GovernancePortal.Plugins.*`

- Each implements `IPlugin`.
- Registers its own DI services in `ConfigureServices()`.
- Registers its own minimal-API endpoints in `MapEndpoints()`.
- May define its own EF Core `DbContext` that extends `PluginDbContext`.

### SvelteKit Frontend

- Fetches plugin manifests from `GET /api/plugins` on startup.
- Renders navigation and dashboard cards dynamically from that list.
- Each plugin page (`/plugins/[pluginId]`) can render a plugin-specific
  Svelte component loaded lazily from a client-side registry.
