namespace UserManager.Api.Models.Assets;

public record UpdateAssetRequest(
    string? Name,
    string? Description,
    string? Status);
