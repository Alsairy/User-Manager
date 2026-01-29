using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class AssetVisibilityHistory : EntityBase
{
    public Guid AssetId { get; set; }
    public string VisibilityStatus { get; set; } = "visible";
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public int? DurationDays { get; set; }
    public string? ChangedBy { get; set; }
    public string? Reason { get; set; }
}
