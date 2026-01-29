using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/contracts")]
[Authorize]
public class ContractsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public ContractsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("contracts:read")]
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? investorId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var query = _dbContext.Contracts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c => c.ContractCode.Contains(search) || c.LandCode.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var statusFilter = ParseContractStatus(status);
            query = query.Where(c => c.Status == statusFilter);
        }

        if (!string.IsNullOrWhiteSpace(investorId))
        {
            query = query.Where(c => c.InvestorId.ToString() == investorId);
        }

        var total = await query.CountAsync(cancellationToken);
        var contracts = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var statusCounts = await _dbContext.Contracts
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var statusMap = statusCounts.ToDictionary(
            s => MapContractStatus(s.Status),
            s => s.Count,
            StringComparer.OrdinalIgnoreCase);

        return Ok(new
        {
            contracts = contracts.Select(MapContract),
            total,
            statusCounts = statusMap,
            page,
            limit
        });
    }

    [HttpGet("{id:guid}")]
    [HasPermission("contracts:read")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        var investor = await _dbContext.Investors.FirstOrDefaultAsync(i => i.Id == contract.InvestorId, cancellationToken);
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == contract.AssetId, cancellationToken);

        return Ok(new
        {
            contract.Id,
            contract.ContractCode,
            contract.LandCode,
            contract.AssetId,
            contract.InvestorId,
            contract.AssetNameAr,
            contract.AssetNameEn,
            contract.InvestorNameAr,
            contract.InvestorNameEn,
            contract.AnnualRentalAmount,
            contract.VatRate,
            contract.TotalAnnualAmount,
            contract.ContractDuration,
            contract.TotalContractAmount,
            contract.Currency,
            signingDate = contract.SigningDate.ToString("yyyy-MM-dd"),
            startDate = contract.StartDate.ToString("yyyy-MM-dd"),
            endDate = contract.EndDate.ToString("yyyy-MM-dd"),
            status = MapContractStatus(contract.Status),
            installmentPlanType = MapPlanType(contract.InstallmentPlanType),
            installmentCount = contract.InstallmentCount,
            installmentFrequency = MapPlanFrequency(contract.InstallmentFrequency),
            signedPdfUrl = contract.SignedPdfUrl,
            contract.SignedPdfUploadedAt,
            contract.CancelledAt,
            contract.CancelledBy,
            cancellationReason = MapCancellationReason(contract.CancellationReason),
            contract.CancellationJustification,
            cancellationDocuments = contract.CancellationDocuments,
            contract.Notes,
            contract.SpecialConditions,
            contract.LegalTermsReference,
            contract.ApprovalAuthority,
            contract.CreatedBy,
            contract.CreatedAt,
            contract.UpdatedBy,
            contract.UpdatedAt,
            contract.ArchivedAt,
            contract.ArchivedBy,
            asset = asset is null ? null : new
            {
                id = asset.Id,
                assetCode = asset.Code,
                assetNameAr = asset.NameAr,
                assetNameEn = asset.Name,
                assetType = asset.AssetType
            },
            investor = investor is null ? null : new
            {
                id = investor.Id,
                investorCode = investor.InvestorCode,
                nameAr = investor.NameAr,
                nameEn = investor.NameEn,
                email = investor.Email,
                phone = investor.Phone
            }
        });
    }

    [HttpPost]
    [HasPermission("contracts:create")]
    public async Task<IActionResult> Create([FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var assetId = TryGetGuid(payload, "assetId");
        var investorId = TryGetGuid(payload, "investorId");
        if (assetId is null || investorId is null)
        {
            return BadRequest(new { message = "assetId and investorId are required." });
        }

        var annualRentalAmount = TryGetDecimal(payload, "annualRentalAmount");
        var vatRate = TryGetInt(payload, "vatRate");
        var contractDuration = TryGetInt(payload, "contractDuration");
        var signingDate = ParseDate(payload, "signingDate");
        var startDate = ParseDate(payload, "startDate");
        var endDate = ParseDate(payload, "endDate");

        var totalAnnualAmount = annualRentalAmount * (1 + vatRate / 100m);
        var totalContractAmount = totalAnnualAmount * contractDuration;

        var contract = new Contract
        {
            ContractCode = $"CTR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..18],
            LandCode = TryGet(payload, "landCode") ?? "RYD-001",
            AssetId = assetId.Value,
            InvestorId = investorId.Value,
            AssetNameAr = TryGet(payload, "assetNameAr") ?? string.Empty,
            AssetNameEn = TryGet(payload, "assetNameEn") ?? string.Empty,
            InvestorNameAr = TryGet(payload, "investorNameAr") ?? string.Empty,
            InvestorNameEn = TryGet(payload, "investorNameEn") ?? string.Empty,
            AnnualRentalAmount = annualRentalAmount,
            VatRate = vatRate,
            TotalAnnualAmount = totalAnnualAmount,
            ContractDuration = contractDuration,
            TotalContractAmount = totalContractAmount,
            SigningDate = signingDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            StartDate = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddYears(contractDuration)),
            Notes = TryGet(payload, "notes"),
            SpecialConditions = TryGet(payload, "specialConditions"),
            ApprovalAuthority = TryGet(payload, "approvalAuthority"),
            Status = ContractStatus.Draft
        };

        await _dbContext.Contracts.AddAsync(contract, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = contract.Id }, new { id = contract.Id });
    }

    [HttpPut("{id:guid}")]
    [HasPermission("contracts:update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        if (payload.TryGetProperty("status", out var statusValue))
        {
            contract.Status = ParseContractStatus(statusValue.GetString());
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("contracts:delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        _dbContext.Contracts.Remove(contract);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("{contractId:guid}/installments")]
    [HasPermission("contracts:read")]
    public async Task<IActionResult> ListInstallments(Guid contractId, CancellationToken cancellationToken)
    {
        var installments = await _dbContext.Installments
            .Where(i => i.ContractId == contractId)
            .OrderBy(i => i.DueDate)
            .ToListAsync(cancellationToken);

        var result = installments.Select(i => new
        {
            i.Id,
            i.ContractId,
            i.InstallmentNumber,
            i.AmountDue,
            dueDate = i.DueDate.ToString("yyyy-MM-dd"),
            status = MapInstallmentStatus(i.Status),
            paymentDate = i.PaymentDate?.ToString("yyyy-MM-dd"),
            i.PartialAmountPaid,
            i.RemainingBalance,
            i.ReceiptFileUrl,
            i.ReceiptFileName,
            i.ReceiptUploadedAt,
            i.ReceiptUploadedBy,
            i.Notes,
            i.Description,
            i.CreatedAt,
            i.UpdatedAt,
            i.UpdatedBy
        });

        return Ok(result);
    }

    [HttpPost("{contractId:guid}/installments")]
    [HasPermission("contracts:create")]
    public async Task<IActionResult> CreateInstallment(Guid contractId, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var contract = await _dbContext.Contracts.FirstOrDefaultAsync(c => c.Id == contractId, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        var installment = new Installment
        {
            ContractId = contractId,
            InstallmentNumber = TryGetInt(payload, "installmentNumber"),
            AmountDue = TryGetDecimal(payload, "amountDue"),
            DueDate = ParseDate(payload, "dueDate") ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1)),
            Status = ParseInstallmentStatus(TryGet(payload, "status"))
        };

        await _dbContext.Installments.AddAsync(installment, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { id = installment.Id });
    }

    private static object MapContract(Contract contract)
    {
        return new
        {
            contract.Id,
            contract.ContractCode,
            contract.LandCode,
            contract.AssetId,
            contract.InvestorId,
            contract.AssetNameAr,
            contract.AssetNameEn,
            contract.InvestorNameAr,
            contract.InvestorNameEn,
            contract.AnnualRentalAmount,
            contract.VatRate,
            contract.TotalAnnualAmount,
            contract.ContractDuration,
            contract.TotalContractAmount,
            contract.Currency,
            signingDate = contract.SigningDate.ToString("yyyy-MM-dd"),
            startDate = contract.StartDate.ToString("yyyy-MM-dd"),
            endDate = contract.EndDate.ToString("yyyy-MM-dd"),
            status = MapContractStatus(contract.Status),
            installmentPlanType = MapPlanType(contract.InstallmentPlanType),
            installmentCount = contract.InstallmentCount,
            installmentFrequency = MapPlanFrequency(contract.InstallmentFrequency),
            signedPdfUrl = contract.SignedPdfUrl,
            contract.SignedPdfUploadedAt,
            contract.CancelledAt,
            contract.CancelledBy,
            cancellationReason = MapCancellationReason(contract.CancellationReason),
            contract.CancellationJustification,
            cancellationDocuments = contract.CancellationDocuments,
            contract.Notes,
            contract.SpecialConditions,
            contract.LegalTermsReference,
            contract.ApprovalAuthority,
            contract.CreatedBy,
            contract.CreatedAt,
            contract.UpdatedBy,
            contract.UpdatedAt,
            contract.ArchivedAt,
            contract.ArchivedBy
        };
    }

    private static string MapContractStatus(ContractStatus status)
    {
        return status switch
        {
            ContractStatus.Incomplete => "incomplete",
            ContractStatus.Active => "active",
            ContractStatus.Expiring => "expiring",
            ContractStatus.Expired => "expired",
            ContractStatus.Archived => "archived",
            ContractStatus.Cancelled => "cancelled",
            ContractStatus.Completed => "expired",
            _ => "draft"
        };
    }

    private static ContractStatus ParseContractStatus(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "incomplete" => ContractStatus.Incomplete,
            "active" => ContractStatus.Active,
            "expiring" => ContractStatus.Expiring,
            "expired" => ContractStatus.Expired,
            "archived" => ContractStatus.Archived,
            "cancelled" => ContractStatus.Cancelled,
            _ => ContractStatus.Draft
        };
    }

    private static string? MapPlanType(InstallmentPlanType? planType)
    {
        return planType switch
        {
            InstallmentPlanType.Custom => "custom",
            InstallmentPlanType.Equal => "equal",
            _ => null
        };
    }

    private static string? MapPlanFrequency(InstallmentFrequency? frequency)
    {
        return frequency switch
        {
            InstallmentFrequency.Quarterly => "quarterly",
            InstallmentFrequency.SemiAnnual => "semi_annual",
            InstallmentFrequency.Annual => "annual",
            InstallmentFrequency.Monthly => "monthly",
            _ => null
        };
    }

    private static string? MapCancellationReason(CancellationReason? reason)
    {
        return reason switch
        {
            CancellationReason.AssetIssues => "asset_issues",
            CancellationReason.InvestorDefault => "investor_default",
            CancellationReason.MutualAgreement => "mutual_agreement",
            CancellationReason.LegalRegulatory => "legal_regulatory",
            CancellationReason.ForceMajeure => "force_majeure",
            CancellationReason.Other => "other",
            _ => null
        };
    }

    private static string MapInstallmentStatus(InstallmentStatus status)
    {
        return status switch
        {
            InstallmentStatus.Overdue => "overdue",
            InstallmentStatus.Partial => "partial",
            InstallmentStatus.Paid => "paid",
            _ => "pending"
        };
    }

    private static InstallmentStatus ParseInstallmentStatus(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "overdue" => InstallmentStatus.Overdue,
            "partial" => InstallmentStatus.Partial,
            "paid" => InstallmentStatus.Paid,
            _ => InstallmentStatus.Pending
        };
    }

    private static string? TryGet(JsonElement payload, string property)
    {
        return payload.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static Guid? TryGetGuid(JsonElement payload, string property)
    {
        var value = TryGet(payload, property);
        return Guid.TryParse(value, out var id) ? id : null;
    }

    private static int TryGetInt(JsonElement payload, string property)
    {
        return payload.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.Number
            ? value.GetInt32()
            : 0;
    }

    private static decimal TryGetDecimal(JsonElement payload, string property)
    {
        return payload.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.Number
            ? value.GetDecimal()
            : 0;
    }

    private static DateOnly? ParseDate(JsonElement payload, string property)
    {
        if (!payload.TryGetProperty(property, out var value) || value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return DateOnly.TryParse(value.GetString(), out var date) ? date : null;
    }
}
