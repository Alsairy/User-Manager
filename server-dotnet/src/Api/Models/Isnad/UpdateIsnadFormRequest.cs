namespace UserManager.Api.Models.Isnad;

public record UpdateIsnadFormRequest(
    string? Title,
    string? Notes,
    string? Status,
    Guid? AssetId);
