namespace UserManager.Api.Models.Users;

public record CreateUserRequest(
    string Email,
    string FullName,
    string Password,
    string? Role);
