using UserManager.Domain.Common;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Entities;

public class Investor : EntityBase
{
    public string InvestorCode { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? CompanyRegistration { get; set; }
    public string? TaxId { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string Country { get; set; } = "Saudi Arabia";
    public InvestorStatus Status { get; set; } = InvestorStatus.New;
    public string? Notes { get; set; }
}
