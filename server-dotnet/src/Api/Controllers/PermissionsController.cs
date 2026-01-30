using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Api.Models.Permissions;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/permissions")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public PermissionsController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("permissions:manage")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, VaryByHeader = "Authorization")]
    public async Task<ActionResult<IReadOnlyList<PermissionResponse>>> List(CancellationToken cancellationToken)
    {
        var permissions = await _dbContext.Permissions
            .AsNoTracking()
            .OrderBy(p => p.Key)
            .Select(p => new PermissionResponse(p.Id, p.Key, p.Description))
            .ToListAsync(cancellationToken);

        return Ok(permissions);
    }

    [HttpGet("{id:guid}")]
    [HasPermission("permissions:manage")]
    public async Task<ActionResult<PermissionResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var permission = await _dbContext.Permissions.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (permission is null)
        {
            return NotFound();
        }

        return Ok(new PermissionResponse(permission.Id, permission.Key, permission.Description));
    }

    [HttpPost]
    [HasPermission("permissions:manage")]
    public async Task<ActionResult<PermissionResponse>> Create([FromBody] CreatePermissionRequest request, CancellationToken cancellationToken)
    {
        var permission = new Permission
        {
            Key = request.Key.Trim(),
            Description = request.Description?.Trim()
        };

        await _dbContext.Permissions.AddAsync(permission, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = permission.Id },
            new PermissionResponse(permission.Id, permission.Key, permission.Description));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("permissions:manage")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var permission = await _dbContext.Permissions.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (permission is null)
        {
            return NotFound();
        }

        _dbContext.Permissions.Remove(permission);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
