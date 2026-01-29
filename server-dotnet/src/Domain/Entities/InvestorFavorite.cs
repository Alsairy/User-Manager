using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class InvestorFavorite : EntityBase
{
    public string InvestorAccountId { get; set; } = string.Empty;
    public Guid AssetId { get; set; }
    public Asset? Asset { get; set; }
}
