using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Application.Models.Auth;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTimeProvider _timeProvider;

    public AuthService(
        IAppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IDateTimeProvider timeProvider)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _timeProvider = timeProvider;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user is null || user.Status != UserStatus.Active || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        user.LastLoginAt = _timeProvider.UtcNow;
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Key)
            .Distinct()
            .ToList();

        var (accessToken, expiresAt) = _jwtTokenService.CreateAccessToken(user, roles, permissions);
        var refreshToken = _jwtTokenService.CreateRefreshToken(ipAddress);
        refreshToken.UserId = user.Id;

        await _dbContext.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, expiresAt, refreshToken.Token);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var existing = await _dbContext.RefreshTokens
            .Include(rt => rt.User)
            .ThenInclude(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken);

        if (existing is null || existing.RevokedAt is not null || existing.ExpiresAt <= _timeProvider.UtcNow)
        {
            throw new InvalidOperationException("Invalid refresh token.");
        }

        existing.RevokedAt = _timeProvider.UtcNow;
        existing.RevokedByIp = ipAddress;

        var user = existing.User;
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Key)
            .Distinct()
            .ToList();

        var (accessToken, expiresAt) = _jwtTokenService.CreateAccessToken(user, roles, permissions);
        var newRefreshToken = _jwtTokenService.CreateRefreshToken(ipAddress);
        newRefreshToken.UserId = user.Id;
        existing.ReplacedByToken = newRefreshToken.Token;

        await _dbContext.RefreshTokens.AddAsync(newRefreshToken, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponse(accessToken, expiresAt, newRefreshToken.Token);
    }

    public async Task<UserProfileResponse> GetProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        return new UserProfileResponse(user.Id, user.Email, user.FullName, roles);
    }

    public async Task LogoutAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken)
    {
        var existing = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);

        if (existing is null || existing.RevokedAt is not null)
        {
            return;
        }

        existing.RevokedAt = _timeProvider.UtcNow;
        existing.RevokedByIp = ipAddress;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
