namespace UserManager.Api.Models.Users;

public record UserResponse(
    Guid Id,
    string Email,
    string FullName,
    string Status,
    IReadOnlyList<string> Roles);
