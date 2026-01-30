using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Api.Models.Assets;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Api.Controllers;

/// <summary>
/// Manages assets including properties, land parcels, and other investable resources.
/// Assets can be associated with contracts and ISNAD forms.
/// </summary>
[ApiController]
[Route("api/v1/assets")]
[Authorize]
[Produces("application/json")]
[Tags("Assets")]
public class AssetsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    /// <summary>
    /// Initializes a new instance of the AssetsController.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    public AssetsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Retrieves all assets in the system.
    /// </summary>
    /// <remarks>
    /// Returns a list of all assets ordered alphabetically by name.
    /// Each asset includes its current status (draft, in_review, completed, rejected, incomplete_bulk).
    /// </remarks>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A list of all assets.</returns>
    /// <response code="200">Returns the list of assets.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'assets:read' permission.</response>
    [HttpGet]
    [HasPermission("assets:read")]
    [ProducesResponseType(typeof(IReadOnlyList<AssetResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<AssetResponse>>> List(CancellationToken cancellationToken)
    {
        var assets = await _dbContext.Assets
            .OrderBy(a => a.Name)
            .Select(a => new AssetResponse(a.Id, a.Name, a.Code, a.Description, MapAssetStatus(a.Status)))
            .ToListAsync(cancellationToken);

        return Ok(assets);
    }

    /// <summary>
    /// Retrieves a specific asset by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the asset.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The asset details.</returns>
    /// <response code="200">Returns the asset details.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'assets:read' permission.</response>
    /// <response code="404">If the asset with the specified ID was not found.</response>
    [HttpGet("{id:guid}")]
    [HasPermission("assets:read")]
    [ProducesResponseType(typeof(AssetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        return Ok(new AssetResponse(asset.Id, asset.Name, asset.Code, asset.Description, MapAssetStatus(asset.Status)));
    }

    /// <summary>
    /// Creates a new asset.
    /// </summary>
    /// <remarks>
    /// Creates a new asset with the specified name, code, and optional description.
    /// The asset will be created with a 'draft' status.
    ///
    /// Sample request:
    ///
    ///     POST /api/v1/assets
    ///     {
    ///         "name": "Commercial Building A",
    ///         "code": "CB-001",
    ///         "description": "Prime commercial property in downtown area"
    ///     }
    ///
    /// </remarks>
    /// <param name="request">The asset creation request.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The newly created asset.</returns>
    /// <response code="201">Returns the newly created asset.</response>
    /// <response code="400">If the request is invalid (e.g., duplicate code).</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'assets:create' permission.</response>
    [HttpPost]
    [HasPermission("assets:create")]
    [ProducesResponseType(typeof(AssetResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AssetResponse>> Create([FromBody] CreateAssetRequest request, CancellationToken cancellationToken)
    {
        var asset = new Asset
        {
            Name = request.Name.Trim(),
            Code = request.Code.Trim(),
            Description = request.Description?.Trim(),
            Status = AssetStatus.Draft
        };

        await _dbContext.Assets.AddAsync(asset, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = asset.Id },
            new AssetResponse(asset.Id, asset.Name, asset.Code, asset.Description, MapAssetStatus(asset.Status)));
    }

    /// <summary>
    /// Updates an existing asset.
    /// </summary>
    /// <remarks>
    /// Updates the asset's name, description, and/or status.
    /// Valid status values: draft, in_review, submitted, completed, approved, rejected, incomplete_bulk.
    ///
    /// Sample request:
    ///
    ///     PUT /api/v1/assets/{id}
    ///     {
    ///         "name": "Updated Building Name",
    ///         "description": "Updated description",
    ///         "status": "in_review"
    ///     }
    ///
    /// </remarks>
    /// <param name="id">The unique identifier of the asset to update.</param>
    /// <param name="request">The asset update request.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The updated asset.</returns>
    /// <response code="200">Returns the updated asset.</response>
    /// <response code="400">If the request is invalid.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'assets:update' permission.</response>
    /// <response code="404">If the asset with the specified ID was not found.</response>
    [HttpPut("{id:guid}")]
    [HasPermission("assets:update")]
    [ProducesResponseType(typeof(AssetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetResponse>> Update(Guid id, [FromBody] UpdateAssetRequest request, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            asset.Name = request.Name.Trim();
        }

        if (request.Description is not null)
        {
            asset.Description = request.Description.Trim();
        }

        var parsedStatus = ParseAssetStatus(request.Status);
        if (parsedStatus.HasValue)
        {
            asset.Status = parsedStatus.Value;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new AssetResponse(asset.Id, asset.Name, asset.Code, asset.Description, MapAssetStatus(asset.Status)));
    }

    /// <summary>
    /// Deletes an asset.
    /// </summary>
    /// <remarks>
    /// Permanently deletes the asset. This operation cannot be undone.
    /// Assets with active contracts or ISNAD forms may have restrictions on deletion.
    /// </remarks>
    /// <param name="id">The unique identifier of the asset to delete.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>No content on successful deletion.</returns>
    /// <response code="204">The asset was successfully deleted.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'assets:delete' permission.</response>
    /// <response code="404">If the asset with the specified ID was not found.</response>
    [HttpDelete("{id:guid}")]
    [HasPermission("assets:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        _dbContext.Assets.Remove(asset);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
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

    private static AssetStatus? ParseAssetStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

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
}
