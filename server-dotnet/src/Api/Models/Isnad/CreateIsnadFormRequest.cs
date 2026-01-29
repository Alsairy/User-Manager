namespace UserManager.Api.Models.Isnad;

public record CreateIsnadFormRequest(
    string Title,
    string ReferenceNumber,
    string? Notes,
    Guid? AssetId);
