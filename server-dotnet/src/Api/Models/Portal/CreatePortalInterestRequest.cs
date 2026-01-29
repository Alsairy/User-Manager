namespace UserManager.Api.Models.Portal;

public record CreatePortalInterestRequest(
    Guid AssetId,
    string InvestorName,
    string? Notes);
