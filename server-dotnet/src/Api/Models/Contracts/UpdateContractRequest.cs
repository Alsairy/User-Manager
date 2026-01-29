namespace UserManager.Api.Models.Contracts;

public record UpdateContractRequest(
    string? Title,
    decimal? Amount,
    string? Status);
