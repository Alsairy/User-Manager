using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;

namespace UserManager.Application.Queries;

public class GetUsersListQueryHandler : IRequestHandler<GetUsersListQuery, PagedResult<UserListItem>>
{
    private readonly IAppDbContext _dbContext;

    public GetUsersListQueryHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<UserListItem>> Handle(GetUsersListQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(u => u.Email.ToLower().Contains(search) || u.FullName.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<UserStatus>(request.Status, true, out var status))
        {
            query = query.Where(u => u.Status == status);
        }

        var total = await query.CountAsync(cancellationToken);
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.Limit)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        var items = users.Select(u => new UserListItem(
            u.Id,
            u.Email,
            u.FullName,
            u.Status.ToString(),
            u.UserRoles.Select(ur => ur.Role.Name).ToList()
        )).ToList();

        return new PagedResult<UserListItem>(items, total, request.Page, request.Limit);
    }
}
