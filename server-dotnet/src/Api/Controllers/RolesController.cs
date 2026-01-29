using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Api.Models.Roles;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;

namespace UserManager.Api.Controllers;

[ApiController]
[Route("api/v1/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IAppDbContext _dbContext;

    public RolesController(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("roles:read")]
    public async Task<ActionResult<IReadOnlyList<RoleResponse>>> List(CancellationToken cancellationToken)
    {
        var roles = await _dbContext.Roles
            .OrderBy(r => r.Name)
            .Select(r => new RoleResponse(r.Id, r.Name, r.Description))
            .ToListAsync(cancellationToken);

        return Ok(roles);
    }

    [HttpGet("{id:guid}")]
    [HasPermission("roles:read")]
    public async Task<ActionResult<RoleResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (role is null)
        {
            return NotFound();
        }

        return Ok(new RoleResponse(role.Id, role.Name, role.Description));
    }

    [HttpGet("{id:guid}/permissions")]
    [HasPermission("roles:read")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetPermissions(Guid id, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles
            .Include(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (role is null)
        {
            return NotFound();
        }

        var permissionKeys = role.RolePermissions.Select(rp => rp.Permission.Key).ToList();
        return Ok(permissionKeys);
    }

    [HttpPut("{id:guid}/permissions")]
    [HasPermission("roles:update")]
    public async Task<IActionResult> AssignPermissions(Guid id, [FromBody] AssignPermissionsRequest request, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (role is null)
        {
            return NotFound();
        }

        var permissions = await _dbContext.Permissions
            .Where(p => request.PermissionKeys.Contains(p.Key))
            .ToListAsync(cancellationToken);

        _dbContext.RolePermissions.RemoveRange(role.RolePermissions);
        role.RolePermissions.Clear();

        foreach (var permission in permissions)
        {
            role.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true });
    }

    [HttpPost]
    [HasPermission("roles:create")]
    public async Task<ActionResult<RoleResponse>> Create([FromBody] CreateRoleRequest request, CancellationToken cancellationToken)
    {
        var role = new Role
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim()
        };

        await _dbContext.Roles.AddAsync(role, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = role.Id }, new RoleResponse(role.Id, role.Name, role.Description));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("roles:update")]
    public async Task<ActionResult<RoleResponse>> Update(Guid id, [FromBody] UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (role is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            role.Name = request.Name.Trim();
        }

        if (request.Description is not null)
        {
            role.Description = request.Description.Trim();
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new RoleResponse(role.Id, role.Name, role.Description));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("roles:delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (role is null)
        {
            return NotFound();
        }

        _dbContext.Roles.Remove(role);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
