// FinancesPlugin.cs — Sample "Finances" governance plugin.
//
// This is a SAMPLE plugin demonstrating the full plugin contract with a
// simple in-memory transaction ledger.
//
// Traceability: ADR-001 (plugin contract), ADR-003 (discovery)

using GovernancePortal.Core.Interfaces;
using GovernancePortal.Plugins.Finances.Models;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace GovernancePortal.Plugins.Finances;

/// <summary>
/// Finances plugin — tracks income, expenditure, and budgets.
/// </summary>
public sealed class FinancesPlugin : IPlugin
{
    /// <inheritdoc/>
    public string PluginId => "finances";

    /// <inheritdoc/>
    public string DisplayName => "Finances";

    /// <inheritdoc/>
    public string Description =>
        "Track income, expenditure, budgets, and generate financial reports.";

    /// <inheritdoc/>
    public string Version => "1.0.0";

    /// <inheritdoc/>
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton<TransactionStore>();
    }

    /// <inheritdoc/>
    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        // GET /api/plugins/finances/transactions
        endpoints.MapGet("/transactions", (TransactionStore store) =>
            store.GetAll())
            .WithName("Finances_GetTransactions")
            .WithSummary("List all financial transactions.");

        // GET /api/plugins/finances/transactions/{id}
        endpoints.MapGet("/transactions/{id:guid}", (Guid id, TransactionStore store) =>
            store.GetById(id) is { } t ? Results.Ok(t) : Results.NotFound())
            .WithName("Finances_GetTransaction")
            .WithSummary("Get a specific transaction by ID.");

        // GET /api/plugins/finances/summary — aggregate balance
        endpoints.MapGet("/summary", (TransactionStore store) =>
        {
            var all = store.GetAll();
            return Results.Ok(new
            {
                TotalIncome      = all.Where(t => t.Amount > 0).Sum(t => t.Amount),
                TotalExpenditure = all.Where(t => t.Amount < 0).Sum(t => Math.Abs(t.Amount)),
                Balance          = all.Sum(t => t.Amount),
                TransactionCount = all.Count,
            });
        })
        .WithName("Finances_GetSummary")
        .WithSummary("Return a financial summary (income, expenditure, balance).");

        // POST /api/plugins/finances/transactions
        endpoints.MapPost("/transactions", (Transaction tx, TransactionStore store) =>
        {
            store.Add(tx);
            return Results.Created($"/api/plugins/finances/transactions/{tx.Id}", tx);
        })
        .WithName("Finances_CreateTransaction")
        .WithSummary("Record a new financial transaction.");
    }
}

// ── Simple in-memory store (demo only) ────────────────────────────────────

/// <summary>Thread-safe in-memory transaction ledger for the sample plugin.</summary>
internal sealed class TransactionStore
{
    private readonly List<Transaction> _transactions = [];
    private readonly object _lock = new();

    public IReadOnlyList<Transaction> GetAll()
    {
        lock (_lock) return [.. _transactions];
    }

    public Transaction? GetById(Guid id)
    {
        lock (_lock) return _transactions.FirstOrDefault(t => t.Id == id);
    }

    public void Add(Transaction tx)
    {
        lock (_lock) _transactions.Add(tx);
    }
}
