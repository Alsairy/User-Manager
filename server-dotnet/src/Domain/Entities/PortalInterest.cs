using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class PortalInterest : EntityBase
{
    public Guid AssetId { get; set; }
    public string InvestorName { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
