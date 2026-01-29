namespace UserManager.Api.Models.Contracts;

public record InstallmentResponse(
    Guid Id,
    Guid ContractId,
    decimal Amount,
    DateTimeOffset DueDate,
    bool Paid);
