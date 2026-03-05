// IPluginDbContext.cs — Marker interface for plugin-owned EF Core contexts.
//
// Traceability: ADR-002 — Bring-Your-Own-Database strategy

using Microsoft.EntityFrameworkCore;

namespace GovernancePortal.Core.Interfaces;

/// <summary>
/// Optional contract a plugin may implement on its EF Core DbContext so the
/// host's database-registration helper can discover and configure it
/// automatically with the user-supplied connection string.
/// </summary>
public interface IPluginDbContext
{
    /// <summary>
    /// Schema / table-name prefix that isolates the plugin's tables from other
    /// plugins and the portal core tables.  Defaults to the plugin ID.
    /// </summary>
    string TablePrefix { get; }
}
