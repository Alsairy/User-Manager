namespace UserManager.Api.Models.Contracts;

public record CreateContractRequest(
    string ReferenceNumber,
    string Title,
    decimal Amount);
