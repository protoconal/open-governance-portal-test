// PluginManifest.cs — Serialisable representation of a loaded plugin.
//
// This model is returned by GET /api/plugins so the Svelte frontend can
// build its navigation and dashboard dynamically.
//
// Traceability: ADR-001

namespace GovernancePortal.Core.Models;

/// <summary>
/// Lightweight descriptor that the API exposes to the frontend for every
/// registered plugin.  The frontend uses this to render navigation links
/// and module cards without needing any plugin-specific knowledge.
/// </summary>
public sealed class PluginManifest
{
    /// <summary>Unique, URL-safe identifier (e.g. "scheduling").</summary>
    public string PluginId { get; init; } = string.Empty;

    /// <summary>Human-readable name shown in navigation and cards.</summary>
    public string DisplayName { get; init; } = string.Empty;

    /// <summary>Short description rendered beneath the module title.</summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>Plugin version string (SemVer).</summary>
    public string Version { get; init; } = string.Empty;

    /// <summary>
    /// Icon identifier passed to the Svelte icon component.
    /// Corresponds to a Lucide icon name (e.g. "calendar", "dollar-sign").
    /// </summary>
    public string Icon { get; init; } = "package";

    /// <summary>
    /// Route prefix registered by the plugin under <c>/api/plugins/{PluginId}</c>.
    /// </summary>
    public string ApiPrefix { get; init; } = string.Empty;
}
