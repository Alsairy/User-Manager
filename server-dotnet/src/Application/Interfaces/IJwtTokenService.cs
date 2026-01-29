using UserManager.Domain.Entities;

namespace UserManager.Application.Interfaces;

public interface IJwtTokenService
{
    (string AccessToken, DateTimeOffset ExpiresAtUtc) CreateAccessToken(
        User user,
        IReadOnlyList<string> roles,
        IReadOnlyList<string>? permissions = null);
    RefreshToken CreateRefreshToken(string? ipAddress);
}
