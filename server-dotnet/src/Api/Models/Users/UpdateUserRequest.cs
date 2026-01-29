namespace UserManager.Api.Models.Users;

public record UpdateUserRequest(
    string? FullName,
    string? Status);
