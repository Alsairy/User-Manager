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
[Route("api/v1/portal/istifada")]
[Authorize]
public class PortalIstifadaController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public PortalIstifadaController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("portal:read")]
    public async Task<IActionResult> List([FromQuery] string? investorAccountId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(investorAccountId))
        {
            return Ok(Array.Empty<object>());
        }

        var requests = await _dbContext.IstifadaRequests
            .Include(r => r.Asset)
            .Where(r => r.InvestorAccountId == investorAccountId)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync(cancellationToken);

        var result = requests.Select(r => new
        {
            id = r.Id,
            referenceNumber = r.ReferenceNumber,
            investorAccountId = r.InvestorAccountId,
            assetId = r.AssetId,
            programType = MapProgramType(r.ProgramType),
            programTitle = r.ProgramTitle,
            programDescription = r.ProgramDescription,
            targetBeneficiaries = r.TargetBeneficiaries,
            startDate = r.StartDate.ToString("yyyy-MM-dd"),
            endDate = r.EndDate.ToString("yyyy-MM-dd"),
            budgetEstimate = r.BudgetEstimate,
            proposalDocuments = r.ProposalDocuments,
            financialPlanDocuments = r.FinancialPlanDocuments,
            organizationCredentials = r.OrganizationCredentials,
            additionalDocuments = r.AdditionalDocuments,
            status = MapIstifadaStatus(r.Status),
            assignedToId = r.AssignedToId,
            reviewNotes = r.ReviewNotes,
            rejectionReason = r.RejectionReason,
            additionalInfoRequest = r.AdditionalInfoRequest,
            submittedAt = r.SubmittedAt,
            reviewedAt = r.ReviewedAt,
            reviewedBy = r.ReviewedBy,
            createdAt = r.CreatedAt,
            updatedAt = r.UpdatedAt,
            asset = r.Asset is null ? null : new
            {
                id = r.Asset.Id,
                assetNameEn = r.Asset.Name,
                assetNameAr = r.Asset.NameAr,
                assetType = r.Asset.AssetType
            }
        });

        return Ok(result);
    }

    [HttpPost]
    [HasPermission("portal:create")]
    public async Task<IActionResult> Create([FromBody] JsonElement payload, CancellationToken cancellationToken = default)
    {
        var investorAccountId = TryGet(payload, "investorAccountId");
        if (string.IsNullOrWhiteSpace(investorAccountId))
        {
            return BadRequest(new { message = "investorAccountId is required." });
        }

        var programType = ParseProgramType(TryGet(payload, "programType"));
        var startDate = ParseDate(payload, "startDate");
        var endDate = ParseDate(payload, "endDate");
        var assetId = TryGetGuid(payload, "assetId");

        var request = new IstifadaRequest
        {
            InvestorAccountId = investorAccountId,
            AssetId = assetId,
            ProgramType = programType,
            ProgramTitle = TryGet(payload, "programTitle") ?? "Istifada Program",
            ProgramDescription = TryGet(payload, "programDescription") ?? string.Empty,
            TargetBeneficiaries = TryGet(payload, "targetBeneficiaries"),
            StartDate = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(6)),
            BudgetEstimate = TryGet(payload, "budgetEstimate"),
            Status = IstifadaStatus.New,
            ReferenceNumber = $"IST-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..18]
        };

        await _dbContext.IstifadaRequests.AddAsync(request, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true, id = request.Id });
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

    private static DateOnly? ParseDate(JsonElement payload, string property)
    {
        if (!payload.TryGetProperty(property, out var value) || value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return DateOnly.TryParse(value.GetString(), out var date) ? date : null;
    }

    private static IstifadaProgramType ParseProgramType(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "educational_services" => IstifadaProgramType.EducationalServices,
            "community_programs" => IstifadaProgramType.CommunityPrograms,
            "sports_activities" => IstifadaProgramType.SportsActivities,
            "cultural_events" => IstifadaProgramType.CulturalEvents,
            _ => IstifadaProgramType.Other
        };
    }

    private static string MapProgramType(IstifadaProgramType programType)
    {
        return programType switch
        {
            IstifadaProgramType.EducationalServices => "educational_services",
            IstifadaProgramType.CommunityPrograms => "community_programs",
            IstifadaProgramType.SportsActivities => "sports_activities",
            IstifadaProgramType.CulturalEvents => "cultural_events",
            _ => "other"
        };
    }

    private static string MapIstifadaStatus(IstifadaStatus status)
    {
        return status switch
        {
            IstifadaStatus.New => "new",
            IstifadaStatus.UnderReview => "under_review",
            IstifadaStatus.AdditionalInfoRequested => "additional_info_requested",
            IstifadaStatus.Approved => "approved",
            IstifadaStatus.Rejected => "rejected",
            IstifadaStatus.Completed => "completed",
            _ => "new"
        };
    }
}
