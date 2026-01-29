using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;

namespace UserManager.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IAppDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IAppDbContext dbContext, IEmailService emailService, ILogger<NotificationService> logger)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task NotifyUserAsync(Guid userId, string type, string title, string message, CancellationToken ct = default)
    {
        await NotifyUserAsync(userId, type, title, message, null, null, null, ct);
    }

    public async Task NotifyUserAsync(Guid userId, string type, string title, string message, string? actionUrl, string? entityType, Guid? entityId, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            ActionUrl = actionUrl,
            RelatedEntityType = entityType,
            RelatedEntityId = entityId,
            IsRead = false
        };

        await _dbContext.Notifications.AddAsync(notification, ct);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("Created notification for user {UserId}: {Title}", userId, title);

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user != null)
        {
            try
            {
                await _emailService.SendAsync(user.Email, title, $"<p>{message}</p>", ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email notification to {Email}", user.Email);
            }
        }
    }

    public async Task NotifyRoleAsync(string roleName, string type, string title, string message, CancellationToken ct = default)
    {
        var userIds = await _dbContext.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.Role.Name == roleName)
            .Select(ur => ur.UserId)
            .ToListAsync(ct);

        foreach (var userId in userIds)
        {
            await NotifyUserAsync(userId, type, title, message, ct);
        }

        _logger.LogInformation("Notified {Count} users in role {Role}: {Title}", userIds.Count, roleName, title);
    }
}
