namespace UserManager.Api.Models.Crm;

public record InvestorResponse(
    Guid Id,
    string Name,
    string Email,
    string Status);
