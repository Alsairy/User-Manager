using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Api.Models.Audit;
using UserManager.Application.Interfaces;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public AuditLogsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("audit:read")]
    public async Task<ActionResult<IReadOnlyList<AuditLogResponse>>> List(CancellationToken cancellationToken)
    {
        var logs = await _dbContext.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(200)
            .Select(a => new AuditLogResponse(
                a.Id,
                a.UserId,
                a.ActionType,
                a.EntityType,
                a.EntityId,
                a.ChangesJson,
                a.IpAddress,
                a.SessionId,
                a.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(logs);
    }
}
