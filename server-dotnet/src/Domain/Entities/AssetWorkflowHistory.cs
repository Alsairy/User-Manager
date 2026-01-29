using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class AssetWorkflowHistory : EntityBase
{
    public Guid AssetId { get; set; }
    public string Stage { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? ReviewerId { get; set; }
    public string? ReviewerDepartment { get; set; }
    public string? Comments { get; set; }
    public string? RejectionReason { get; set; }
    public string? RejectionJustification { get; set; }
    public List<string> DocumentsAdded { get; set; } = new();
    public DateTime ActionDate { get; set; } = DateTime.UtcNow;
}
