using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Api.Models.Assets;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/assets")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public AssetsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("assets:read")]
    public async Task<ActionResult<IReadOnlyList<AssetResponse>>> List(CancellationToken cancellationToken)
    {
        var assets = await _dbContext.Assets
            .OrderBy(a => a.Name)
            .Select(a => new AssetResponse(a.Id, a.Name, a.Code, a.Description, MapAssetStatus(a.Status)))
            .ToListAsync(cancellationToken);

        return Ok(assets);
    }

    [HttpGet("{id:guid}")]
    [HasPermission("assets:read")]
    public async Task<ActionResult<AssetResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null)
        {
            return NotFound();
        }

        return Ok(new AssetResponse(asset.Id, asset.Name, asset.Code, asset.Description, MapAssetStatus(asset.Status)));
    }

    [HttpPost]
    [HasPermission("assets:create")]
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

    [HttpPut("{id:guid}")]
    [HasPermission("assets:update")]
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

    [HttpDelete("{id:guid}")]
    [HasPermission("assets:delete")]
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
