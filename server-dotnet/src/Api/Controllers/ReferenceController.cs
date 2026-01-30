using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManager.Api.Authorization;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/reference")]
[Authorize]
public class ReferenceController : ControllerBase
{
    /// <summary>
    /// Gets all regions. This is static reference data cached for 24 hours.
    /// </summary>
    [HttpGet("regions")]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any, VaryByHeader = "Authorization")]
    public IActionResult Regions() => Ok(ReferenceData.Regions);

    /// <summary>
    /// Gets cities, optionally filtered by region. Static reference data cached for 24 hours.
    /// </summary>
    [HttpGet("cities")]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "regionId" }, VaryByHeader = "Authorization")]
    public IActionResult Cities([FromQuery] string? regionId)
    {
        if (string.IsNullOrWhiteSpace(regionId))
        {
            return Ok(ReferenceData.Cities);
        }

        return Ok(ReferenceData.Cities.Where(c => string.Equals(c.RegionId, regionId, StringComparison.OrdinalIgnoreCase)));
    }

    /// <summary>
    /// Gets districts, optionally filtered by city IDs. Static reference data cached for 24 hours.
    /// </summary>
    [HttpGet("districts")]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "cityIds" }, VaryByHeader = "Authorization")]
    public IActionResult Districts([FromQuery] string? cityIds)
    {
        if (string.IsNullOrWhiteSpace(cityIds))
        {
            return Ok(ReferenceData.Districts);
        }

        var requested = cityIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return Ok(ReferenceData.Districts.Where(d => requested.Contains(d.CityId, StringComparer.OrdinalIgnoreCase)));
    }
}
