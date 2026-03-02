# Plugin System Guide

> Traceability tag: PLUGIN-001
> Relates to: ADR-001, ADR-003

---

## Overview

Every functional module in the portal is a **plugin**.  A plugin is an
assembly (`.dll`) that contains at least one class implementing `IPlugin`.

The host API discovers plugins, calls their `ConfigureServices()` method during
startup, then calls `MapEndpoints()` to register HTTP routes.

---

## Backend: Implementing `IPlugin`

### Minimum viable plugin

```csharp
// MyCustomPlugin.cs
using GovernancePortal.Core.Interfaces;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

public sealed class MyCustomPlugin : IPlugin
{
    public string PluginId    => "my-custom";          // URL-safe, unique
    public string DisplayName => "My Custom Module";
    public string Description => "Does something useful.";
    public string Version     => "1.0.0";

    public void ConfigureServices(IServiceCollection services)
    {
        // Register services your endpoints need.
        // e.g. services.AddScoped<IMyRepository, MyRepository>();
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        // All paths here are relative to /api/plugins/my-custom/
        endpoints.MapGet("/items", () => new[] { "item1", "item2" })
                 .WithName("MyCustom_GetItems")
                 .WithSummary("Return all items.");
    }
}
```

### Adding a database

1. Create a context that extends `PluginDbContext`:

```csharp
using GovernancePortal.Core.Data;
using Microsoft.EntityFrameworkCore;

public class MyCustomDbContext : PluginDbContext
{
    public MyCustomDbContext(DbContextOptions<MyCustomDbContext> options)
        : base(options, "my_custom") { }   // "my_custom" is the table prefix

    public DbSet<Item> Items => Set<Item>();
}
```

2. Register it in `ConfigureServices()`:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // The host reads the provider and connection string from config.
    // Use the same pattern as GovernancePortal.Api/Program.cs.
    services.AddDbContext<MyCustomDbContext>(options =>
        options.UseSqlite("Data Source=governance_portal.db"));
}
```

3. Inject it in your endpoints:

```csharp
endpoints.MapGet("/items", async (MyCustomDbContext db) =>
    await db.Items.ToListAsync());
```

---

## Distributing a Plugin

### Option A — Compile-time reference (recommended for bundled plugins)

Add a project reference from `GovernancePortal.Api` to your plugin project.
The plugin will be discovered automatically because its assembly is already
loaded into the `AppDomain`.

```xml
<!-- GovernancePortal.Api.csproj -->
<ProjectReference Include="..\MyCustomPlugin\MyCustomPlugin.csproj" />
```

### Option B — Runtime drop-in (recommended for third-party plugins)

1. Build your plugin: `dotnet publish -c Release`.
2. Copy the output `.dll` (and its dependencies) to the `plugins/` folder
   next to `GovernancePortal.Api.dll`.
3. Restart the API.

The `PluginDiscovery.Discover()` method scans the `plugins/` directory and
loads any assemblies it finds.

---

## Frontend: Plugin UI Components

> **Note:** Frontend plugin components are a stretch goal for v2.  The
> current prototype uses a single generic plugin page that shows API
> metadata.  The architecture below describes how a full implementation
> would work.

Each backend plugin can optionally provide a corresponding Svelte component.

### Client-side plugin registry (future)

A runtime registry would map plugin IDs to lazily-loaded Svelte components:

```typescript
// src/lib/plugins/components.ts
const componentRegistry: Record<string, () => Promise<typeof SvelteComponent>> = {
  scheduling: () => import('$lib/plugins/scheduling/SchedulingModule.svelte'),
  finances:   () => import('$lib/plugins/finances/FinancesModule.svelte'),
  // Add new entries here as plugins are developed
};

export async function loadPluginComponent(pluginId: string) {
  const loader = componentRegistry[pluginId];
  if (!loader) return null;
  const module = await loader();
  return module.default;
}
```

The generic plugin page (`routes/plugins/[pluginId]/+page.svelte`) would call
`loadPluginComponent(pluginId)` and use Svelte's `<svelte:component>` to
render the result.

---

## Plugin API Contract Summary

| Method | When called | Purpose |
|---|---|---|
| `PluginId` | At discovery | Unique URL-safe identifier |
| `DisplayName` | At discovery | Human-readable name for UI |
| `Description` | At discovery | Short description for dashboard card |
| `Version` | At discovery | SemVer string |
| `ConfigureServices(services)` | Before `WebApplication.Build()` | Register DI services |
| `MapEndpoints(endpoints)` | After `WebApplication.Build()` | Register HTTP routes |

Routes registered in `MapEndpoints` are automatically prefixed with
`/api/plugins/{PluginId}/` by the host.

---

## Sample Plugins Included

| Plugin | ID | Key Endpoints |
|---|---|---|
| Scheduling | `scheduling` | `GET /meetings`, `POST /meetings`, `DELETE /meetings/{id}` |
| Finances | `finances` | `GET /transactions`, `POST /transactions`, `GET /summary` |
| Members | `members` | `GET /members`, `POST /members`, `PATCH /members/{id}/deactivate` |
