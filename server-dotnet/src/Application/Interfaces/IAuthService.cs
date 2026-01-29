using UserManager.Application.Models.Auth;

namespace UserManager.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<AuthResponse> RefreshAsync(RefreshRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<UserProfileResponse> GetProfileAsync(Guid userId, CancellationToken cancellationToken);
    Task LogoutAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken);
}
