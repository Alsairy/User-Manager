using UserManager.Domain.Common;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Entities;

public class IsnadForm : EntityBase
{
    public string Title { get; set; } = string.Empty;
    public string ReferenceNumber { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public Guid? AssetId { get; set; }
    public Asset? Asset { get; set; }
    public IsnadStatus Status { get; set; } = IsnadStatus.Draft;
    public string CurrentStage { get; set; } = "school_planning";
    public int CurrentStepIndex { get; set; }
    public string? CurrentAssigneeId { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ReturnCount { get; set; }
    public string? ReturnedByStage { get; set; }
    public string? ReturnReason { get; set; }
    public DateTime? SlaDeadline { get; set; }
    public string? SlaStatus { get; set; }
    public Guid? PackageId { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelledBy { get; set; }
    public string CreatedBy { get; set; } = "system";
    public List<string> Attachments { get; set; } = new();
}
