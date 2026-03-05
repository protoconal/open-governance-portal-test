// Meeting.cs — Domain entity for the Scheduling plugin.
//
// Traceability: Scheduling plugin sample entity

namespace GovernancePortal.Plugins.Scheduling.Models;

/// <summary>
/// Represents a scheduled meeting or event within the governance portal.
/// </summary>
public sealed class Meeting
{
    /// <summary>Primary key (auto-generated GUID).</summary>
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Short title of the meeting (e.g. "Q1 Board Review").</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Detailed agenda or description.</summary>
    public string? Description { get; set; }

    /// <summary>UTC start time of the meeting.</summary>
    public DateTime StartsAtUtc { get; set; }

    /// <summary>UTC end time of the meeting.</summary>
    public DateTime EndsAtUtc { get; set; }

    /// <summary>Physical or virtual location / meeting link.</summary>
    public string? Location { get; set; }

    /// <summary>Whether minutes have been recorded and approved.</summary>
    public bool MinutesApproved { get; set; }

    /// <summary>Timestamp this record was created (UTC).</summary>
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}
