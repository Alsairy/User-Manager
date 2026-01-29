using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class Notification : EntityBase
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = "info"; // info, warning, success, error
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? ActionUrl { get; set; }
    public string? RelatedEntityType { get; set; }
    public Guid? RelatedEntityId { get; set; }
}
