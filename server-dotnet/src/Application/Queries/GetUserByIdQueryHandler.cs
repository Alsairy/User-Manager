using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;

namespace UserManager.Application.Queries;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserResult?>
{
    private readonly IAppDbContext _dbContext;

    public GetUserByIdQueryHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserResult?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var isLockedOut = user.IsLockedOut(DateTimeOffset.UtcNow);

        return new UserResult(
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
