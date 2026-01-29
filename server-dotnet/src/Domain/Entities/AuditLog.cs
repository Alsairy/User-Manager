using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class AuditLog : EntityBase
{
    public Guid? UserId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? ChangesJson { get; set; }
    public string? IpAddress { get; set; }
    public string? SessionId { get; set; }
}
