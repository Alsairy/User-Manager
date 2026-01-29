using System.Linq;
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
[Authorize]
public class AssetsCompatController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public AssetsCompatController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("api/v1/assets/registrations")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> Registrations(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? assetType = null,
        [FromQuery] string? visibilityStatus = null,
        [FromQuery] string? status = null,
        [FromQuery] string? regionId = null,
        [FromQuery] string? cityIds = null,
        [FromQuery] string? districtIds = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var query = _dbContext.Assets.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(a => a.Name.Contains(search) || a.Code.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(assetType) && !string.Equals(assetType, "all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.AssetType == assetType);
        }

        if (!string.IsNullOrWhiteSpace(visibilityStatus) && !string.Equals(visibilityStatus, "all", StringComparison.OrdinalIgnoreCase))
        {
            var visible = string.Equals(visibilityStatus, "visible", StringComparison.OrdinalIgnoreCase);
            query = query.Where(a => a.VisibleToInvestors == visible);
        }

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var assetStatus = ParseAssetStatus(status);
            if (assetStatus.HasValue)
            {
                query = query.Where(a => a.Status == assetStatus.Value);
            }
        }

        if (!string.IsNullOrWhiteSpace(regionId) && !string.Equals(regionId, "all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(a => a.RegionId == regionId);
        }

        if (!string.IsNullOrWhiteSpace(cityIds))
        {
            var citySet = cityIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            query = query.Where(a => a.CityId != null && citySet.Contains(a.CityId));
        }

        if (!string.IsNullOrWhiteSpace(districtIds))
        {
            var districtSet = districtIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            query = query.Where(a => a.DistrictId != null && districtSet.Contains(a.DistrictId));
        }

        var total = await query.CountAsync(cancellationToken);
        var assets = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return Ok(new { assets = assets.Select(MapAsset), total, page, limit });
    }

    [HttpPost("api/v1/assets/registrations")]
    [HasPermission("assets:create")]
    public async Task<IActionResult> CreateRegistration([FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var name = TryGet(payload, "assetNameEn") ?? TryGet(payload, "assetName") ?? "New Asset";
        var asset = new Asset
        {
            Name = name,
            NameAr = TryGet(payload, "assetNameAr") ?? string.Empty,
            Code = TryGet(payload, "assetCode") ?? Guid.NewGuid().ToString("N")[..8],
            AssetType = TryGet(payload, "assetType") ?? "land",
            RegionId = TryGet(payload, "regionId") ?? string.Empty,
            CityId = TryGet(payload, "cityId") ?? string.Empty,
            DistrictId = TryGet(payload, "districtId") ?? string.Empty,
            Neighborhood = TryGet(payload, "neighborhood"),
            StreetAddress = TryGet(payload, "streetAddress") ?? TryGet(payload, "shortNationalAddress"),
            Latitude = TryGetDouble(payload, "latitude"),
            Longitude = TryGetDouble(payload, "longitude"),
            LocationValidated = TryGetBool(payload, "locationValidated") ?? false,
            NearbyAssetsJustification = TryGet(payload, "nearbyAssetsJustification"),
            TotalArea = TryGetDouble(payload, "totalArea") ?? 0,
            BuiltUpArea = TryGetDouble(payload, "builtUpArea"),
            LandUseType = TryGet(payload, "landUseType"),
            ZoningClassification = TryGet(payload, "zoningClassification"),
            CurrentStatus = TryGet(payload, "currentStatus"),
            OwnershipType = TryGet(payload, "ownershipType"),
            DeedNumber = TryGet(payload, "deedNumber"),
            DeedDate = TryGetDate(payload, "deedDate"),
            OwnershipDocuments = TryGetStringList(payload, "ownershipDocuments"),
            Features = TryGetStringList(payload, "features"),
            CustomFeatures = TryGet(payload, "customFeatures"),
            FinancialDues = TryGetDecimal(payload, "financialDues"),
            CustodyDetails = TryGet(payload, "custodyDetails"),
            AdministrativeNotes = TryGet(payload, "administrativeNotes"),
            RelatedReferences = TryGet(payload, "relatedReferences"),
            Description = TryGet(payload, "description"),
            SpecialConditions = TryGet(payload, "specialConditions"),
            InvestmentPotential = TryGet(payload, "investmentPotential"),
            Restrictions = TryGet(payload, "restrictions"),
            Attachments = TryGetStringList(payload, "attachments"),
            RegistrationMode = TryGet(payload, "registrationMode"),
            Status = AssetStatus.Draft,
            CreatedBy = TryGet(payload, "createdBy") ?? "system"
        };

        await _dbContext.Assets.AddAsync(asset, cancellationToken);
        await _dbContext.AssetWorkflowHistory.AddAsync(new AssetWorkflowHistory
        {
            AssetId = asset.Id,
            Stage = "registration",
            Action = "created",
            ActionDate = DateTime.UtcNow
        }, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(MapAsset(asset));
    }

    [HttpGet("api/v1/assets/registrations/{id:guid}")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> RegistrationDetail(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null) return NotFound();
        return Ok(MapAsset(asset));
    }

    [HttpGet("api/v1/assets/registrations/{id:guid}/history")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> RegistrationHistory(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        var history = await _dbContext.AssetWorkflowHistory
            .Where(h => h.AssetId == asset.Id)
            .OrderBy(h => h.ActionDate)
            .ToListAsync(cancellationToken);

        if (history.Count == 0)
        {
            return Ok(new[]
            {
                new
                {
                    id = Guid.NewGuid(),
                    assetId = asset.Id,
                    stage = asset.CurrentStage ?? "registration",
                    action = "created",
                    reviewerId = (string?)null,
                    reviewerDepartment = (string?)null,
                    comments = (string?)null,
                    rejectionReason = asset.RejectionReason,
                    rejectionJustification = asset.RejectionJustification,
                    documentsAdded = Array.Empty<string>(),
                    actionDate = asset.CreatedAt,
                    createdAt = asset.CreatedAt
                }
            });
        }

        return Ok(history.Select(MapWorkflowHistory));
    }

    [HttpPost("api/v1/assets/registrations/{id:guid}/submit")]
    [HasPermission("assets:create")]
    public async Task<IActionResult> SubmitRegistration(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        var mode = TryGet(payload, "mode") ?? asset.RegistrationMode ?? "direct";
        asset.RegistrationMode = mode;
        asset.SubmittedAt = DateTime.UtcNow;
        if (string.Equals(mode, "direct", StringComparison.OrdinalIgnoreCase))
        {
            asset.Status = AssetStatus.Completed;
            asset.CompletedAt = DateTime.UtcNow;
            asset.CurrentStage = null;
        }
        else
        {
            asset.Status = AssetStatus.InReview;
            asset.CurrentStage = "school_planning";
        }

        await _dbContext.AssetWorkflowHistory.AddAsync(new AssetWorkflowHistory
        {
            AssetId = asset.Id,
            Stage = asset.CurrentStage ?? "registration",
            Action = string.Equals(mode, "direct", StringComparison.OrdinalIgnoreCase) ? "approved" : "submitted",
            ActionDate = DateTime.UtcNow
        }, cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpGet("api/v1/assets/bank")]
    [HasPermission("assets:read")]
    public Task<IActionResult> Bank(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? assetType = null,
        [FromQuery] string? visibilityStatus = null,
        [FromQuery] string? status = null,
        [FromQuery] string? regionId = null,
        [FromQuery] string? cityIds = null,
        [FromQuery] string? districtIds = null,
        CancellationToken cancellationToken = default)
        => Registrations(page, limit, search, assetType, visibilityStatus, status, regionId, cityIds, districtIds, cancellationToken);

    [HttpGet("api/v1/assets/bank/{id:guid}")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> BankDetail(Guid id, CancellationToken cancellationToken)
        => await RegistrationDetail(id, cancellationToken);

    [HttpGet("api/v1/assets/bank/{id:guid}/lifecycle")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> BankLifecycle(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        var workflowHistory = await _dbContext.AssetWorkflowHistory
            .Where(h => h.AssetId == asset.Id)
            .OrderBy(h => h.ActionDate)
            .ToListAsync(cancellationToken);

        var visibilityHistory = await _dbContext.AssetVisibilityHistory
            .Where(h => h.AssetId == asset.Id)
            .OrderByDescending(h => h.StartDate)
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            asset = MapAsset(asset),
            workflowHistory = workflowHistory.Select(MapWorkflowHistory),
            visibilityHistory = visibilityHistory.Select(MapVisibilityHistory)
        });
    }

    [HttpPut("api/v1/assets/bank/{id:guid}/visibility")]
    [HasPermission("assets:update")]
    public async Task<IActionResult> UpdateVisibility(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        var visible = TryGetBool(payload, "visible");
        if (visible is null)
        {
            return BadRequest(new { message = "Missing visibility flag." });
        }

        if (asset.VisibleToInvestors != visible.Value)
        {
            var now = DateTime.UtcNow;
            var reason = TryGet(payload, "reason");
            var changedBy = TryGet(payload, "changedBy") ?? "system";
            if (visible.Value)
            {
                await CloseVisibilityPeriod(asset.Id, "hidden", now, cancellationToken);
                await _dbContext.AssetVisibilityHistory.AddAsync(new AssetVisibilityHistory
                {
                    AssetId = asset.Id,
                    VisibilityStatus = "visible",
                    StartDate = now,
                    ChangedBy = changedBy,
                    Reason = reason
                }, cancellationToken);
                asset.VisibilityCount += 1;
            }
            else
            {
                var durationDays = await CloseVisibilityPeriod(asset.Id, "visible", now, cancellationToken);
                if (durationDays.HasValue)
                {
                    asset.TotalExposureDays += durationDays.Value;
                }

                await _dbContext.AssetVisibilityHistory.AddAsync(new AssetVisibilityHistory
                {
                    AssetId = asset.Id,
                    VisibilityStatus = "hidden",
                    StartDate = now,
                    ChangedBy = changedBy,
                    Reason = reason
                }, cancellationToken);
            }

            asset.VisibleToInvestors = visible.Value;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpGet("api/v1/assets/reviews/queue")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> ReviewQueue(CancellationToken cancellationToken)
    {
        var queue = await _dbContext.Assets
            .Where(a => a.Status == AssetStatus.InReview)
            .OrderBy(a => a.CreatedAt)
            .Select(a => MapAsset(a))
            .ToListAsync(cancellationToken);

        return Ok(queue);
    }

    [HttpPost("api/v1/assets/reviews/{id:guid}/approve")]
    [HasPermission("assets:review")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        asset.Status = AssetStatus.Completed;
        asset.CompletedAt = DateTime.UtcNow;
        asset.CurrentStage = null;
        await _dbContext.AssetWorkflowHistory.AddAsync(new AssetWorkflowHistory
        {
            AssetId = asset.Id,
            Stage = "tbc_approver",
            Action = "approved",
            ActionDate = DateTime.UtcNow
        }, cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("api/v1/assets/reviews/{id:guid}/reject")]
    [HasPermission("assets:review")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        asset.Status = AssetStatus.Rejected;
        asset.RejectionReason = TryGet(payload, "rejectionReason") ?? asset.RejectionReason;
        asset.RejectionJustification = TryGet(payload, "rejectionJustification") ?? asset.RejectionJustification;
        asset.CurrentStage = null;
        await _dbContext.AssetWorkflowHistory.AddAsync(new AssetWorkflowHistory
        {
            AssetId = asset.Id,
            Stage = "tbc_approver",
            Action = "rejected",
            RejectionReason = asset.RejectionReason,
            RejectionJustification = asset.RejectionJustification,
            ActionDate = DateTime.UtcNow
        }, cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpGet("api/v1/assets/dashboard/stats")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> DashboardStats(CancellationToken cancellationToken)
    {
        var total = await _dbContext.Assets.CountAsync(cancellationToken);
        var draft = await _dbContext.Assets.CountAsync(a => a.Status == AssetStatus.Draft, cancellationToken);
        var submitted = await _dbContext.Assets.CountAsync(a => a.Status == AssetStatus.InReview, cancellationToken);
        var approved = await _dbContext.Assets.CountAsync(a => a.Status == AssetStatus.Completed, cancellationToken);
        var rejected = await _dbContext.Assets.CountAsync(a => a.Status == AssetStatus.Rejected, cancellationToken);
        var visible = await _dbContext.Assets.CountAsync(a => a.VisibleToInvestors, cancellationToken);
        var byAssetType = await _dbContext.Assets
            .GroupBy(a => a.AssetType)
            .Select(g => new { type = g.Key, count = g.Count() })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            totalAssets = total,
            draftAssets = draft,
            inReviewAssets = submitted,
            completedAssets = approved,
            rejectedAssets = rejected,
            visibleToInvestors = visible,
            byAssetType = byAssetType.ToDictionary(a => a.type, a => a.count)
        });
    }

    [HttpGet("api/v1/assets/{id:guid}/isnad-forms")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> AssetIsnadForms(Guid id, CancellationToken cancellationToken)
    {
        var forms = await _dbContext.IsnadForms
            .Where(f => f.AssetId == id)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(forms.Select(MapIsnadForm));
    }

    [HttpGet("api/v1/assets/{id:guid}/contracts")]
    [HasPermission("assets:read")]
    public async Task<IActionResult> AssetContracts(Guid id, CancellationToken cancellationToken)
    {
        var contracts = await _dbContext.Contracts
            .Where(c => c.AssetId == id)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(contracts.Select(MapContractSummary));
    }

    private static object MapAsset(Asset asset)
    {
        var region = ReferenceData.FindRegion(asset.RegionId);
        var city = ReferenceData.FindCity(asset.CityId);
        var district = ReferenceData.FindDistrict(asset.DistrictId);

        return new
        {
            id = asset.Id,
            assetCode = asset.Code,
            assetNameEn = asset.Name,
            assetNameAr = asset.NameAr,
            assetType = asset.AssetType,
            status = MapAssetStatus(asset.Status),
            description = asset.Description,
            region = region is null ? null : new { region.Id, region.NameAr, region.NameEn, region.Code },
            city = city is null ? null : new { city.Id, city.RegionId, city.NameAr, city.NameEn, city.Code },
            district = district is null ? null : new { district.Id, district.CityId, district.NameAr, district.NameEn, district.Code },
            regionId = asset.RegionId,
            cityId = asset.CityId,
            districtId = asset.DistrictId,
            neighborhood = asset.Neighborhood,
            streetAddress = asset.StreetAddress,
            latitude = asset.Latitude,
            longitude = asset.Longitude,
            locationValidated = asset.LocationValidated,
            nearbyAssetsJustification = asset.NearbyAssetsJustification,
            totalArea = asset.TotalArea,
            builtUpArea = asset.BuiltUpArea,
            landUseType = asset.LandUseType,
            zoningClassification = asset.ZoningClassification,
            currentStatus = asset.CurrentStatus,
            ownershipType = asset.OwnershipType,
            deedNumber = asset.DeedNumber,
            deedDate = asset.DeedDate,
            ownershipDocuments = asset.OwnershipDocuments,
            features = asset.Features,
            customFeatures = asset.CustomFeatures,
            financialDues = asset.FinancialDues,
            custodyDetails = asset.CustodyDetails,
            administrativeNotes = asset.AdministrativeNotes,
            relatedReferences = asset.RelatedReferences,
            specialConditions = asset.SpecialConditions,
            investmentPotential = asset.InvestmentPotential,
            restrictions = asset.Restrictions,
            attachments = asset.Attachments,
            registrationMode = asset.RegistrationMode,
            currentStage = asset.CurrentStage,
            verifiedBy = asset.VerifiedBy.Select(v => new
            {
                department = v.Department,
                userId = v.UserId,
                userName = v.UserName,
                date = v.Date
            }),
            rejectionReason = asset.RejectionReason,
            rejectionJustification = asset.RejectionJustification,
            visibleToInvestors = asset.VisibleToInvestors,
            visibilityStatus = asset.VisibleToInvestors ? "visible" : "hidden",
            visibilityCount = asset.VisibilityCount,
            totalExposureDays = asset.TotalExposureDays,
            hasActiveIsnad = asset.HasActiveIsnad,
            hasActiveContract = asset.HasActiveContract,
            createdBy = asset.CreatedBy,
            submittedAt = asset.SubmittedAt,
            completedAt = asset.CompletedAt,
            createdAt = asset.CreatedAt,
            updatedAt = asset.UpdatedAt
        };
    }

    private static object MapWorkflowHistory(AssetWorkflowHistory history)
    {
        return new
        {
            id = history.Id,
            assetId = history.AssetId,
            stage = history.Stage,
            action = history.Action,
            reviewerId = history.ReviewerId,
            reviewerDepartment = history.ReviewerDepartment,
            comments = history.Comments,
            rejectionReason = history.RejectionReason,
            rejectionJustification = history.RejectionJustification,
            documentsAdded = history.DocumentsAdded,
            actionDate = history.ActionDate,
            createdAt = history.CreatedAt
        };
    }

    private static object MapVisibilityHistory(AssetVisibilityHistory history)
    {
        return new
        {
            id = history.Id,
            assetId = history.AssetId,
            visibilityStatus = history.VisibilityStatus,
            startDate = history.StartDate,
            endDate = history.EndDate,
            durationDays = history.DurationDays,
            changedBy = history.ChangedBy,
            reason = history.Reason,
            createdAt = history.CreatedAt
        };
    }

    private static object MapIsnadForm(IsnadForm form)
    {
        return new
        {
            id = form.Id,
            formCode = form.ReferenceNumber,
            assetId = form.AssetId,
            status = MapIsnadStatus(form.Status),
            currentStage = form.CurrentStage,
            currentStepIndex = form.CurrentStepIndex,
            currentAssigneeId = form.CurrentAssigneeId,
            investmentCriteria = (object?)null,
            technicalAssessment = (object?)null,
            financialAnalysis = (object?)null,
            schoolPlanningSection = (object?)null,
            investmentPartnershipsSection = (object?)null,
            financeSection = (object?)null,
            landRegistrySection = (object?)null,
            securityFacilitiesSection = (object?)null,
            workflowSteps = Array.Empty<object>(),
            attachments = form.Attachments,
            submittedAt = form.SubmittedAt,
            completedAt = form.CompletedAt,
            returnCount = form.ReturnCount,
            returnedByStage = form.ReturnedByStage,
            returnReason = form.ReturnReason,
            slaDeadline = form.SlaDeadline,
            slaStatus = form.SlaStatus,
            packageId = form.PackageId,
            cancellationReason = form.CancellationReason,
            cancelledAt = form.CancelledAt,
            cancelledBy = form.CancelledBy,
            createdBy = form.CreatedBy,
            createdAt = form.CreatedAt,
            updatedAt = form.UpdatedAt
        };
    }

    private static object MapContractSummary(Contract contract)
    {
        return new
        {
            id = contract.Id,
            contractCode = contract.ContractCode,
            investorNameEn = contract.InvestorNameEn,
            startDate = contract.StartDate,
            endDate = contract.EndDate,
            status = MapContractStatus(contract.Status)
        };
    }

    private static string MapAssetStatus(AssetStatus status)
        => status switch
        {
            AssetStatus.Draft => "draft",
            AssetStatus.InReview => "in_review",
            AssetStatus.Completed => "completed",
            AssetStatus.Rejected => "rejected",
            AssetStatus.IncompleteBulk => "incomplete_bulk",
            _ => "draft"
        };

    private static string MapIsnadStatus(IsnadStatus status)
        => status switch
        {
            IsnadStatus.Draft => "draft",
            IsnadStatus.PendingVerification => "pending_verification",
            IsnadStatus.VerificationDue => "verification_due",
            IsnadStatus.ChangesRequested => "changes_requested",
            IsnadStatus.VerifiedFilled => "verified_filled",
            IsnadStatus.InvestmentAgencyReview => "investment_agency_review",
            IsnadStatus.InPackage => "in_package",
            IsnadStatus.PendingCeo => "pending_ceo",
            IsnadStatus.PendingMinister => "pending_minister",
            IsnadStatus.Approved => "approved",
            IsnadStatus.Rejected => "rejected",
            IsnadStatus.Cancelled => "cancelled",
            _ => "draft"
        };

    private async Task<int?> CloseVisibilityPeriod(Guid assetId, string status, DateTime endDate, CancellationToken cancellationToken)
    {
        var record = await _dbContext.AssetVisibilityHistory
            .Where(h => h.AssetId == assetId && h.VisibilityStatus == status && h.EndDate == null)
            .OrderByDescending(h => h.StartDate)
            .FirstOrDefaultAsync(cancellationToken);

        if (record is null)
        {
            return null;
        }

        record.EndDate = endDate;
        var durationDays = (int)Math.Ceiling((endDate - record.StartDate).TotalDays);
        record.DurationDays = Math.Max(0, durationDays);
        return record.DurationDays;
    }

    private static AssetStatus? ParseAssetStatus(string value)
    {
        return value.ToLowerInvariant() switch
        {
            "draft" => AssetStatus.Draft,
            "in_review" => AssetStatus.InReview,
            "submitted" => AssetStatus.InReview,
            "completed" => AssetStatus.Completed,
            "approved" => AssetStatus.Completed,
            "rejected" => AssetStatus.Rejected,
            "incomplete_bulk" => AssetStatus.IncompleteBulk,
            _ => null
        };
    }

    private static string MapContractStatus(ContractStatus status)
        => status switch
        {
            ContractStatus.Draft => "draft",
            ContractStatus.Incomplete => "incomplete",
            ContractStatus.Active => "active",
            ContractStatus.Expiring => "expiring",
            ContractStatus.Expired => "expired",
            ContractStatus.Archived => "archived",
            ContractStatus.Cancelled => "cancelled",
            _ => "draft"
        };

    private static string? TryGet(JsonElement payload, string property)
    {
        return payload.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static bool? TryGetBool(JsonElement payload, string property)
    {
        return payload.TryGetProperty(property, out var value) && value.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? value.GetBoolean()
            : null;
    }

    private static double? TryGetDouble(JsonElement payload, string property)
    {
        if (!payload.TryGetProperty(property, out var value))
        {
            return null;
        }

        if (value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var number))
        {
            return number;
        }

        if (value.ValueKind == JsonValueKind.String && double.TryParse(value.GetString(), out var parsed))
        {
            return parsed;
        }

        return null;
    }

    private static decimal? TryGetDecimal(JsonElement payload, string property)
    {
        if (!payload.TryGetProperty(property, out var value))
        {
            return null;
        }

        if (value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out var number))
        {
            return number;
        }

        if (value.ValueKind == JsonValueKind.String && decimal.TryParse(value.GetString(), out var parsed))
        {
            return parsed;
        }

        return null;
    }

    private static DateTime? TryGetDate(JsonElement payload, string property)
    {
        if (!payload.TryGetProperty(property, out var value) || value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return DateTime.TryParse(value.GetString(), out var parsed)
            ? parsed
            : null;
    }

    private static List<string> TryGetStringList(JsonElement payload, string property)
    {
        if (!payload.TryGetProperty(property, out var value) || value.ValueKind != JsonValueKind.Array)
        {
            return new List<string>();
        }

        var list = new List<string>();
        foreach (var item in value.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
            {
                var str = item.GetString();
                if (!string.IsNullOrWhiteSpace(str))
                {
                    list.Add(str);
                }
            }
        }

        return list;
    }
}
