using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Events;

namespace UserManager.Application.EventHandlers;

public class IsnadStageAdvancedEventHandler : INotificationHandler<IsnadStageAdvancedEvent>
{
    private readonly IAppDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly ILogger<IsnadStageAdvancedEventHandler> _logger;

    public IsnadStageAdvancedEventHandler(
        IAppDbContext dbContext,
        INotificationService notificationService,
        ILogger<IsnadStageAdvancedEventHandler> logger)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(IsnadStageAdvancedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling IsnadStageAdvancedEvent for {ReferenceNumber}", notification.ReferenceNumber);

        var targetRole = notification.NewStage switch
        {
            "pending_verification" or "verification_due" => "Reviewer",
            "investment_agency" => "AssetManager",
            "pending_ceo" or "pending_minister" => "Admin",
            _ => "Reviewer"
        };

        await _notificationService.NotifyRoleAsync(
            targetRole,
            "info",
            "ISNAD Stage Advanced",
            $"ISNAD form {notification.ReferenceNumber} has moved to stage: {notification.NewStage}",
            cancellationToken);
    }
}
