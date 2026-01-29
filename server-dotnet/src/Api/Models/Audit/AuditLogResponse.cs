namespace UserManager.Api.Models.Audit;

public record AuditLogResponse(
    Guid Id,
    Guid? UserId,
    string ActionType,
    string EntityType,
    string? EntityId,
    string? ChangesJson,
    string? IpAddress,
    string? SessionId,
    DateTimeOffset CreatedAt);
