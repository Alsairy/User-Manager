using UserManager.Domain.Enums;
using UserManager.Domain.Common;

namespace UserManager.Domain.Entities;

public class Installment : EntityBase
{
    public Guid ContractId { get; set; }
    public Contract Contract { get; set; } = null!;

    public int InstallmentNumber { get; set; }
    public decimal AmountDue { get; set; }
    public DateOnly DueDate { get; set; }
    public InstallmentStatus Status { get; set; } = InstallmentStatus.Pending;
    public DateOnly? PaymentDate { get; set; }
    public decimal? PartialAmountPaid { get; set; }
    public decimal? RemainingBalance { get; set; }
    public string? ReceiptFileUrl { get; set; }
    public string? ReceiptFileName { get; set; }
    public DateTime? ReceiptUploadedAt { get; set; }
    public string? ReceiptUploadedBy { get; set; }
    public string? Notes { get; set; }
    public string? Description { get; set; }
    public string? UpdatedBy { get; set; }
}
