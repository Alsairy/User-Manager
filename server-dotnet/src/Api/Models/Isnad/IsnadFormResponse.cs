namespace UserManager.Api.Models.Isnad;

public record IsnadFormResponse(
    Guid Id,
    string Title,
    string ReferenceNumber,
    string? Notes,
    string Status);
