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

/// <summary>
/// Manages ISNAD (Investment Study and Approval Document) forms.
/// ISNAD forms track the approval workflow for asset investments through various stages.
/// </summary>
[ApiController]
[Route("api/v1/isnad/forms")]
[Authorize]
[Produces("application/json")]
[Tags("ISNAD")]
public class IsnadFormsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    /// <summary>
    /// Initializes a new instance of the IsnadFormsController.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    public IsnadFormsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Retrieves all ISNAD forms in the system.
    /// </summary>
    /// <remarks>
    /// Returns a list of all ISNAD forms ordered by creation date (most recent first).
    /// Each form includes its current status, stage, and workflow information.
    /// </remarks>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A list of all ISNAD forms.</returns>
    /// <response code="200">Returns the list of ISNAD forms.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'isnad:read' permission.</response>
    [HttpGet]
    [HasPermission("isnad:read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var forms = await _dbContext.IsnadForms
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(forms.Select(MapIsnadForm));
    }

    /// <summary>
    /// Retrieves a specific ISNAD form by its unique identifier.
    /// </summary>
    /// <remarks>
    /// Returns detailed information about the ISNAD form including its current workflow state,
    /// sections, attachments, and audit trail.
    /// </remarks>
    /// <param name="id">The unique identifier of the ISNAD form.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The ISNAD form details.</returns>
    /// <response code="200">Returns the ISNAD form details.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'isnad:read' permission.</response>
    /// <response code="404">If the ISNAD form with the specified ID was not found.</response>
    [HttpGet("{id:guid}")]
    [HasPermission("isnad:read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var form = await _dbContext.IsnadForms.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (form is null)
        {
            return NotFound();
        }

        return Ok(MapIsnadForm(form));
    }

    /// <summary>
    /// Creates a new ISNAD form.
    /// </summary>
    /// <remarks>
    /// Creates a new ISNAD form for an asset investment study.
    /// The form will be created with 'pending_verification' status.
    ///
    /// Sample request:
    ///
    ///     POST /api/v1/isnad/forms
    ///     {
    ///         "title": "Investment Study for Commercial Building A",
    ///         "assetId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    ///         "notes": "Initial assessment required",
    ///         "createdBy": "john.doe@example.com"
    ///     }
    ///
    /// </remarks>
    /// <param name="payload">The ISNAD form creation payload as JSON.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The newly created ISNAD form.</returns>
    /// <response code="201">Returns the newly created ISNAD form.</response>
    /// <response code="400">If the request is invalid.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'isnad:create' permission.</response>
    [HttpPost]
    [HasPermission("isnad:create")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
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

    /// <summary>
    /// Updates an existing ISNAD form.
    /// </summary>
    /// <remarks>
    /// Updates the ISNAD form's title, notes, status, or associated asset.
    ///
    /// Valid status values:
    /// - draft
    /// - pending_verification
    /// - verification_due
    /// - changes_requested
    /// - verified_filled
    /// - investment_agency_review
    /// - in_package
    /// - pending_ceo
    /// - pending_minister
    /// - approved
    /// - rejected
    /// - cancelled
    ///
    /// Sample request:
    ///
    ///     PUT /api/v1/isnad/forms/{id}
    ///     {
    ///         "title": "Updated Investment Study Title",
    ///         "status": "verified_filled",
    ///         "notes": "Updated notes"
    ///     }
    ///
    /// </remarks>
    /// <param name="id">The unique identifier of the ISNAD form to update.</param>
    /// <param name="payload">The ISNAD form update payload as JSON.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The updated ISNAD form.</returns>
    /// <response code="200">Returns the updated ISNAD form.</response>
    /// <response code="400">If the request is invalid.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'isnad:update' permission.</response>
    /// <response code="404">If the ISNAD form with the specified ID was not found.</response>
    [HttpPut("{id:guid}")]
    [HasPermission("isnad:update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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

    /// <summary>
    /// Deletes an ISNAD form.
    /// </summary>
    /// <remarks>
    /// Permanently deletes the ISNAD form. This operation cannot be undone.
    /// Consider cancelling the form instead if you need to preserve the audit trail.
    /// </remarks>
    /// <param name="id">The unique identifier of the ISNAD form to delete.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>No content on successful deletion.</returns>
    /// <response code="204">The ISNAD form was successfully deleted.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'isnad:update' permission.</response>
    /// <response code="404">If the ISNAD form with the specified ID was not found.</response>
    [HttpDelete("{id:guid}")]
    [HasPermission("isnad:update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
