namespace UserManager.Application.Models.Auth;

public record UserProfileResponse(
    Guid Id,
    string Email,
    string FullName,
    IReadOnlyList<string> Roles);
