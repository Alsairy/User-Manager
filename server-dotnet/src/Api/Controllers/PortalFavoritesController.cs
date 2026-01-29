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
[Route("api/v1/portal/favorites")]
[Authorize]
public class PortalFavoritesController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public PortalFavoritesController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("portal:read")]
    public async Task<IActionResult> List([FromQuery] string? investorAccountId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(investorAccountId))
        {
            return BadRequest(new { message = "investorAccountId is required." });
        }

        var favorites = await _dbContext.InvestorFavorites
            .Include(f => f.Asset)
            .Where(f => f.InvestorAccountId == investorAccountId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = favorites.Select(f => new
        {
            id = f.Id,
            investorAccountId = f.InvestorAccountId,
            assetId = f.AssetId,
            createdAt = f.CreatedAt,
            asset = f.Asset is null ? null : MapAsset(f.Asset)
        });

        return Ok(result);
    }

    [HttpPost]
    [HasPermission("portal:create")]
    public async Task<IActionResult> Add([FromBody] JsonElement payload, CancellationToken cancellationToken = default)
    {
        var investorAccountId = TryGet(payload, "investorAccountId");
        var assetId = TryGetGuid(payload, "assetId");

        if (string.IsNullOrWhiteSpace(investorAccountId) || assetId is null)
        {
            return BadRequest(new { message = "investorAccountId and assetId are required." });
        }

        var exists = await _dbContext.InvestorFavorites
            .AnyAsync(f => f.InvestorAccountId == investorAccountId && f.AssetId == assetId, cancellationToken);

        if (!exists)
        {
            await _dbContext.InvestorFavorites.AddAsync(new InvestorFavorite
            {
                InvestorAccountId = investorAccountId,
                AssetId = assetId.Value
            }, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return Ok(new { success = true });
    }

    [HttpDelete]
    [HasPermission("portal:create")]
    public async Task<IActionResult> Remove([FromBody] JsonElement payload, CancellationToken cancellationToken = default)
    {
        var investorAccountId = TryGet(payload, "investorAccountId");
        var assetId = TryGetGuid(payload, "assetId");

        if (string.IsNullOrWhiteSpace(investorAccountId) || assetId is null)
        {
            return BadRequest(new { message = "investorAccountId and assetId are required." });
        }

        var favorites = await _dbContext.InvestorFavorites
            .Where(f => f.InvestorAccountId == investorAccountId && f.AssetId == assetId)
            .ToListAsync(cancellationToken);

        if (favorites.Count > 0)
        {
            _dbContext.InvestorFavorites.RemoveRange(favorites);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return Ok(new { success = true });
    }

    [HttpGet("check")]
    [HasPermission("portal:read")]
    public async Task<IActionResult> Check([FromQuery] string? investorAccountId, [FromQuery] string? assetId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(investorAccountId) || string.IsNullOrWhiteSpace(assetId))
        {
            return Ok(new { isFavorite = false });
        }

        return Ok(new
        {
            isFavorite = await _dbContext.InvestorFavorites.AnyAsync(
                f => f.InvestorAccountId == investorAccountId && f.AssetId.ToString() == assetId,
                cancellationToken)
        });
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
            totalArea = asset.TotalArea,
            status = asset.Status switch
            {
                AssetStatus.Draft => "draft",
                AssetStatus.InReview => "in_review",
                AssetStatus.Completed => "completed",
                AssetStatus.Rejected => "rejected",
                AssetStatus.IncompleteBulk => "incomplete_bulk",
                _ => "draft"
            },
            city = city is null ? null : new { city.Id, city.RegionId, city.NameAr, city.NameEn, city.Code },
            region = region is null ? null : new { region.Id, region.NameAr, region.NameEn, region.Code },
            district = district is null ? null : new { district.Id, district.CityId, district.NameAr, district.NameEn, district.Code }
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
        var value = TryGet(payload, property);
        return Guid.TryParse(value, out var id) ? id : null;
    }
}
