// Member.cs — Domain entity for the Members plugin.
//
// Traceability: Members plugin sample entity

namespace GovernancePortal.Plugins.Members.Models;

/// <summary>
/// Represents an organisation member tracked by the governance portal.
/// </summary>
public sealed class Member
{
    /// <summary>Primary key (auto-generated GUID).</summary>
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Member's full legal name.</summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>Primary email address (used for notifications).</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Role within the organisation (e.g. "Board Member", "Treasurer").
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>UTC date the membership became active.</summary>
    public DateTime JoinedAtUtc { get; set; }

    /// <summary>UTC date the membership expires, or null for indefinite.</summary>
    public DateTime? ExpiresAtUtc { get; set; }

    /// <summary>Whether this member currently holds an active membership.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Timestamp this record was created (UTC).</summary>
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}
