// MembersPlugin.cs — Sample "Members" governance plugin.
//
// This is a SAMPLE plugin demonstrating the full plugin contract with a
// simple in-memory member directory.
//
// Traceability: ADR-001 (plugin contract), ADR-003 (discovery)

using GovernancePortal.Core.Interfaces;
using GovernancePortal.Plugins.Members.Models;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace GovernancePortal.Plugins.Members;

/// <summary>
/// Members plugin — manages the organisational member directory.
/// </summary>
public sealed class MembersPlugin : IPlugin
{
    /// <inheritdoc/>
    public string PluginId => "members";

    /// <inheritdoc/>
    public string DisplayName => "Members";

    /// <inheritdoc/>
    public string Description =>
        "Manage the organisational member directory, roles, and membership status.";

    /// <inheritdoc/>
    public string Version => "1.0.0";

    /// <inheritdoc/>
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton<MemberStore>();
    }

    /// <inheritdoc/>
    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        // GET /api/plugins/members/members
        endpoints.MapGet("/members", (MemberStore store) =>
            store.GetAll())
            .WithName("Members_GetMembers")
            .WithSummary("List all organisation members.");

        // GET /api/plugins/members/members/{id}
        endpoints.MapGet("/members/{id:guid}", (Guid id, MemberStore store) =>
            store.GetById(id) is { } m ? Results.Ok(m) : Results.NotFound())
            .WithName("Members_GetMember")
            .WithSummary("Get a specific member by ID.");

        // POST /api/plugins/members/members
        endpoints.MapPost("/members", (Member member, MemberStore store) =>
        {
            store.Add(member);
            return Results.Created($"/api/plugins/members/members/{member.Id}", member);
        })
        .WithName("Members_CreateMember")
        .WithSummary("Add a new member to the directory.");

        // PATCH /api/plugins/members/members/{id}/deactivate
        endpoints.MapPatch("/members/{id:guid}/deactivate", (Guid id, MemberStore store) =>
        {
            var member = store.GetById(id);
            if (member is null) return Results.NotFound();
            member.IsActive = false;
            return Results.Ok(member);
        })
        .WithName("Members_DeactivateMember")
        .WithSummary("Deactivate a member's membership.");
    }
}

// ── Simple in-memory store (demo only) ────────────────────────────────────

/// <summary>Thread-safe in-memory member registry for the sample plugin.</summary>
internal sealed class MemberStore
{
    private readonly List<Member> _members = [];
    private readonly object _lock = new();

    public IReadOnlyList<Member> GetAll()
    {
        lock (_lock) return [.. _members];
    }

    public Member? GetById(Guid id)
    {
        lock (_lock) return _members.FirstOrDefault(m => m.Id == id);
    }

    public void Add(Member member)
    {
        lock (_lock) _members.Add(member);
    }
}
