namespace UserManager.Api.Models.Crm;

public record UpdateInvestorRequest(
    string? Name,
    string? Email,
    string? Status);
