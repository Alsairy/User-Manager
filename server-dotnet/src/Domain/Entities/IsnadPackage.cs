using UserManager.Domain.Common;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Entities;

public class IsnadPackage : EntityBase
{
    public string PackageCode { get; set; } = string.Empty;
    public string PackageName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? InvestmentStrategy { get; set; }
    public PackagePriority Priority { get; set; } = PackagePriority.Medium;
    public int? DurationYears { get; set; }
    public int? DurationMonths { get; set; }
    public PackageStatus Status { get; set; } = PackageStatus.Draft;
    public decimal ExpectedRevenue { get; set; }
    public decimal TotalValuation { get; set; }
    public int TotalAssets { get; set; }
    public DateTime? CeoApprovedAt { get; set; }
    public string? CeoComments { get; set; }
    public DateTime? MinisterApprovedAt { get; set; }
    public string? MinisterComments { get; set; }
    public string? RejectionReason { get; set; }
    public string? PackageDocumentUrl { get; set; }
    public string CreatedBy { get; set; } = "system";
    public DateTime? CompletedAt { get; set; }
    public ICollection<IsnadPackageForm> Forms { get; set; } = new List<IsnadPackageForm>();
}
