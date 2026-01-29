namespace UserManager.Api.Models.Assets;

public record CreateAssetRequest(
    string Name,
    string Code,
    string? Description);
