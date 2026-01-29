namespace UserManager.Api.Models.Contracts;

public record CreateInstallmentRequest(
    decimal Amount,
    DateTimeOffset DueDate);
