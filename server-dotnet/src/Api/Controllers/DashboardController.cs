using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManager.Api.Authorization;
using UserManager.Application.Queries;

namespace UserManager.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Gets dashboard statistics. Data is cached server-side for 5 minutes.
    /// </summary>
    [HttpGet("stats")]
    [HasPermission("dashboard:read")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, VaryByHeader = "Authorization")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDashboardStatsQuery(), ct);
        return Ok(result);
    }
}
