namespace UserManager.Application.Interfaces;

public interface INotificationService
{
    Task NotifyUserAsync(Guid userId, string type, string title, string message, CancellationToken ct = default);
    Task NotifyUserAsync(Guid userId, string type, string title, string message, string? actionUrl, string? entityType, Guid? entityId, CancellationToken ct = default);
    Task NotifyRoleAsync(string roleName, string type, string title, string message, CancellationToken ct = default);
}
