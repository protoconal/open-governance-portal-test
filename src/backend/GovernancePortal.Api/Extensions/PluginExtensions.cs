// PluginExtensions.cs — DI helpers for registering discovered plugins.
//
// Traceability: ADR-001, ADR-003

using GovernancePortal.Core.Interfaces;
using GovernancePortal.Core.Models;
using GovernancePortal.Api.PluginLoader;

namespace GovernancePortal.Api.Extensions;

/// <summary>
/// Extension methods that integrate the plugin system with the
/// ASP.NET Core dependency injection container and routing pipeline.
/// </summary>
public static class PluginExtensions
{
    /// <summary>
    /// Discovers all <see cref="IPlugin"/> implementations, calls
    /// <see cref="IPlugin.ConfigureServices"/> on each, and registers the full
    /// plugin list as a singleton <see cref="IReadOnlyList{IPlugin}"/> so it
    /// can be injected into controllers / endpoint handlers.
    /// </summary>
    public static IServiceCollection AddGovernancePlugins(
        this IServiceCollection services,
        string? pluginsDirectory = null)
    {
        var plugins = PluginDiscovery.Discover(pluginsDirectory);

        // Let each plugin register its own services (repositories, validators, etc.)
        foreach (var plugin in plugins)
        {
            plugin.ConfigureServices(services);
        }

        // Expose the list so controllers/endpoints can produce plugin manifests.
        services.AddSingleton<IReadOnlyList<IPlugin>>(plugins);

        return services;
    }

    /// <summary>
    /// Maps every registered plugin's endpoints under
    /// <c>/api/plugins/{pluginId}/</c>.
    /// </summary>
    public static WebApplication MapGovernancePlugins(this WebApplication app)
    {
        var plugins = app.Services.GetRequiredService<IReadOnlyList<IPlugin>>();

        foreach (var plugin in plugins)
        {
            // Each plugin gets its own isolated route group so endpoint names
            // never collide between plugins.
            var group = app.MapGroup($"/api/plugins/{plugin.PluginId}")
                           .WithTags(plugin.DisplayName);
            plugin.MapEndpoints(group);
        }

        return app;
    }

    /// <summary>Converts a loaded <see cref="IPlugin"/> to its API manifest.</summary>
    public static PluginManifest ToManifest(this IPlugin plugin) =>
        new()
        {
            PluginId    = plugin.PluginId,
            DisplayName = plugin.DisplayName,
            Description = plugin.Description,
            Version     = plugin.Version,
            ApiPrefix   = $"/api/plugins/{plugin.PluginId}",
        };
}
