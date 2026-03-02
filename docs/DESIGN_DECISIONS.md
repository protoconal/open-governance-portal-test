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

## Future ADRs (Planned)

| ID | Topic |
|---|---|
| ADR-005 | Authentication and authorisation (JWT / OAuth2) |
| ADR-006 | Role-based access control per plugin |
| ADR-007 | Real-time notifications (SignalR vs. polling) |
| ADR-008 | Plugin marketplace and versioning |
