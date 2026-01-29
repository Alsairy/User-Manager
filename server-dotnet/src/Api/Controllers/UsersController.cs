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

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _dbContext;

    public UsersController(IMediator mediator, IAppDbContext dbContext)
    {
        _mediator = mediator;
        _dbContext = dbContext;
    }

    [HttpGet]
    [HasPermission("users:read")]
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

    [HttpGet("{id:guid}")]
    [HasPermission("users:read")]
    public async Task<ActionResult<UserResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetUserByIdQuery(id), cancellationToken);
        if (result is null)
        {
            return NotFound();
        }

        return Ok(MapFromResult(result));
    }

    [HttpPost]
    [HasPermission("users:create")]
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

    [HttpPut("{id:guid}")]
    [HasPermission("users:update")]
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

    [HttpDelete("{id:guid}")]
    [HasPermission("users:delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var success = await _mediator.Send(new DeleteUserCommand(id), cancellationToken);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/unlock")]
    [HasPermission("users:update")]
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
