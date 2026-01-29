using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Events;

namespace UserManager.Application.EventHandlers;

public class AssetApprovedEventHandler : INotificationHandler<AssetApprovedEvent>
{
    private readonly IAppDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AssetApprovedEventHandler> _logger;

    public AssetApprovedEventHandler(
        IAppDbContext dbContext,
        INotificationService notificationService,
        ILogger<AssetApprovedEventHandler> logger)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Handle(AssetApprovedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling AssetApprovedEvent for {AssetCode}", notification.AssetCode);

        await _notificationService.NotifyRoleAsync(
            "Admin",
            "success",
            "Asset Approved",
            $"Asset {notification.AssetCode} has been approved.",
            cancellationToken);
    }
}
