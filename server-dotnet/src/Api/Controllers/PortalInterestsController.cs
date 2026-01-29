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
[Route("api/v1/portal/interests")]
[Authorize]
public class PortalInterestsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public PortalInterestsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("portal:read")]
    public async Task<IActionResult> List([FromQuery] string? investorAccountId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(investorAccountId))
        {
            return Ok(Array.Empty<object>());
        }

        var interests = await _dbContext.InvestorInterests
            .Include(i => i.Asset)
            .Where(i => i.InvestorAccountId == investorAccountId)
            .OrderByDescending(i => i.SubmittedAt)
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
            asset = i.Asset is null ? null : new
            {
                id = i.Asset.Id,
                assetNameEn = i.Asset.Name,
                assetNameAr = i.Asset.NameAr,
                assetType = i.Asset.AssetType,
                totalArea = i.Asset.TotalArea,
                city = (object?)null
            }
        });

        return Ok(result);
    }

    [HttpPost]
    [HasPermission("portal:create")]
    public async Task<IActionResult> Create([FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var investorAccountId = TryGet(payload, "investorAccountId");
        var assetId = TryGetGuid(payload, "assetId");

        if (string.IsNullOrWhiteSpace(investorAccountId) || assetId is null)
        {
            return BadRequest(new { message = "investorAccountId and assetId are required." });
        }

        var interest = new InvestorInterest
        {
            InvestorAccountId = investorAccountId,
            AssetId = assetId.Value,
            ReferenceNumber = $"INT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..18],
            InvestmentPurpose = ParsePurpose(TryGet(payload, "investmentPurpose")),
            ProposedUseDescription = TryGet(payload, "proposedUseDescription") ?? string.Empty,
            InvestmentAmountRange = ParseAmountRange(TryGet(payload, "investmentAmountRange")),
            ExpectedTimeline = ParseTimeline(TryGet(payload, "expectedTimeline")),
            AdditionalComments = TryGet(payload, "additionalComments"),
            Status = InterestStatus.New
        };

        await _dbContext.InvestorInterests.AddAsync(interest, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true, id = interest.Id });
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

    private static InvestmentPurpose ParsePurpose(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "commercial_development" => InvestmentPurpose.CommercialDevelopment,
            "residential_project" => InvestmentPurpose.ResidentialProject,
            "mixed_use" => InvestmentPurpose.MixedUse,
            "educational_facility" => InvestmentPurpose.EducationalFacility,
            "healthcare_facility" => InvestmentPurpose.HealthcareFacility,
            "retail_center" => InvestmentPurpose.RetailCenter,
            "industrial_warehouse" => InvestmentPurpose.IndustrialWarehouse,
            _ => InvestmentPurpose.Other
        };
    }

    private static InvestmentAmountRange ParseAmountRange(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "1m_5m" => InvestmentAmountRange.OneTo5m,
            "5m_10m" => InvestmentAmountRange.FiveTo10m,
            "10m_50m" => InvestmentAmountRange.TenTo50m,
            "50m_100m" => InvestmentAmountRange.FiftyTo100m,
            "over_100m" => InvestmentAmountRange.Over100m,
            _ => InvestmentAmountRange.Under1m
        };
    }

    private static InvestmentTimeline ParseTimeline(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "short_term" => InvestmentTimeline.ShortTerm,
            "mid_term" => InvestmentTimeline.MidTerm,
            "long_term" => InvestmentTimeline.LongTerm,
            "over_2_years" => InvestmentTimeline.Over2Years,
            _ => InvestmentTimeline.Immediate
        };
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
}
