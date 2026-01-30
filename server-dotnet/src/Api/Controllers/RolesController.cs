using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Api.Models.Roles;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;

namespace UserManager.Api.Controllers;

/// <summary>
/// Manages roles and their associated permissions.
/// Roles are used to group permissions and assign them to users for access control.
/// </summary>
[ApiController]
[Route("api/v1/roles")]
[Authorize]
[Produces("application/json")]
[Tags("Roles")]
public class RolesController : ControllerBase
{
    private readonly IAppDbContext _dbContext;
    private readonly ICacheService _cacheService;

    /// <summary>
    /// Initializes a new instance of the RolesController.
    /// </summary>
    /// <param name="dbContext">The application database context.</param>
    /// <param name="cacheService">The cache service for invalidating user permissions.</param>
    public RolesController(IAppDbContext dbContext, ICacheService cacheService)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
    }

    /// <summary>
    /// Retrieves all roles in the system.
    /// </summary>
    /// <remarks>
    /// Returns a list of all available roles ordered alphabetically by name.
    /// </remarks>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A list of all roles.</returns>
    /// <response code="200">Returns the list of roles.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'roles:read' permission.</response>
    [HttpGet]
    [HasPermission("roles:read")]
    [ProducesResponseType(typeof(IReadOnlyList<RoleResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<RoleResponse>>> List(CancellationToken cancellationToken)
    {
        var roles = await _dbContext.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new RoleResponse(r.Id, r.Name, r.Description))
            .ToListAsync(cancellationToken);

        return Ok(roles);
    }

    /// <summary>
    /// Retrieves a specific role by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the role.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The role details.</returns>
    /// <response code="200">Returns the role details.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'roles:read' permission.</response>
    /// <response code="404">If the role with the specified ID was not found.</response>
    [HttpGet("{id:guid}")]
    [HasPermission("roles:read")]
    [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (role is null)
        {
            return NotFound();
        }

        return Ok(new RoleResponse(role.Id, role.Name, role.Description));
    }

    /// <summary>
    /// Retrieves all permissions assigned to a specific role.
    /// </summary>
    /// <remarks>
    /// Returns a list of permission keys (e.g., "users:read", "roles:update") assigned to the role.
    /// </remarks>
    /// <param name="id">The unique identifier of the role.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A list of permission keys assigned to the role.</returns>
    /// <response code="200">Returns the list of permission keys.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'roles:read' permission.</response>
    /// <response code="404">If the role with the specified ID was not found.</response>
    [HttpGet("{id:guid}/permissions")]
    [HasPermission("roles:read")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<string>>> GetPermissions(Guid id, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles
            .AsNoTracking()
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

    /// <summary>
    /// Assigns permissions to a role, replacing any existing permissions.
    /// </summary>
    /// <remarks>
    /// This operation replaces all existing permissions on the role with the provided list.
    /// To add permissions without removing existing ones, first retrieve the current permissions
    /// and include them in the request.
    ///
    /// Sample request:
    ///
    ///     PUT /api/v1/roles/{id}/permissions
    ///     {
    ///         "permissionKeys": ["users:read", "users:create", "roles:read"]
    ///     }
    ///
    /// </remarks>
    /// <param name="id">The unique identifier of the role.</param>
    /// <param name="request">The request containing the list of permission keys to assign.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A success indicator.</returns>
    /// <response code="200">Permissions were successfully assigned.</response>
    /// <response code="400">If the request is invalid.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'roles:update' permission.</response>
    /// <response code="404">If the role with the specified ID was not found.</response>
    [HttpPut("{id:guid}/permissions")]
    [HasPermission("roles:update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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

        // Invalidate cached permissions for all users with this role
        var affectedUserIds = await _dbContext.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == id)
            .Select(ur => ur.UserId)
            .ToListAsync(cancellationToken);

        foreach (var userId in affectedUserIds)
        {
            await _cacheService.RemoveAsync(CacheKeys.UserPermissions(userId), cancellationToken);
        }

        // Also invalidate the role-specific permissions cache
        await _cacheService.RemoveAsync(CacheKeys.RolePermissions(id), cancellationToken);

        return Ok(new { success = true });
    }

    /// <summary>
    /// Creates a new role.
    /// </summary>
    /// <remarks>
    /// Creates a new role with the specified name and optional description.
    /// The role will have no permissions assigned initially.
    ///
    /// Sample request:
    ///
    ///     POST /api/v1/roles
    ///     {
    ///         "name": "ContentEditor",
    ///         "description": "Can manage content but not users"
    ///     }
    ///
    /// </remarks>
    /// <param name="request">The role creation request.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The newly created role.</returns>
    /// <response code="201">Returns the newly created role.</response>
    /// <response code="400">If the request is invalid (e.g., duplicate name).</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'roles:create' permission.</response>
    [HttpPost]
    [HasPermission("roles:create")]
    [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
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

    /// <summary>
    /// Updates an existing role.
    /// </summary>
    /// <remarks>
    /// Updates the role's name and/or description. Permissions are managed separately via the permissions endpoint.
    ///
    /// Sample request:
    ///
    ///     PUT /api/v1/roles/{id}
    ///     {
    ///         "name": "UpdatedRoleName",
    ///         "description": "Updated description"
    ///     }
    ///
    /// </remarks>
    /// <param name="id">The unique identifier of the role to update.</param>
    /// <param name="request">The role update request.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The updated role.</returns>
    /// <response code="200">Returns the updated role.</response>
    /// <response code="400">If the request is invalid.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'roles:update' permission.</response>
    /// <response code="404">If the role with the specified ID was not found.</response>
    [HttpPut("{id:guid}")]
    [HasPermission("roles:update")]
    [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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

    /// <summary>
    /// Deletes a role.
    /// </summary>
    /// <remarks>
    /// Permanently deletes the role. Users assigned to this role will lose the associated permissions.
    /// Consider reassigning users to another role before deletion.
    /// </remarks>
    /// <param name="id">The unique identifier of the role to delete.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>No content on successful deletion.</returns>
    /// <response code="204">The role was successfully deleted.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'roles:delete' permission.</response>
    /// <response code="404">If the role with the specified ID was not found.</response>
    [HttpDelete("{id:guid}")]
    [HasPermission("roles:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
