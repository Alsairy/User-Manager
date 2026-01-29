namespace UserManager.Api.Models.Assets;

public record AssetResponse(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    string Status);
