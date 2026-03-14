# Architecture Decision Records (ADRs)

> This document captures the significant design decisions made during the
> creation of the Open Governance Portal.  Each ADR explains the context,
> the decision, and the consequences.

---

## ADR-001 — Plugin Architecture: DI-based IPlugin Contract

**Status:** Superseded by ADR-006

**Context**

The portal must be modular so that new governance modules (scheduling,
finances, etc.) can be added without modifying the host application.
Several plugin approaches exist in .NET:

- MEF (Managed Extensibility Framework) — powerful but complex
- MAF (Managed Add-in Framework) — heavyweight; process isolation
- Custom DI scanning — lightweight; uses familiar ASP.NET DI patterns

**Decision**

Use a simple `IPlugin` interface combined with ASP.NET Core's DI container.
Each plugin class:
1. Implements `IPlugin`.
2. Registers its services via `ConfigureServices(IServiceCollection)`.
3. Registers its endpoints via `MapEndpoints(IEndpointRouteBuilder)`.

The host discovers plugins via `PluginDiscovery.Discover()` (ADR-003) and
calls these methods during startup.

**Consequences**

- ✅ Simple to understand and test.
- ✅ No extra framework dependencies.
- ✅ Plugins are indistinguishable from normal ASP.NET middleware to the DI container.
- ⚠️ No built-in plugin isolation; a badly-written plugin can affect the host.
- ⚠️ Breaking changes to `IPlugin` require recompiling all plugins.

> **Superseded:** The custom plugin architecture has been replaced by Directus
> collections and extensions.  See ADR-006.

---

## ADR-002 — Database Strategy: EF Core + Configurable Provider

**Status:** Superseded by ADR-006

**Context**

Different organisations have different database infrastructure.  Some use SQL
Server, others PostgreSQL, others want the simplest possible setup (SQLite).
Hard-coding a provider would limit adoption.

**Decision**

Use Entity Framework Core with a configurable provider.  The provider is
selected by reading `DatabaseProvider` from `appsettings.json`.  Connection
strings live in the same file.

Plugins extend `PluginDbContext` (a thin wrapper around `DbContext`) which
applies a table-name prefix to isolate plugin tables from each other.

**Consequences**

- ✅ Operators choose their database without touching C# code.
- ✅ EF Core migrations work identically across providers.
- ✅ Table prefixing prevents collisions in shared databases.
- ⚠️ EF Core provider abstractions leak slightly (e.g. some LINQ is provider-
  specific).

> **Superseded:** Database management is now handled entirely by Directus,
> which supports SQLite, PostgreSQL, and MySQL via environment variables.
> See ADR-006.

---

## ADR-003 — Plugin Discovery: Assembly Scan + Directory Probe

**Status:** Superseded by ADR-006

**Context**

Plugins need to be found by the host at startup.  Two scenarios exist:

1. **Bundled plugins** — compiled into the same solution (e.g. the three sample
   plugins).  These are already loaded into the `AppDomain`.
2. **Drop-in plugins** — third-party `.dll` files placed in a `plugins/` folder.

**Decision**

`PluginDiscovery.Discover()` performs:
1. An `AppDomain` scan for types implementing `IPlugin`.
2. A directory probe of the configured `PluginsDirectory` that loads any `.dll`
   files via `Assembly.LoadFrom()`.

Errors during individual assembly loads are caught and logged; a bad plugin
does not crash the host.

**Consequences**

- ✅ Works for both bundled and drop-in plugins with a single code path.
- ✅ No XML manifests or reflection-heavy frameworks needed.
- ⚠️ `Assembly.LoadFrom()` requires the plugin and its dependencies to be
  present in the plugins folder.
- ⚠️ There is no plugin version conflict detection.

> **Superseded:** Plugin discovery is no longer needed.  Governance modules are
> Directus collections, discovered automatically via the REST API.  See ADR-006.

---

## ADR-004 — Frontend Strategy: SvelteKit CSR SPA

**Status:** Accepted

**Context**

The frontend must:
- Display a dashboard of all governance modules without hard-coded knowledge.
- Navigate to module-specific pages.
- Remain simple enough for a beginner to modify.

**Decision**

Use **SvelteKit** as the frontend meta-framework, configured as a **client-side
rendered (CSR) single-page application** using `adapter-static` and
`ssr = false`.

On startup the layout fetches governance modules from the Directus API
(`GET /items/governance_modules`) and stores the result in a Svelte writable
store.  All UI elements (navigation links, dashboard cards, module pages)
derive from this store.

The API client normalises Directus `{ data: [...] }` envelope responses and
converts `snake_case` field names to `camelCase`.

**Consequences**

- ✅ Adding a governance module in Directus automatically surfaces it in the
  frontend with no code changes.
- ✅ SvelteKit's file-based routing and TypeScript support make the codebase
  navigable.
- ✅ CSR SPA output is a set of static files deployable to any CDN or file
  server.
- ⚠️ SvelteKit (not plain Svelte) is required.  This is the recommended way to
  build Svelte apps but may be unfamiliar to developers who have only used
  plain Svelte.

---

## ADR-005 — Block Editor: Extensible Block-Based WYSIWYG Framework

**Status:** Accepted

**Context**

The portal needs a way for users to compose rich, structured content —
meeting minutes, policy documents, reports with embedded visualisations,
etc.  Requirements:

- Block-based editing (ordered list of typed content units).
- Interchangeable WYSIWYG editors (currently Milkdown and TinyMCE).
- Extensible block type registry so plugins can add custom blocks.
- WCAG 2.0 Level AA compliance throughout.
- Optional heavyweight blocks (e.g. D3.js graph) that are not bundled
  by default.

**Decision**

Introduce a `block-editor` library under `src/frontend/src/lib/block-editor/`
with the following architecture:

1. **Core types** — `Block`, `BlockDocument`, `BlockDefinition` expressed as
   TypeScript interfaces.
2. **Block registry** — A Svelte store where block types are registered at
   runtime.  Built-in types (text, heading, image, code) are always
   available; optional types (D3 graph) are imported and registered
   separately.
3. **Editor adapter ABI** — An `EditorAdapter` interface that any WYSIWYG
   engine can implement: `init()`, `destroy()`, `getContent()`,
   `setContent()`, `onContentChange()`, `focus()`.  Three adapters ship:
   built-in `contenteditable`, Milkdown, and TinyMCE.
4. **Svelte store** — A `blockDocument` writable store with CRUD actions
   (`addBlock`, `removeBlock`, `moveBlock`, `updateBlockData`) that emit
   ARIA live-region announcements for screen readers.
5. **Serialiser** — `documentToHTML()` and `documentToJSON()` for export;
   `documentFromJSON()` for import.
6. **UI components** — `BlockEditor`, `BlockToolbar`, `BlockWrapper`,
   `EditorSelector` Svelte components with full keyboard support and ARIA.
7. **Plugin pattern** — Optional blocks live under `plugins/` and are never
   imported by the core.  The D3.js graph block demonstrates this pattern.

Block documents are persisted via the Directus REST API.  The serialised JSON
is stored in a Directus collection field, and images are uploaded to Directus
file storage.

**Consequences**

- ✅ New block types can be added without modifying the core framework.
- ✅ Editor engines can be swapped at runtime via the adapter registry.
- ✅ WCAG 2.0 AA compliance is enforced at the framework level (live
  announcements, focus management, semantic HTML, keyboard shortcuts).
- ✅ Optional plugins keep the base bundle lightweight.
- ⚠️ The adapter ABI uses HTML strings as the interchange format, which
  works for all current editors but may lose rich formatting details
  specific to a single editor (e.g. Milkdown's internal Markdown AST).
- ⚠️ Collaborative editing is not yet supported (planned future extension).

See `docs/BLOCK_EDITOR.md` for the full architecture guide.

---

## ADR-006 — Backend: Migration to Directus Headless CMS

**Status:** Accepted

**Context**

The original ASP.NET Core 8 backend (ADR-001 through ADR-003) implemented a
custom plugin architecture with DI-based discovery, EF Core database
abstraction, and hand-written REST endpoints.  While functional, this approach
was over-engineered for what is fundamentally a CMS use case:

- Every "plugin" was a CRUD module over a database table.
- Significant boilerplate was required for each new module (C# class, EF
  context, endpoint registration, migration).
- Authentication, authorisation, file storage, and real-time updates all had
  to be built from scratch.

Two headless CMS platforms were evaluated:

| Criteria | Strapi | Directus |
|---|---|---|
| Database approach | Schema-first (generates tables) | Database-first (introspects existing tables) |
| WebSocket support | Requires plugin | Native (`WEBSOCKETS_ENABLED=true`) |
| RBAC | Basic roles | Granular per-collection, per-field permissions |
| TypeScript SDK | Community-maintained | Official `@directus/sdk` |
| Schema versioning | JSON export | YAML snapshots (`npx directus schema apply`) |

**Decision**

Replace the entire ASP.NET Core backend with **Directus 11**.

- Each governance module becomes a **Directus collection** (e.g.
  `governance_modules`, `meetings`, `transactions`, `members`).
- The REST API (`/items/{collection}`) and GraphQL API (`/graphql`) are
  provided automatically by Directus — no custom endpoint code is needed.
- Authentication uses Directus built-in providers (email/password, OAuth 2.0,
  SSO, static API tokens).
- Authorisation uses Directus built-in RBAC with per-collection, per-field
  permission rules.
- Schema changes are tracked via YAML snapshots at
  `src/backend/snapshots/schema.yaml`.
- Custom business logic, when needed, is implemented as Directus extensions
  (hooks, custom endpoints, operations).

**Consequences**

- ✅ No custom backend code to maintain for standard CRUD operations.
- ✅ Built-in authentication (email/password, OAuth, SSO, API tokens).
- ✅ Built-in RBAC with a visual permission editor.
- ✅ Built-in file storage with configurable adapters (local, S3, etc.).
- ✅ Built-in webhooks and automation flows.
- ✅ Instant REST + GraphQL APIs for every collection.
- ✅ Schema versioning via YAML snapshots — diffs are human-readable.
- ✅ Native WebSocket support for real-time subscriptions.
- ✅ Admin panel for non-technical users to manage content and permissions.
- ⚠️ Tied to the Directus release cycle for backend features and bug fixes.
- ⚠️ Custom business logic requires writing Directus extensions (hooks,
  endpoints, operations) rather than standard Node.js/Express code.
- ⚠️ Advanced query patterns may hit Directus API limitations; raw SQL is
  available as a fallback via custom endpoints.

---

## Future ADRs (Planned)

| ID | Topic |
|---|---|
| ADR-007 | Collaborative editing (CRDT / Yjs integration) |
| ADR-008 | Plugin marketplace for community block types |
| ADR-009 | Multi-tenancy strategy |
