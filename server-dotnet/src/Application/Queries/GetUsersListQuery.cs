using MediatR;

namespace UserManager.Application.Queries;

public record GetUsersListQuery(int Page, int Limit, string? Search, string? Status) : IRequest<PagedResult<UserListItem>>;

public record UserListItem(Guid Id, string Email, string FullName, string Status, IReadOnlyList<string> Roles);

public record PagedResult<T>(IReadOnlyList<T> Data, int Total, int Page, int Limit);
