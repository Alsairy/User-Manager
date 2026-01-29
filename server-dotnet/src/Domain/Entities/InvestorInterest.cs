using UserManager.Domain.Common;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Entities;

public class InvestorInterest : EntityBase
{
    public string ReferenceNumber { get; set; } = string.Empty;
    public string InvestorAccountId { get; set; } = string.Empty;
    public Guid AssetId { get; set; }
    public Asset? Asset { get; set; }
    public InvestmentPurpose InvestmentPurpose { get; set; } = InvestmentPurpose.Other;
    public string ProposedUseDescription { get; set; } = string.Empty;
    public InvestmentAmountRange InvestmentAmountRange { get; set; } = InvestmentAmountRange.Under1m;
    public InvestmentTimeline ExpectedTimeline { get; set; } = InvestmentTimeline.Immediate;
    public string? AdditionalComments { get; set; }
    public List<string> Attachments { get; set; } = new();
    public InterestStatus Status { get; set; } = InterestStatus.New;
    public string? AssignedToId { get; set; }
    public string? ReviewNotes { get; set; }
    public string? RejectionReason { get; set; }
    public Guid? ConvertedContractId { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
}
