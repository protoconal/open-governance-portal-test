// Transaction.cs — Domain entity for the Finances plugin.
//
// Traceability: Finances plugin sample entity

namespace GovernancePortal.Plugins.Finances.Models;

/// <summary>
/// Represents a financial transaction recorded by the organisation.
/// </summary>
public sealed class Transaction
{
    /// <summary>Primary key (auto-generated GUID).</summary>
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Brief description of what the money was for.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Amount in the configured currency.
    /// Positive = income, negative = expenditure.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>ISO-4217 currency code (e.g. "USD", "GBP").</summary>
    public string Currency { get; set; } = "USD";

    /// <summary>Category such as "Operations", "Events", "Grants".</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>UTC date the transaction occurred.</summary>
    public DateTime TransactionDateUtc { get; set; }

    /// <summary>Whether the transaction has been auditor-approved.</summary>
    public bool Approved { get; set; }

    /// <summary>Timestamp this record was created (UTC).</summary>
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}
