# Architecture Decision Records (ADRs)

> This document captures the significant design decisions made during the
> creation of the Open Governance Portal prototype.  Each ADR explains the
> context, the decision, and the consequences.

---

## ADR-001 — Plugin Architecture: DI-based IPlugin Contract

**Status:** Accepted

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
  (Acceptable for a trusted plugin ecosystem; mitigate with code review.)
- ⚠️ Breaking changes to `IPlugin` require recompiling all plugins.

---

## ADR-002 — Database Strategy: EF Core + Configurable Provider

**Status:** Accepted

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
  specific).  Stick to standard LINQ-to-Entities expressions to stay portable.

---

## ADR-003 — Plugin Discovery: Assembly Scan + Directory Probe

**Status:** Accepted

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
  present in the plugins folder.  Use `dotnet publish` to capture all
  transitive dependencies.
- ⚠️ There is no plugin version conflict detection.  Future work: add a
  semantic-version check and reject incompatible plugins with a clear error.

---

## ADR-004 — Frontend Strategy: SvelteKit + Dynamic Plugin Registry

**Status:** Accepted

**Context**

The frontend must:
- Display a dashboard of all registered plugins without hard-coded knowledge.
- Navigate to plugin-specific pages.
- Remain simple enough for a beginner to modify.

**Decision**

Use **SvelteKit** as the frontend meta-framework.  On startup the layout calls
`GET /api/plugins` and stores the result in a Svelte writable store.  All UI
elements (navigation links, dashboard cards, plugin pages) derive from this
store.

A generic `/plugins/[pluginId]` route handles all plugin pages.  In a full
implementation it would lazily load a plugin-specific Svelte component using a
client-side registry (see `docs/PLUGIN_SYSTEM.md`).

**Consequences**

- ✅ Adding a backend plugin automatically adds it to the frontend with no code
  changes.
- ✅ SvelteKit's file-based routing and TypeScript support make the codebase
  navigable.
- ⚠️ SvelteKit (not plain Svelte) is required.  This is the recommended way to
  build Svelte apps but may be unfamiliar to developers who have only used
  plain Svelte.
- ⚠️ Plugin-specific frontend components are not yet implemented (v2 scope).

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

## Future ADRs (Planned)

| ID | Topic |
|---|---|
| ADR-006 | Authentication and authorisation (JWT / OAuth2) |
| ADR-007 | Role-based access control per plugin |
| ADR-008 | Real-time notifications (SignalR vs. polling) |
| ADR-009 | Plugin marketplace and versioning |
