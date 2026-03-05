# Database Setup — Bring Your Own Database

> Traceability tag: DB-001
> Relates to: ADR-002

---

## Overview

The governance portal uses **Entity Framework Core** as its database
abstraction layer.  EF Core supports multiple database providers, and you can
switch between them by changing two lines in `appsettings.json` — no C# code
changes are required.

---

## Supported Providers (out of the box)

| Provider | `DatabaseProvider` value | NuGet package |
|---|---|---|
| SQLite | `Sqlite` | `Microsoft.EntityFrameworkCore.Sqlite` (bundled) |
| SQL Server | `SqlServer` | `Microsoft.EntityFrameworkCore.SqlServer` |
| PostgreSQL | `PostgreSQL` | `Npgsql.EntityFrameworkCore.PostgreSQL` |

---

## Switching Providers

### SQLite (default — no setup required)

```json
// appsettings.json
{
  "DatabaseProvider": "Sqlite",
  "ConnectionStrings": {
    "Sqlite": "Data Source=governance_portal.db"
  }
}
```

SQLite stores the database in a single file in the working directory.  Perfect
for development and small deployments.

---

### SQL Server

1. Install the NuGet package:

   ```bash
   cd src/backend/GovernancePortal.Api
   dotnet add package Microsoft.EntityFrameworkCore.SqlServer
   ```

2. Update `appsettings.json`:

   ```json
   {
     "DatabaseProvider": "SqlServer",
     "ConnectionStrings": {
       "SqlServer": "Server=localhost;Database=GovernancePortal;Trusted_Connection=True;TrustServerCertificate=True;"
     }
   }
   ```

3. Wire up the provider in `Program.cs` (replace the `Sqlite` registration
   with):

   ```csharp
   options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer"));
   ```

---

### PostgreSQL

1. Install the NuGet package:

   ```bash
   cd src/backend/GovernancePortal.Api
   dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
   ```

2. Update `appsettings.json`:

   ```json
   {
     "DatabaseProvider": "PostgreSQL",
     "ConnectionStrings": {
       "PostgreSQL": "Host=localhost;Database=governance_portal;Username=postgres;Password=changeme;"
     }
   }
   ```

3. Wire up the provider in `Program.cs`:

   ```csharp
   options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQL"));
   ```

---

## Migrations

EF Core migrations allow the schema to evolve over time without manual SQL.

### Create a migration

```bash
cd src/backend/GovernancePortal.Api
dotnet ef migrations add InitialCreate --project ../GovernancePortal.Plugins.Scheduling
```

### Apply migrations on startup (development)

Add the following to `Program.cs` before `app.Run()`:

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
    db.Database.Migrate();
}
```

> **Warning:** Auto-migrating on startup is convenient in development but
> can cause issues in multi-instance production deployments.  Use a
> deployment migration step (e.g. `dotnet ef database update`) instead.

---

## Plugin Table Isolation

Every plugin context that extends `PluginDbContext` automatically prefixes its
table names with the plugin's `TablePrefix`.  For example, the Scheduling
plugin's tables will be named:

| Entity class | Table name |
|---|---|
| `Meeting` | `scheduling_Meeting` |

This prevents table name collisions between plugins even when they share the
same database.

---

## Separate Databases Per Plugin

If you want each plugin to use a completely separate database, register each
plugin's `DbContext` with a different connection string in `Program.cs`:

```csharp
services.AddDbContext<SchedulingDbContext>(options =>
    options.UseSqlite("Data Source=scheduling.db"));

services.AddDbContext<FinancesDbContext>(options =>
    options.UseSqlite("Data Source=finances.db"));
```
