// SchedulingPlugin.cs — Sample "Scheduling" governance plugin.
//
// This is a SAMPLE plugin demonstrating the full plugin contract.
// It intentionally uses an in-memory store rather than a real database so
// the project compiles and runs without any configuration.
//
// To replace with a real EF Core context:
//   1. Create a SchedulingDbContext : PluginDbContext with a DbSet<Meeting>.
//   2. Call services.AddDbContext<SchedulingDbContext>(...) in ConfigureServices.
//   3. Inject SchedulingDbContext instead of MeetingStore in the endpoints.
//
// Traceability: ADR-001 (plugin contract), ADR-003 (discovery)

using GovernancePortal.Core.Interfaces;
using GovernancePortal.Plugins.Scheduling.Models;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace GovernancePortal.Plugins.Scheduling;

/// <summary>
/// Scheduling plugin — provides meeting/event management endpoints.
/// </summary>
public sealed class SchedulingPlugin : IPlugin
{
    /// <inheritdoc/>
    public string PluginId => "scheduling";

    /// <inheritdoc/>
    public string DisplayName => "Scheduling";

    /// <inheritdoc/>
    public string Description =>
        "Create and manage governance meetings, agendas, and minutes.";

    /// <inheritdoc/>
    public string Version => "1.0.0";

    /// <inheritdoc/>
    public void ConfigureServices(IServiceCollection services)
    {
        // Register a scoped in-memory meeting store for demonstration.
        // Replace with AddDbContext<SchedulingDbContext>(...) for production.
        services.AddSingleton<MeetingStore>();
    }

    /// <inheritdoc/>
    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        // GET /api/plugins/scheduling/meetings
        endpoints.MapGet("/meetings", (MeetingStore store) =>
            store.GetAll())
            .WithName("Scheduling_GetMeetings")
            .WithSummary("List all scheduled meetings.");

        // GET /api/plugins/scheduling/meetings/{id}
        endpoints.MapGet("/meetings/{id:guid}", (Guid id, MeetingStore store) =>
            store.GetById(id) is { } m ? Results.Ok(m) : Results.NotFound())
            .WithName("Scheduling_GetMeeting")
            .WithSummary("Get a specific meeting by ID.");

        // POST /api/plugins/scheduling/meetings
        endpoints.MapPost("/meetings", (Meeting meeting, MeetingStore store) =>
        {
            store.Add(meeting);
            return Results.Created($"/api/plugins/scheduling/meetings/{meeting.Id}", meeting);
        })
        .WithName("Scheduling_CreateMeeting")
        .WithSummary("Create a new meeting.");

        // DELETE /api/plugins/scheduling/meetings/{id}
        endpoints.MapDelete("/meetings/{id:guid}", (Guid id, MeetingStore store) =>
            store.Remove(id) ? Results.NoContent() : Results.NotFound())
            .WithName("Scheduling_DeleteMeeting")
            .WithSummary("Delete a meeting.");
    }
}

// ── Simple in-memory store (demo only) ────────────────────────────────────

/// <summary>
/// Thread-safe in-memory meeting repository used by the sample plugin.
/// Replace with an EF Core repository in production.
/// </summary>
internal sealed class MeetingStore
{
    private readonly List<Meeting> _meetings = [];
    private readonly object _lock = new();

    public IReadOnlyList<Meeting> GetAll()
    {
        lock (_lock) return [.. _meetings];
    }

    public Meeting? GetById(Guid id)
    {
        lock (_lock) return _meetings.FirstOrDefault(m => m.Id == id);
    }

    public void Add(Meeting meeting)
    {
        lock (_lock) _meetings.Add(meeting);
    }

    public bool Remove(Guid id)
    {
        lock (_lock)
        {
            var idx = _meetings.FindIndex(m => m.Id == id);
            if (idx < 0) return false;
            _meetings.RemoveAt(idx);
            return true;
        }
    }
}
