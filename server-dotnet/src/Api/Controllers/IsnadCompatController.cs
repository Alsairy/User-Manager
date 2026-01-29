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
public class IsnadCompatController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public IsnadCompatController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost("api/v1/isnad/forms/{id:guid}/submit")]
    [HasPermission("isnad:create")]
    public IActionResult SubmitForm(Guid id) => Ok(new { success = true });

    [HttpPost("api/v1/isnad/forms/{id:guid}/cancel")]
    [HasPermission("isnad:update")]
    public IActionResult CancelForm(Guid id) => Ok(new { success = true });

    [HttpPost("api/v1/isnad/forms/{id:guid}/review")]
    [HasPermission("isnad:update")]
    public IActionResult ReviewForm(Guid id) => Ok(new { success = true });

    [HttpGet("api/v1/isnad/forms/{id:guid}/approvals")]
    [HasPermission("isnad:read")]
    public IActionResult FormApprovals(Guid id) => Ok(Array.Empty<object>());

    [HttpGet("api/v1/isnad/forms-for-packaging")]
    [HasPermission("isnad:read")]
    public async Task<IActionResult> FormsForPackaging(CancellationToken cancellationToken)
    {
        var forms = await _dbContext.IsnadForms
            .Include(f => f.Asset)
            .Where(f => f.Status == IsnadStatus.Approved)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = forms.Select(f => new
        {
            id = f.Id,
            formCode = f.ReferenceNumber,
            status = MapIsnadStatus(f.Status),
            asset = f.Asset is null ? null : new
            {
                id = f.Asset.Id,
                assetNameEn = f.Asset.Name,
                assetNameAr = f.Asset.NameAr,
                assetType = f.Asset.AssetType,
                assetCode = f.Asset.Code
            },
            financialAnalysis = new
            {
                currentValuation = 0
            }
        }).ToList();

        return Ok(new { forms = result, total = result.Count, page = 1, limit = result.Count });
    }

    [HttpGet("api/v1/isnad/packages")]
    [HasPermission("isnad:read")]
    public async Task<IActionResult> Packages([FromQuery] int page = 1, [FromQuery] int limit = 25,
        [FromQuery] string? search = null, [FromQuery] string? status = null, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var query = _dbContext.IsnadPackages
            .Include(p => p.Forms)
                .ThenInclude(f => f.Form)
            .Include(p => p.Forms)
                .ThenInclude(f => f.Asset)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p => p.PackageCode.Contains(search) || p.PackageName.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var statusFilter = ParsePackageStatus(status);
            query = query.Where(p => p.Status == statusFilter);
        }

        var total = await query.CountAsync(cancellationToken);
        var packages = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var result = packages.Select(MapPackage).ToList();
        return Ok(new { packages = result, total, page, limit });
    }

    [HttpPost("api/v1/isnad/packages")]
    [HasPermission("isnad:create")]
    public async Task<IActionResult> CreatePackage([FromBody] JsonElement payload, CancellationToken cancellationToken = default)
    {
        var packageName = TryGet(payload, "packageName") ?? "New Package";
        var priority = ParsePriority(TryGet(payload, "priority"));
        var durationYears = TryGetInt(payload, "durationYears");
        var durationMonths = TryGetInt(payload, "durationMonths");
        var description = TryGet(payload, "description");
        var formIds = TryGetGuidList(payload, "formIds");

        if (formIds.Count == 0)
        {
            return BadRequest(new { message = "At least one formId is required." });
        }

        var package = new IsnadPackage
        {
            PackageName = packageName,
            PackageCode = $"PKG-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..18],
            Description = description,
            Priority = priority,
            DurationYears = durationYears,
            DurationMonths = durationMonths,
            Status = PackageStatus.Draft,
            CreatedBy = "system"
        };

        foreach (var formId in formIds)
        {
            var form = await _dbContext.IsnadForms.FirstOrDefaultAsync(f => f.Id == formId, cancellationToken);
            package.Forms.Add(new IsnadPackageForm
            {
                FormId = formId,
                AssetId = form?.AssetId
            });
        }

        package.TotalAssets = package.Forms.Count;
        package.TotalValuation = 0;

        await _dbContext.IsnadPackages.AddAsync(package, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true, id = package.Id });
    }

    [HttpPost("api/v1/isnad/packages/{id:guid}/submit-ceo")]
    [HasPermission("isnad:update")]
    public async Task<IActionResult> SubmitCeo(Guid id, CancellationToken cancellationToken = default)
    {
        var package = await _dbContext.IsnadPackages.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (package is null)
        {
            return NotFound();
        }

        package.Status = PackageStatus.PendingCeo;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("api/v1/isnad/packages/{id:guid}/review-ceo")]
    [HasPermission("isnad:approve")]
    public async Task<IActionResult> ReviewCeo(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken = default)
    {
        var package = await _dbContext.IsnadPackages.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (package is null)
        {
            return NotFound();
        }

        var action = TryGet(payload, "action");
        var comments = TryGet(payload, "comments");

        if (string.Equals(action, "approve", StringComparison.OrdinalIgnoreCase))
        {
            package.Status = PackageStatus.CeoApproved;
            package.CeoApprovedAt = DateTime.UtcNow;
            package.CeoComments = comments;
        }
        else if (string.Equals(action, "reject", StringComparison.OrdinalIgnoreCase))
        {
            package.Status = PackageStatus.RejectedCeo;
            package.RejectionReason = comments;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost("api/v1/isnad/packages/{id:guid}/review-minister")]
    [HasPermission("isnad:approve")]
    public async Task<IActionResult> ReviewMinister(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken = default)
    {
        var package = await _dbContext.IsnadPackages.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (package is null)
        {
            return NotFound();
        }

        var action = TryGet(payload, "action");
        var comments = TryGet(payload, "comments");

        if (string.Equals(action, "approve", StringComparison.OrdinalIgnoreCase))
        {
            package.Status = PackageStatus.MinisterApproved;
            package.MinisterApprovedAt = DateTime.UtcNow;
            package.MinisterComments = comments;
            package.CompletedAt = DateTime.UtcNow;
        }
        else if (string.Equals(action, "reject", StringComparison.OrdinalIgnoreCase))
        {
            package.Status = PackageStatus.RejectedMinister;
            package.RejectionReason = comments;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpGet("api/v1/isnad/bank/stats")]
    [HasPermission("isnad:read")]
    public async Task<IActionResult> BankStats(CancellationToken cancellationToken = default)
    {
        var totalForms = await _dbContext.IsnadForms.CountAsync(cancellationToken);
        var approvedForms = await _dbContext.IsnadForms.CountAsync(f => f.Status == IsnadStatus.Approved, cancellationToken);
        var rejectedForms = await _dbContext.IsnadForms.CountAsync(f => f.Status == IsnadStatus.Rejected, cancellationToken);
        var pendingPackaging = await _dbContext.IsnadForms.CountAsync(f => f.Status == IsnadStatus.PendingVerification, cancellationToken);

        return Ok(new
        {
            totalForms,
            pendingPackaging,
            packagedForms = 0,
            approvedForms,
            rejectedForms,
            stages = Enum.GetNames<IsnadStatus>().Select(s => new { stage = s, count = 0 })
        });
    }

    private static object MapPackage(IsnadPackage package)
    {
        var assets = package.Forms
            .Select(f => f.Asset)
            .Where(a => a is not null)
            .GroupBy(a => a!.Id)
            .Select(g => g.First())
            .Select(a => new
            {
                id = a!.Id,
                assetNameEn = a.Name,
                assetNameAr = a.NameAr,
                assetCode = a.Code,
                assetType = a.AssetType,
                totalArea = a.TotalArea,
                region = (object?)null,
                city = (object?)null,
                district = (object?)null,
                ownershipType = (string?)null
            })
            .ToList();

        var forms = package.Forms
            .Select(f => f.Form)
            .Where(form => form is not null)
            .Select(form => new
            {
                id = form!.Id,
                formCode = form.ReferenceNumber,
                status = MapIsnadStatus(form.Status),
                asset = form.Asset is null ? null : new
                {
                    id = form.Asset.Id,
                    assetNameEn = form.Asset.Name,
                    assetType = form.Asset.AssetType
                },
                financialAnalysis = new
                {
                    currentValuation = 0
                }
            })
            .ToList();

        return new
        {
            id = package.Id,
            packageCode = package.PackageCode,
            packageName = package.PackageName,
            description = package.Description,
            investmentStrategy = package.InvestmentStrategy,
            priority = MapPackagePriority(package.Priority),
            durationYears = package.DurationYears,
            durationMonths = package.DurationMonths,
            status = MapPackageStatus(package.Status),
            expectedRevenue = package.ExpectedRevenue,
            totalValuation = package.TotalValuation,
            totalAssets = package.TotalAssets,
            ceoApprovedAt = package.CeoApprovedAt,
            ceoComments = package.CeoComments,
            ministerApprovedAt = package.MinisterApprovedAt,
            ministerComments = package.MinisterComments,
            rejectionReason = package.RejectionReason,
            packageDocumentUrl = package.PackageDocumentUrl,
            createdBy = package.CreatedBy,
            createdAt = package.CreatedAt,
            updatedAt = package.UpdatedAt,
            completedAt = package.CompletedAt,
            assets,
            forms
        };
    }

    private static string MapPackageStatus(PackageStatus status)
    {
        return status switch
        {
            PackageStatus.Draft => "draft",
            PackageStatus.PendingCeo => "pending_ceo",
            PackageStatus.CeoApproved => "ceo_approved",
            PackageStatus.PendingMinister => "pending_minister",
            PackageStatus.MinisterApproved => "minister_approved",
            PackageStatus.RejectedCeo => "rejected_ceo",
            PackageStatus.RejectedMinister => "rejected_minister",
            _ => "draft"
        };
    }

    private static string MapIsnadStatus(IsnadStatus status)
    {
        return status switch
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
    }

    private static PackageStatus ParsePackageStatus(string value)
    {
        return value.ToLowerInvariant() switch
        {
            "pending_ceo" => PackageStatus.PendingCeo,
            "ceo_approved" => PackageStatus.CeoApproved,
            "pending_minister" => PackageStatus.PendingMinister,
            "minister_approved" => PackageStatus.MinisterApproved,
            "rejected_ceo" => PackageStatus.RejectedCeo,
            "rejected_minister" => PackageStatus.RejectedMinister,
            _ => PackageStatus.Draft
        };
    }

    private static string MapPackagePriority(PackagePriority priority)
    {
        return priority switch
        {
            PackagePriority.High => "high",
            PackagePriority.Medium => "medium",
            PackagePriority.Low => "low",
            _ => "medium"
        };
    }

    private static PackagePriority ParsePriority(string? value)
    {
        return value?.ToLowerInvariant() switch
        {
            "high" => PackagePriority.High,
            "low" => PackagePriority.Low,
            _ => PackagePriority.Medium
        };
    }

    private static string? TryGet(JsonElement payload, string property)
    {
        return payload.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static int? TryGetInt(JsonElement payload, string property)
    {
        return payload.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.Number
            ? value.GetInt32()
            : null;
    }

    private static List<Guid> TryGetGuidList(JsonElement payload, string property)
    {
        if (!payload.TryGetProperty(property, out var value) || value.ValueKind != JsonValueKind.Array)
        {
            return new List<Guid>();
        }

        var result = new List<Guid>();
        foreach (var element in value.EnumerateArray())
        {
            if (element.ValueKind == JsonValueKind.String && Guid.TryParse(element.GetString(), out var id))
            {
                result.Add(id);
            }
        }

        return result;
    }
}
