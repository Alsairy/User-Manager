using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Api.Controllers;

[ApiController]
[Authorize]
public class ContractsCompatController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public ContractsCompatController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("api/v1/contracts/dashboard")]
    [HasPermission("contracts:read")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken = default)
    {
        var totalContracts = await _dbContext.Contracts.CountAsync(cancellationToken);
        var activeContracts = await _dbContext.Contracts.CountAsync(c => c.Status == ContractStatus.Active, cancellationToken);
        var expiringContracts = await _dbContext.Contracts.CountAsync(c => c.Status == ContractStatus.Expiring, cancellationToken);
        var incompleteContracts = await _dbContext.Contracts.CountAsync(c => c.Status == ContractStatus.Incomplete, cancellationToken);
        var cancelledContracts = await _dbContext.Contracts.CountAsync(c => c.Status == ContractStatus.Cancelled, cancellationToken);
        var archivedContracts = await _dbContext.Contracts.CountAsync(c => c.Status == ContractStatus.Archived, cancellationToken);
        var totalContractValue = await _dbContext.Contracts.SumAsync(c => c.TotalContractAmount, cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var installments = await _dbContext.Installments.ToListAsync(cancellationToken);
        var overdueInstallments = installments.Count(i => i.Status == InstallmentStatus.Overdue ||
                                                          (i.Status == InstallmentStatus.Pending && i.DueDate < today));
        var overdueAmount = installments
            .Where(i => i.Status == InstallmentStatus.Overdue || (i.Status == InstallmentStatus.Pending && i.DueDate < today))
            .Sum(i => i.AmountDue);
        var pendingInstallments = installments.Count(i => i.Status == InstallmentStatus.Pending);
        var paidThisMonth = installments.Count(i => i.Status == InstallmentStatus.Paid &&
                                                    i.PaymentDate.HasValue &&
                                                    i.PaymentDate.Value.Month == DateTime.UtcNow.Month &&
                                                    i.PaymentDate.Value.Year == DateTime.UtcNow.Year);
        var paidAmountThisMonth = installments
            .Where(i => i.Status == InstallmentStatus.Paid &&
                        i.PaymentDate.HasValue &&
                        i.PaymentDate.Value.Month == DateTime.UtcNow.Month &&
                        i.PaymentDate.Value.Year == DateTime.UtcNow.Year)
            .Sum(i => i.AmountDue);
        var installmentsDueToday = installments.Count(i => i.DueDate == today && i.Status == InstallmentStatus.Pending);

        return Ok(new
        {
            totalContracts,
            activeContracts,
            expiringContracts,
            totalContractValue,
            overdueInstallments,
            overdueAmount,
            pendingInstallments,
            paidThisMonth,
            paidAmountThisMonth,
            installmentsDueToday,
            incompleteContracts,
            cancelledContracts,
            archivedContracts
        });
    }

    [HttpPost("api/v1/contracts/{id:guid}/archive")]
    [HasPermission("contracts:update")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken = default)
    {
        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        contract.Status = ContractStatus.Archived;
        contract.ArchivedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("api/v1/contracts/{id:guid}/activate")]
    [HasPermission("contracts:update")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken cancellationToken = default)
    {
        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        contract.Status = ContractStatus.Active;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("api/v1/contracts/{id:guid}/cancel")]
    [HasPermission("contracts:update")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken = default)
    {
        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        contract.Status = ContractStatus.Cancelled;
        contract.CancelledAt = DateTime.UtcNow;
        if (payload.TryGetProperty("reason", out var reasonValue))
        {
            contract.CancellationReason = ParseCancellationReason(reasonValue.GetString());
        }
        if (payload.TryGetProperty("justification", out var justificationValue))
        {
            contract.CancellationJustification = justificationValue.GetString();
        }
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("api/v1/contracts/{id:guid}/installment-plan")]
    [HasPermission("contracts:create")]
    public async Task<IActionResult> InstallmentPlan(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken = default)
    {
        var contract = await _dbContext.Contracts.Include(c => c.Installments).FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        var planType = payload.TryGetProperty("type", out var typeValue) ? typeValue.GetString() : "equal";
        var count = payload.TryGetProperty("count", out var countValue) && countValue.ValueKind == JsonValueKind.Number
            ? countValue.GetInt32()
            : 12;
        var frequency = payload.TryGetProperty("frequency", out var freqValue) ? freqValue.GetString() : "monthly";

        contract.InstallmentPlanType = string.Equals(planType, "custom", StringComparison.OrdinalIgnoreCase)
            ? InstallmentPlanType.Custom
            : InstallmentPlanType.Equal;
        contract.InstallmentCount = count;
        contract.InstallmentFrequency = ParseFrequency(frequency);

        _dbContext.Installments.RemoveRange(contract.Installments);
        contract.Installments.Clear();

        var dueDate = contract.StartDate;
        var perInstallment = count > 0 ? decimal.Round(contract.TotalContractAmount / count, 2) : 0;
        for (var i = 1; i <= count; i++)
        {
            dueDate = AddMonths(dueDate, MonthsForFrequency(contract.InstallmentFrequency));

            contract.Installments.Add(new Installment
            {
                ContractId = contract.Id,
                InstallmentNumber = i,
                AmountDue = perInstallment,
                DueDate = dueDate,
                Status = InstallmentStatus.Pending
            });
        }

        contract.Status = ContractStatus.Incomplete;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPatch("api/v1/installments/{id:guid}/status")]
    [HasPermission("contracts:update")]
    public async Task<IActionResult> UpdateInstallmentStatus(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var installment = await _dbContext.Installments.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (installment is null)
        {
            return NotFound();
        }

        if (payload.TryGetProperty("status", out var statusValue))
        {
            installment.Status = ParseInstallmentStatus(statusValue.GetString());
            if (installment.Status == InstallmentStatus.Paid)
            {
                installment.PaymentDate ??= DateOnly.FromDateTime(DateTime.UtcNow);
            }
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return Ok(new { success = true });
    }

    private static InstallmentFrequency ParseFrequency(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "quarterly" => InstallmentFrequency.Quarterly,
            "semi_annual" => InstallmentFrequency.SemiAnnual,
            "annual" => InstallmentFrequency.Annual,
            _ => InstallmentFrequency.Monthly
        };
    }

    private static int MonthsForFrequency(InstallmentFrequency? frequency)
    {
        return frequency switch
        {
            InstallmentFrequency.Quarterly => 3,
            InstallmentFrequency.SemiAnnual => 6,
            InstallmentFrequency.Annual => 12,
            _ => 1
        };
    }

    private static DateOnly AddMonths(DateOnly date, int months)
    {
        var dt = date.ToDateTime(TimeOnly.MinValue);
        return DateOnly.FromDateTime(dt.AddMonths(months));
    }

    private static CancellationReason? ParseCancellationReason(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "investor_default" => CancellationReason.InvestorDefault,
            "asset_issues" => CancellationReason.AssetIssues,
            "mutual_agreement" => CancellationReason.MutualAgreement,
            "legal_regulatory" => CancellationReason.LegalRegulatory,
            "force_majeure" => CancellationReason.ForceMajeure,
            "other" => CancellationReason.Other,
            _ => null
        };
    }

    private static InstallmentStatus ParseInstallmentStatus(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "overdue" => InstallmentStatus.Overdue,
            "partial" => InstallmentStatus.Partial,
            "paid" => InstallmentStatus.Paid,
            _ => InstallmentStatus.Pending
        };
    }
}
