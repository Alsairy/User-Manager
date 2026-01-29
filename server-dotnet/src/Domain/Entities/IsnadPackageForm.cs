using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class IsnadPackageForm : EntityBase
{
    public Guid PackageId { get; set; }
    public IsnadPackage? Package { get; set; }
    public Guid FormId { get; set; }
    public IsnadForm? Form { get; set; }
    public Guid? AssetId { get; set; }
    public Asset? Asset { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
