using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;

namespace UserManager.Workflows.Activities;

public class MarkInstallmentOverdueActivity : CodeActivity<int>
{
    public Input<Guid?> ContractId { get; set; } = default!;

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        var contractId = ContractId.Get(context);

        var dbContext = context.GetRequiredService<IAppDbContext>();
        var notificationService = context.GetRequiredService<INotificationService>();
        var emailService = context.GetRequiredService<IEmailService>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var query = dbContext.Installments
            .Include(i => i.Contract)
            .Where(i => i.Status == InstallmentStatus.Pending && i.DueDate < today);

        if (contractId.HasValue)
        {
            query = query.Where(i => i.ContractId == contractId.Value);
        }

        var overdueInstallments = await query.ToListAsync();

        foreach (var installment in overdueInstallments)
        {
            installment.Status = InstallmentStatus.Overdue;
            installment.UpdatedAt = DateTimeOffset.UtcNow;

            // Send email to investor
            if (installment.Contract != null)
            {
                var investor = await dbContext.Investors.FirstOrDefaultAsync(i => i.Id == installment.Contract.InvestorId);
                if (investor != null && !string.IsNullOrEmpty(investor.Email))
                {
                    var title = "Installment Payment Overdue";
                    var message = $"Installment #{installment.InstallmentNumber} for contract '{installment.Contract.ContractCode}' " +
                                 $"(Amount: {installment.AmountDue:C}) is overdue. Due date was {installment.DueDate:d}.";

                    try
                    {
                        await emailService.SendAsync(
                            investor.Email,
                            title,
                            $@"<h2>Payment Reminder</h2>
                            <p>{message}</p>
                            <p>Please make your payment as soon as possible to avoid additional charges.</p>
                            <p>Best regards,<br/>Madares Business Platform</p>",
                            CancellationToken.None);
                    }
                    catch
                    {
                        // Log but continue
                    }
                }
            }

            // Also notify Admin
            await notificationService.NotifyRoleAsync(
                "Admin",
                "warning",
                "Installment Overdue",
                $"Contract {installment.Contract?.ContractCode}: Installment #{installment.InstallmentNumber} is overdue.",
                CancellationToken.None);
        }

        await dbContext.SaveChangesAsync(CancellationToken.None);
        context.SetResult(overdueInstallments.Count);
    }
}
