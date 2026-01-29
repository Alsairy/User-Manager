using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManager.Api.Authorization;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/reference")]
[Authorize]
public class ReferenceController : ControllerBase
{
    [HttpGet("regions")]
    public IActionResult Regions() => Ok(ReferenceData.Regions);

    [HttpGet("cities")]
    public IActionResult Cities([FromQuery] string? regionId)
    {
        if (string.IsNullOrWhiteSpace(regionId))
        {
            return Ok(ReferenceData.Cities);
        }

        return Ok(ReferenceData.Cities.Where(c => string.Equals(c.RegionId, regionId, StringComparison.OrdinalIgnoreCase)));
    }

    [HttpGet("districts")]
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
