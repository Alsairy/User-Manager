namespace UserManager.Api.Models.Contracts;

public record ContractResponse(
    Guid Id,
    string ReferenceNumber,
    string Title,
    decimal Amount,
    string Status);
