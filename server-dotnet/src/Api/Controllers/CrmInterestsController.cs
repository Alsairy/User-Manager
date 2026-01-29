using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/crm/interests")]
[Authorize]
public class CrmInterestsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public CrmInterestsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("investors:read")]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int limit = 25,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var query = _dbContext.InvestorInterests
            .Include(i => i.Asset)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var statusFilter = ParseInterestStatus(status);
            query = query.Where(i => i.Status == statusFilter);
        }

        var total = await query.CountAsync(cancellationToken);
        var interests = await query
            .OrderByDescending(i => i.SubmittedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var result = interests.Select(i => new
        {
            id = i.Id,
            referenceNumber = i.ReferenceNumber,
            investorAccountId = i.InvestorAccountId,
            assetId = i.AssetId,
            investmentPurpose = MapInvestmentPurpose(i.InvestmentPurpose),
            proposedUseDescription = i.ProposedUseDescription,
            investmentAmountRange = MapAmountRange(i.InvestmentAmountRange),
            expectedTimeline = MapTimeline(i.ExpectedTimeline),
            additionalComments = i.AdditionalComments,
            attachments = i.Attachments,
            status = MapInterestStatus(i.Status),
            assignedToId = i.AssignedToId,
            reviewNotes = i.ReviewNotes,
            rejectionReason = i.RejectionReason,
            convertedContractId = i.ConvertedContractId,
            submittedAt = i.SubmittedAt,
            reviewedAt = i.ReviewedAt,
            reviewedBy = i.ReviewedBy,
            createdAt = i.CreatedAt,
            updatedAt = i.UpdatedAt,
            investorAccount = (object?)null,
            asset = i.Asset is null ? null : new
            {
                id = i.Asset.Id,
                assetNameEn = i.Asset.Name,
                assetNameAr = i.Asset.NameAr,
                assetType = i.Asset.AssetType
            }
        });

        return Ok(new { interests = result, total, page, limit });
    }

    [HttpPost("{id:guid}/review")]
    [HasPermission("investors:update")]
    public async Task<IActionResult> Review(Guid id, [FromBody] ReviewInterestRequest request, CancellationToken cancellationToken = default)
    {
        var interest = await _dbContext.InvestorInterests.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        if (interest is null)
        {
            return NotFound();
        }

        if (string.Equals(request.Action, "approve", StringComparison.OrdinalIgnoreCase))
        {
            interest.Status = InterestStatus.Approved;
        }
        else if (string.Equals(request.Action, "reject", StringComparison.OrdinalIgnoreCase))
        {
            interest.Status = InterestStatus.Rejected;
        }

        interest.ReviewNotes = request.ReviewNotes?.Trim();
        interest.RejectionReason = request.RejectionReason?.Trim();
        interest.ReviewedBy = request.ReviewerId;
        interest.ReviewedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    public sealed class ReviewInterestRequest
    {
        public string Action { get; init; } = "approve";
        public string? ReviewNotes { get; init; }
        public string? RejectionReason { get; init; }
        public string? ReviewerId { get; init; }
    }

    private static string MapInvestmentPurpose(InvestmentPurpose purpose)
    {
        return purpose switch
        {
            InvestmentPurpose.CommercialDevelopment => "commercial_development",
            InvestmentPurpose.ResidentialProject => "residential_project",
            InvestmentPurpose.MixedUse => "mixed_use",
            InvestmentPurpose.EducationalFacility => "educational_facility",
            InvestmentPurpose.HealthcareFacility => "healthcare_facility",
            InvestmentPurpose.RetailCenter => "retail_center",
            InvestmentPurpose.IndustrialWarehouse => "industrial_warehouse",
            _ => "other"
        };
    }

    private static string MapAmountRange(InvestmentAmountRange range)
    {
        return range switch
        {
            InvestmentAmountRange.Under1m => "under_1m",
            InvestmentAmountRange.OneTo5m => "1m_5m",
            InvestmentAmountRange.FiveTo10m => "5m_10m",
            InvestmentAmountRange.TenTo50m => "10m_50m",
            InvestmentAmountRange.FiftyTo100m => "50m_100m",
            InvestmentAmountRange.Over100m => "over_100m",
            _ => "under_1m"
        };
    }

    private static string MapTimeline(InvestmentTimeline timeline)
    {
        return timeline switch
        {
            InvestmentTimeline.Immediate => "immediate",
            InvestmentTimeline.ShortTerm => "short_term",
            InvestmentTimeline.MidTerm => "mid_term",
            InvestmentTimeline.LongTerm => "long_term",
            InvestmentTimeline.Over2Years => "over_2_years",
            _ => "immediate"
        };
    }

    private static string MapInterestStatus(InterestStatus status)
    {
        return status switch
        {
            InterestStatus.New => "new",
            InterestStatus.UnderReview => "under_review",
            InterestStatus.Approved => "approved",
            InterestStatus.Rejected => "rejected",
            InterestStatus.Converted => "converted",
            _ => "new"
        };
    }

    private static InterestStatus ParseInterestStatus(string value)
    {
        return value.ToLowerInvariant() switch
        {
            "under_review" => InterestStatus.UnderReview,
            "approved" => InterestStatus.Approved,
            "rejected" => InterestStatus.Rejected,
            "converted" => InterestStatus.Converted,
            _ => InterestStatus.New
        };
    }
}
