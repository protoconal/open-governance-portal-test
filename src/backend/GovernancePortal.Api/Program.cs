// Program.cs — Application entry point for the Governance Portal API.
//
// Architecture overview
// ─────────────────────
// • Minimal-API style host (no Startup.cs) running on ASP.NET Core 8.
// • Plugin system is wired through two extension methods:
//     AddGovernancePlugins() — DI registration
//     MapGovernancePlugins() — route mapping
// • Database provider is chosen at runtime via configuration (ADR-002).
//   The default is SQLite for easy "getting started" experience; production
//   operators swap it for SQL Server / PostgreSQL via appsettings.json.
// • CORS is wide-open in development; tighten in production via the
//   "AllowedOrigins" configuration key.
//
// Traceability: ADR-001, ADR-002, ADR-003

using GovernancePortal.Api.Extensions;
using GovernancePortal.Core.Interfaces;
using GovernancePortal.Core.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title   = "Open Governance Portal API",
        Version = "v1",
        Description =
            "Plugin-based governance platform API. " +
            "Each registered plugin exposes endpoints under /api/plugins/{pluginId}/.",
    });
});

// CORS — the Svelte dev server runs on a different port during development.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("AllowedOrigins")
            .Get<string[]>() ?? ["http://localhost:5173"];

        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Discover and register all governance plugins.
// Pass a directory path to support runtime-dropped plugin assemblies.
var pluginsDir = builder.Configuration["PluginsDirectory"]
                 ?? Path.Combine(AppContext.BaseDirectory, "plugins");
builder.Services.AddGovernancePlugins(pluginsDir);

// ── Build ─────────────────────────────────────────────────────────────────

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();

// ── Core API endpoints ────────────────────────────────────────────────────

// GET /api/plugins — returns all registered plugin manifests.
// The Svelte frontend calls this on load to build dynamic navigation.
app.MapGet("/api/plugins", (IReadOnlyList<IPlugin> plugins) =>
    plugins.Select(p => p.ToManifest()))
   .WithName("GetPlugins")
   .WithOpenApi()
   .Produces<IEnumerable<PluginManifest>>();

// GET /api/health — lightweight liveness probe used by load balancers / CI.
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", utc = DateTime.UtcNow }))
   .WithName("HealthCheck")
   .WithOpenApi()
   .ExcludeFromDescription();

// ── Plugin endpoint mapping ───────────────────────────────────────────────

app.MapGovernancePlugins();

app.Run();

// Expose for integration-test projects that use WebApplicationFactory.
public partial class Program { }
