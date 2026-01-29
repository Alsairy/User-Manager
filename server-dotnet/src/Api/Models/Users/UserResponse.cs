namespace UserManager.Api.Models.Users;

public record UserResponse(
    Guid Id,
    string Email,
    string FullName,
    string Status,
    IReadOnlyList<string> Roles,
    bool IsLockedOut = false,
    DateTimeOffset? LockoutEndAt = null,
    int FailedLoginAttempts = 0);
