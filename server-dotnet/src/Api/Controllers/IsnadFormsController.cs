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
[Route("api/v1/isnad/forms")]
[Authorize]
public class IsnadFormsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public IsnadFormsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("isnad:read")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var forms = await _dbContext.IsnadForms
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(forms.Select(MapIsnadForm));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("isnad:read")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var form = await _dbContext.IsnadForms.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (form is null)
        {
            return NotFound();
        }

        return Ok(MapIsnadForm(form));
    }

    [HttpPost]
    [HasPermission("isnad:create")]
    public async Task<IActionResult> Create([FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var assetId = TryGetGuid(payload, "assetId");
        var now = DateTime.UtcNow;
        var form = new IsnadForm
        {
            Title = TryGet(payload, "title") ?? "ISNAD Request",
            ReferenceNumber = TryGet(payload, "formCode") ?? $"ISNAD-{Guid.NewGuid():N}"[..12],
            Notes = TryGet(payload, "notes"),
            AssetId = assetId,
            Status = IsnadStatus.PendingVerification,
            CurrentStage = "school_planning",
            SubmittedAt = now,
            CreatedBy = TryGet(payload, "createdBy") ?? "system"
        };

        await _dbContext.IsnadForms.AddAsync(form, cancellationToken);

        if (assetId.HasValue)
        {
            var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == assetId.Value, cancellationToken);
            if (asset is not null)
            {
                asset.HasActiveIsnad = true;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = form.Id }, MapIsnadForm(form));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("isnad:update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] JsonElement payload, CancellationToken cancellationToken)
    {
        var form = await _dbContext.IsnadForms.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (form is null)
        {
            return NotFound();
        }

        var title = TryGet(payload, "title");
        if (!string.IsNullOrWhiteSpace(title))
        {
            form.Title = title.Trim();
        }

        if (payload.TryGetProperty("notes", out var notesValue) && notesValue.ValueKind == JsonValueKind.String)
        {
            form.Notes = notesValue.GetString()?.Trim();
        }

        var statusValue = TryGet(payload, "status");
        var status = ParseIsnadStatus(statusValue);
        if (status.HasValue)
        {
            form.Status = status.Value;
        }

        var assetId = TryGetGuid(payload, "assetId");
        if (assetId.HasValue)
        {
            form.AssetId = assetId;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(MapIsnadForm(form));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("isnad:update")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var form = await _dbContext.IsnadForms.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (form is null)
        {
            return NotFound();
        }

        _dbContext.IsnadForms.Remove(form);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
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

    private static IsnadStatus? ParseIsnadStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return null;
        }

        return status.ToLowerInvariant() switch
        {
            "draft" => IsnadStatus.Draft,
            "pending_verification" => IsnadStatus.PendingVerification,
            "verification_due" => IsnadStatus.VerificationDue,
            "changes_requested" => IsnadStatus.ChangesRequested,
            "verified_filled" => IsnadStatus.VerifiedFilled,
            "investment_agency_review" => IsnadStatus.InvestmentAgencyReview,
            "in_package" => IsnadStatus.InPackage,
            "pending_ceo" => IsnadStatus.PendingCeo,
            "pending_minister" => IsnadStatus.PendingMinister,
            "approved" => IsnadStatus.Approved,
            "rejected" => IsnadStatus.Rejected,
            "cancelled" => IsnadStatus.Cancelled,
            _ => null
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
        if (!payload.TryGetProperty(property, out var value))
        {
            return null;
        }

        if (value.ValueKind == JsonValueKind.String && Guid.TryParse(value.GetString(), out var parsed))
        {
            return parsed;
        }

        if (value.ValueKind == JsonValueKind.Object && value.TryGetProperty("id", out var idValue))
        {
            if (idValue.ValueKind == JsonValueKind.String && Guid.TryParse(idValue.GetString(), out parsed))
            {
                return parsed;
            }
        }

        return null;
    }
}
