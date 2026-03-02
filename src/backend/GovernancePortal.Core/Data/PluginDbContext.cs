// PluginDbContext.cs — Base EF Core DbContext every plugin should extend.
//
// Design rationale
// ----------------
// To keep tables from different plugins separate we prefix every table with
// the plugin's ID.  The connection string is provided by the host so that
// every plugin can share the same database *or* point to a different one —
// the choice is made entirely through configuration (ADR-002).
//
// Traceability: ADR-002 — Bring-Your-Own-Database strategy

using GovernancePortal.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace GovernancePortal.Core.Data;

/// <summary>
/// Abstract base for plugin-owned EF Core contexts.
/// Plugins derive from this class instead of raw <see cref="DbContext"/>
/// so the host can identify and configure them via <see cref="IPluginDbContext"/>.
/// </summary>
/// <example>
/// <code>
/// public class SchedulingDbContext : PluginDbContext
/// {
///     public SchedulingDbContext(DbContextOptions&lt;SchedulingDbContext&gt; options)
///         : base(options, "scheduling") { }
///
///     public DbSet&lt;Meeting&gt; Meetings =&gt; Set&lt;Meeting&gt;();
/// }
/// </code>
/// </example>
public abstract class PluginDbContext : DbContext, IPluginDbContext
{
    /// <inheritdoc/>
    public string TablePrefix { get; }

    /// <param name="options">EF Core options supplied by the host.</param>
    /// <param name="tablePrefix">
    /// Prefix applied to all table names (typically the plugin ID).
    /// </param>
    protected PluginDbContext(DbContextOptions options, string tablePrefix)
        : base(options)
    {
        TablePrefix = tablePrefix;
    }

    /// <inheritdoc/>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply the plugin's table prefix to every entity in this context so
        // that table names are predictable and isolated.
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            entity.SetTableName($"{TablePrefix}_{entity.GetTableName()}");
        }
    }
}
