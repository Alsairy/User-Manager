using UserManager.Domain.Common;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Entities;

public class IstifadaRequest : EntityBase
{
    public string ReferenceNumber { get; set; } = string.Empty;
    public string InvestorAccountId { get; set; } = string.Empty;
    public Guid? AssetId { get; set; }
    public Asset? Asset { get; set; }
    public IstifadaProgramType ProgramType { get; set; } = IstifadaProgramType.Other;
    public string ProgramTitle { get; set; } = string.Empty;
    public string ProgramDescription { get; set; } = string.Empty;
    public string? TargetBeneficiaries { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? BudgetEstimate { get; set; }
    public List<string> ProposalDocuments { get; set; } = new();
    public List<string> FinancialPlanDocuments { get; set; } = new();
    public List<string> OrganizationCredentials { get; set; } = new();
    public List<string> AdditionalDocuments { get; set; } = new();
    public IstifadaStatus Status { get; set; } = IstifadaStatus.New;
    public string? AssignedToId { get; set; }
    public string? ReviewNotes { get; set; }
    public string? RejectionReason { get; set; }
    public string? AdditionalInfoRequest { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
}
