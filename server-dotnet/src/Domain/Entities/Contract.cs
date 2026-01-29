using UserManager.Domain.Common;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Entities;

public class Contract : EntityBase
{
    public string ContractCode { get; set; } = string.Empty;
    public string LandCode { get; set; } = string.Empty;
    public Guid AssetId { get; set; }
    public Guid InvestorId { get; set; }
    public string AssetNameAr { get; set; } = string.Empty;
    public string AssetNameEn { get; set; } = string.Empty;
    public string InvestorNameAr { get; set; } = string.Empty;
    public string InvestorNameEn { get; set; } = string.Empty;
    public decimal AnnualRentalAmount { get; set; }
    public int VatRate { get; set; }
    public decimal TotalAnnualAmount { get; set; }
    public int ContractDuration { get; set; }
    public decimal TotalContractAmount { get; set; }
    public string Currency { get; set; } = "SAR";
    public DateOnly SigningDate { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public InstallmentPlanType? InstallmentPlanType { get; set; }
    public int? InstallmentCount { get; set; }
    public InstallmentFrequency? InstallmentFrequency { get; set; }
    public string? SignedPdfUrl { get; set; }
    public DateTime? SignedPdfUploadedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelledBy { get; set; }
    public CancellationReason? CancellationReason { get; set; }
    public string? CancellationJustification { get; set; }
    public List<string> CancellationDocuments { get; set; } = new();
    public string? Notes { get; set; }
    public string? SpecialConditions { get; set; }
    public string? LegalTermsReference { get; set; }
    public string? ApprovalAuthority { get; set; }
    public string CreatedBy { get; set; } = "system";
    public string? UpdatedBy { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public string? ArchivedBy { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Draft;
    public ICollection<Installment> Installments { get; set; } = new List<Installment>();
}
