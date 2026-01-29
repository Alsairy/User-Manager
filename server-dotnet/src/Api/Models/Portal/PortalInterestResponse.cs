namespace UserManager.Api.Models.Portal;

public record PortalInterestResponse(
    Guid Id,
    Guid AssetId,
    string InvestorName,
    string? Notes);
