// IPlugin.cs — Root contract that every governance plugin must implement.
//
// Design rationale
// ----------------
// The platform uses a lightweight, DI-based plug-in model rather than a
// heavier MEF/MAF approach.  Each plugin assembly:
//   1. Implements IPlugin (this interface).
//   2. Optionally supplies its own EF Core DbContext that extends
//      PluginDbContext, enabling "bring your own database" table isolation.
//   3. Registers its services through ConfigureServices().
//   4. Registers its API endpoints through MapEndpoints().
//
// Traceability: ADR-001 — Plugin Architecture Decision

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace GovernancePortal.Core.Interfaces;

/// <summary>
/// The single entry point every governance plugin must satisfy.
/// The host application discovers all <see cref="IPlugin"/> implementations
/// at startup and calls <see cref="ConfigureServices"/> then
/// <see cref="MapEndpoints"/> in order.
/// </summary>
public interface IPlugin
{
    /// <summary>Unique, URL-safe identifier for the plugin (e.g. "scheduling").</summary>
    string PluginId { get; }

    /// <summary>Human-readable display name shown in the portal UI.</summary>
    string DisplayName { get; }

    /// <summary>Short description rendered on the dashboard module card.</summary>
    string Description { get; }

    /// <summary>Semantic version of the plugin (e.g. "1.0.0").</summary>
    string Version { get; }

    /// <summary>
    /// Register any services this plugin needs into the DI container.
    /// Called once during application startup before the host is built.
    /// </summary>
    /// <param name="services">The host's <see cref="IServiceCollection"/>.</param>
    void ConfigureServices(IServiceCollection services);

    /// <summary>
    /// Map HTTP endpoints (minimal-API style) under the plugin's route prefix.
    /// Called once after <see cref="WebApplication"/> is built.
    /// </summary>
    /// <param name="endpoints">
    /// An <see cref="IEndpointRouteBuilder"/> scoped to <c>/api/plugins/{PluginId}/</c>.
    /// </param>
    void MapEndpoints(IEndpointRouteBuilder endpoints);
}
