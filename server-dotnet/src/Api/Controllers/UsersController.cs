using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserManager.Api.Authorization;
using UserManager.Api.Models.Users;
using UserManager.Application.Commands;
using UserManager.Application.Interfaces;
using UserManager.Application.Queries;
using UserManager.Domain.Entities;
using PagedResult = UserManager.Application.Queries.PagedResult<UserManager.Api.Models.Users.UserResponse>;

namespace UserManager.Api.Controllers;

/// <summary>
/// Manages user accounts including creation, retrieval, updates, and deletion.
/// All endpoints require authentication and appropriate permissions.
/// </summary>
[ApiController]
[Route("api/v1/users")]
[Authorize]
[Produces("application/json")]
[Tags("Users")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _dbContext;

    /// <summary>
    /// Initializes a new instance of the UsersController.
    /// </summary>
    /// <param name="mediator">The MediatR mediator for handling commands and queries.</param>
    /// <param name="dbContext">The application database context.</param>
    public UsersController(IMediator mediator, IAppDbContext dbContext)
    {
        _mediator = mediator;
        _dbContext = dbContext;
    }

    /// <summary>
    /// Retrieves a paginated list of users with optional filtering.
    /// </summary>
    /// <remarks>
    /// This endpoint returns a paginated list of users. You can filter by search term and status.
    ///
    /// Sample request:
    ///
    ///     GET /api/v1/users?page=1&amp;limit=20&amp;search=john&amp;status=active
    ///
    /// </remarks>
    /// <param name="page">The page number (1-based). Defaults to 1.</param>
    /// <param name="limit">The number of items per page. Defaults to 20.</param>
    /// <param name="search">Optional search term to filter by email or name.</param>
    /// <param name="status">Optional status filter (e.g., "Active", "Inactive", "Suspended").</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A paginated list of users.</returns>
    /// <response code="200">Returns the paginated list of users.</response>
    /// <response code="400">If the query parameters are invalid.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'users:read' permission.</response>
    [HttpGet]
    [HasPermission("users:read")]
    [ProducesResponseType(typeof(PagedResult<UserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<UserResponse>>> List(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetUsersListQuery(page, limit, search, status), cancellationToken);
        var items = result.Data.Select(u => new UserResponse(
            u.Id, u.Email, u.FullName, u.Status, u.Roles, false, null, 0)).ToList();
        return Ok(new PagedResult<UserResponse>(items, result.Total, result.Page, result.Limit));
    }

    /// <summary>
    /// Retrieves a specific user by their unique identifier.
    /// </summary>
    /// <remarks>
    /// Returns detailed information about a single user including their roles and lockout status.
    /// </remarks>
    /// <param name="id">The unique identifier of the user.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The user details.</returns>
    /// <response code="200">Returns the user details.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'users:read' permission.</response>
    /// <response code="404">If the user with the specified ID was not found.</response>
    [HttpGet("{id:guid}")]
    [HasPermission("users:read")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetUserByIdQuery(id), cancellationToken);
        if (result is null)
        {
            return NotFound();
        }

        return Ok(MapFromResult(result));
    }

    /// <summary>
    /// Creates a new user account.
    /// </summary>
    /// <remarks>
    /// Creates a new user with the specified email, name, password, and role.
    /// The email must be unique across all users.
    ///
    /// Sample request:
    ///
    ///     POST /api/v1/users
    ///     {
    ///         "email": "newuser@example.com",
    ///         "fullName": "John Doe",
    ///         "password": "SecurePassword123!",
    ///         "role": "User"
    ///     }
    ///
    /// </remarks>
    /// <param name="request">The user creation request.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The newly created user.</returns>
    /// <response code="201">Returns the newly created user.</response>
    /// <response code="400">If the request is invalid (e.g., duplicate email, weak password).</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'users:create' permission.</response>
    [HttpPost]
    [HasPermission("users:create")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateUserCommand(
            request.Email.Trim(),
            request.FullName.Trim(),
            request.Password,
            request.Role);

        var userId = await _mediator.Send(command, cancellationToken);

        var user = await _mediator.Send(new GetUserByIdQuery(userId), cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = userId }, MapFromResult(user!));
    }

    /// <summary>
    /// Updates an existing user's information.
    /// </summary>
    /// <remarks>
    /// Updates the user's full name and/or status. Email cannot be changed after creation.
    ///
    /// Sample request:
    ///
    ///     PUT /api/v1/users/{id}
    ///     {
    ///         "fullName": "Jane Doe Updated",
    ///         "status": "Inactive"
    ///     }
    ///
    /// </remarks>
    /// <param name="id">The unique identifier of the user to update.</param>
    /// <param name="request">The user update request.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The updated user.</returns>
    /// <response code="200">Returns the updated user.</response>
    /// <response code="400">If the request is invalid.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'users:update' permission.</response>
    /// <response code="404">If the user with the specified ID was not found.</response>
    [HttpPut("{id:guid}")]
    [HasPermission("users:update")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateUserCommand(id, request.FullName, request.Status);
        var success = await _mediator.Send(command, cancellationToken);

        if (!success)
        {
            return NotFound();
        }

        var user = await _mediator.Send(new GetUserByIdQuery(id), cancellationToken);
        return Ok(MapFromResult(user!));
    }

    /// <summary>
    /// Deletes a user account.
    /// </summary>
    /// <remarks>
    /// Permanently deletes the user account. This action cannot be undone.
    /// Consider deactivating the user instead if you may need to restore access later.
    /// </remarks>
    /// <param name="id">The unique identifier of the user to delete.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>No content on successful deletion.</returns>
    /// <response code="204">The user was successfully deleted.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'users:delete' permission.</response>
    /// <response code="404">If the user with the specified ID was not found.</response>
    [HttpDelete("{id:guid}")]
    [HasPermission("users:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var success = await _mediator.Send(new DeleteUserCommand(id), cancellationToken);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    /// <summary>
    /// Unlocks a locked user account.
    /// </summary>
    /// <remarks>
    /// Resets the failed login attempts counter and removes any lockout on the user account.
    /// Use this endpoint when a user has been locked out due to too many failed login attempts.
    /// </remarks>
    /// <param name="id">The unique identifier of the user to unlock.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The unlocked user.</returns>
    /// <response code="200">Returns the unlocked user.</response>
    /// <response code="401">If the user is not authenticated.</response>
    /// <response code="403">If the user lacks the 'users:update' permission.</response>
    /// <response code="404">If the user with the specified ID was not found.</response>
    [HttpPost("{id:guid}/unlock")]
    [HasPermission("users:update")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> Unlock(Guid id, CancellationToken cancellationToken)
    {
        // Unlock still uses direct DbContext for the specific unlock operation
        var user = await _dbContext.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        user.ResetFailedLoginAttempts();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapUser(user));
    }

    private static UserResponse MapFromResult(UserResult result)
    {
        return new UserResponse(
            result.Id,
            result.Email,
            result.FullName,
            result.Status,
            result.Roles,
            result.IsLockedOut,
            result.LockoutEndAt,
            result.FailedLoginAttempts);
    }

    private static UserResponse MapUser(User user)
    {
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var isLockedOut = user.IsLockedOut(DateTimeOffset.UtcNow);
        return new UserResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.Status.ToString(),
            roles,
            isLockedOut,
            user.LockoutEndAt,
            user.FailedLoginAttempts);
    }
}
