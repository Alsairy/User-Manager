using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Workflows.Activities;

public class UpdateContractStatusActivity : CodeActivity<bool>
{
    public Input<Guid> ContractId { get; set; } = default!;
    public Input<ContractStatus> NewStatus { get; set; } = default!;
    public Input<string?> Reason { get; set; } = default!;
    public Input<bool> GenerateInstallments { get; set; } = default!;

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        var contractId = ContractId.Get(context);
        var newStatus = NewStatus.Get(context);
        var reason = Reason.Get(context);
        var generateInstallments = GenerateInstallments.Get(context);

        var dbContext = context.GetRequiredService<IAppDbContext>();
        var notificationService = context.GetRequiredService<INotificationService>();

        var contract = await dbContext.Contracts
            .Include(c => c.Installments)
            .FirstOrDefaultAsync(c => c.Id == contractId);

        if (contract == null)
        {
            context.SetResult(false);
            return;
        }

        var previousStatus = contract.Status;
        contract.Status = newStatus;
        contract.UpdatedAt = DateTimeOffset.UtcNow;

        // Handle activation
        if (newStatus == ContractStatus.Active && generateInstallments)
        {
            // Generate installments if not already present
            if (!contract.Installments.Any())
            {
                var installments = GenerateInstallmentPlan(contract);
                foreach (var installment in installments)
                {
                    dbContext.Installments.Add(installment);
                }
            }
        }
        else if (newStatus == ContractStatus.Cancelled || newStatus == ContractStatus.Archived)
        {
            if (!string.IsNullOrEmpty(reason))
            {
                contract.CancellationJustification = reason;
            }
            contract.CancelledAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(CancellationToken.None);

        // Send notifications
        var title = newStatus switch
        {
            ContractStatus.Active => "Contract Activated",
            ContractStatus.Expiring => "Contract Expiring Soon",
            ContractStatus.Expired => "Contract Expired",
            ContractStatus.Cancelled => "Contract Cancelled",
            ContractStatus.Completed => "Contract Completed",
            _ => $"Contract Status: {newStatus}"
        };

        var message = newStatus switch
        {
            ContractStatus.Active => $"Contract '{contract.ContractCode}' is now active. Installment payments will begin according to schedule.",
            ContractStatus.Expiring => $"Contract '{contract.ContractCode}' will expire in 30 days. Please review for renewal.",
            ContractStatus.Expired => $"Contract '{contract.ContractCode}' has expired.",
            ContractStatus.Cancelled => $"Contract '{contract.ContractCode}' has been cancelled. Reason: {reason}",
            ContractStatus.Completed => $"Contract '{contract.ContractCode}' has been completed successfully.",
            _ => $"Contract '{contract.ContractCode}' status changed to {newStatus}."
        };

        // Note: Investors don't have user accounts in this system
        // They are external entities that receive email notifications only

        // Always notify Admin role
        await notificationService.NotifyRoleAsync(
            "Admin",
            "info",
            title,
            message,
            CancellationToken.None);

        context.SetResult(true);
    }

    private static List<Installment> GenerateInstallmentPlan(Contract contract)
    {
        var installments = new List<Installment>();

        if (contract.TotalContractAmount <= 0 || !contract.InstallmentCount.HasValue || contract.InstallmentCount.Value <= 0)
            return installments;

        var installmentAmount = contract.TotalContractAmount / contract.InstallmentCount.Value;
        var startDate = contract.StartDate;

        for (int i = 0; i < contract.InstallmentCount.Value; i++)
        {
            var dueDate = contract.InstallmentFrequency switch
            {
                InstallmentFrequency.Monthly => startDate.AddMonths(i + 1),
                InstallmentFrequency.Quarterly => startDate.AddMonths((i + 1) * 3),
                InstallmentFrequency.Annual => startDate.AddYears(i + 1),
                InstallmentFrequency.SemiAnnual => startDate.AddMonths((i + 1) * 6),
                _ => startDate.AddMonths(i + 1) // default to monthly
            };

            installments.Add(new Installment
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                InstallmentNumber = i + 1,
                AmountDue = installmentAmount,
                DueDate = dueDate,
                Status = InstallmentStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        return installments;
    }
}
