using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Events;

namespace UserManager.Application.EventHandlers;

public class ContractActivatedEventHandler : INotificationHandler<ContractActivatedEvent>
{
    private readonly IAppDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<ContractActivatedEventHandler> _logger;

    public ContractActivatedEventHandler(
        IAppDbContext dbContext,
        INotificationService notificationService,
        IEmailService emailService,
        ILogger<ContractActivatedEventHandler> logger)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Handle(ContractActivatedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling ContractActivatedEvent for {ContractCode}", notification.ContractCode);

        var contract = await _dbContext.Contracts
            .FirstOrDefaultAsync(c => c.Id == notification.ContractId, cancellationToken);

        if (contract == null) return;

        var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == contract.InvestorId, cancellationToken);
        if (investor?.Email != null)
        {
            await _emailService.SendTemplatedAsync(
                investor.Email,
                "ContractCreated",
                new { contract.ContractCode },
                cancellationToken);
        }

        await _notificationService.NotifyRoleAsync(
            "Admin",
            "info",
            "Contract Activated",
            $"Contract {notification.ContractCode} is now active.",
            cancellationToken);
    }
}
