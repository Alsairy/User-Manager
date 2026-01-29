using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Events;

namespace UserManager.Application.EventHandlers;

public class InstallmentOverdueEventHandler : INotificationHandler<InstallmentOverdueEvent>
{
    private readonly IAppDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<InstallmentOverdueEventHandler> _logger;

    public InstallmentOverdueEventHandler(
        IAppDbContext dbContext,
        IEmailService emailService,
        INotificationService notificationService,
        ILogger<InstallmentOverdueEventHandler> logger)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(InstallmentOverdueEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling InstallmentOverdueEvent for installment {Id}", notification.InstallmentId);

        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == notification.ContractId, cancellationToken);
        if (contract == null) return;

        var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == contract.InvestorId, cancellationToken);
        if (investor?.Email != null)
        {
            await _emailService.SendTemplatedAsync(
                investor.Email,
                "InstallmentOverdue",
                new { notification.InstallmentNumber, contract.ContractCode, notification.Amount },
                cancellationToken);
        }

        await _notificationService.NotifyRoleAsync(
            "ContractManager",
            "warning",
            "Installment Overdue",
            $"Installment #{notification.InstallmentNumber} for contract {contract.ContractCode} is overdue.",
            cancellationToken);
    }
}
