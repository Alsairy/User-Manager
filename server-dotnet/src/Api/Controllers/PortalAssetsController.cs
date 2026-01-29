using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/portal/assets")]
[Authorize]
public class PortalAssetsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public PortalAssetsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("portal:read")]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 12, CancellationToken cancellationToken = default)
    {
        var assets = await _dbContext.Assets
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var total = await _dbContext.Assets.CountAsync(cancellationToken);
        var items = assets.Select(MapPortalAsset);

        return Ok(new { assets = items, total, page, limit });
    }

    [HttpGet("{id:guid}")]
    [HasPermission("portal:read")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var asset = await _dbContext.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null) return NotFound();

        return Ok(MapPortalAsset(asset));
    }

    private static object MapPortalAsset(UserManager.Domain.Entities.Asset asset)
    {
        var city = ReferenceData.FindCity(asset.CityId);
        var district = ReferenceData.FindDistrict(asset.DistrictId);

        return new
        {
            id = asset.Id,
            assetNameEn = asset.Name,
            assetNameAr = asset.NameAr,
            assetType = asset.AssetType,
            status = asset.Status switch
            {
                UserManager.Domain.Enums.AssetStatus.Draft => "draft",
                UserManager.Domain.Enums.AssetStatus.InReview => "in_review",
                UserManager.Domain.Enums.AssetStatus.Completed => "completed",
                UserManager.Domain.Enums.AssetStatus.Rejected => "rejected",
                UserManager.Domain.Enums.AssetStatus.IncompleteBulk => "incomplete_bulk",
                _ => "draft"
            },
            totalArea = asset.TotalArea,
            city = city is null ? null : new { city.Id, city.RegionId, city.NameAr, city.NameEn, city.Code },
            district = district is null ? null : new { district.Id, district.CityId, district.NameAr, district.NameEn, district.Code }
        };
    }
}
