using MediatR;

namespace UserManager.Application.Queries;

public record GetUserByIdQuery(Guid UserId) : IRequest<UserResult?>;

public record UserResult(
    Guid Id,
    string Email,
    string FullName,
    string Status,
    IReadOnlyList<string> Roles,
    bool IsLockedOut,
    DateTimeOffset? LockoutEndAt,
    int FailedLoginAttempts);
