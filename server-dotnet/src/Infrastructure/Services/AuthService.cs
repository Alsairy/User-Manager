using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<AuthService> _logger;

    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;

    public AuthService(
        IAppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IDateTimeProvider timeProvider,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _timeProvider = timeProvider;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        var currentTime = _timeProvider.UtcNow;

        // Check if user exists
        if (user is null)
        {
            _logger.LogWarning("Login attempt for non-existent email from IP {IpAddress}", ipAddress);
            throw new InvalidOperationException("Invalid credentials.");
        }

        // Check if account is locked out
        if (user.IsLockedOut(currentTime))
        {
            var remainingLockout = user.LockoutEndAt!.Value - currentTime;
            _logger.LogWarning(
                "Login attempt for locked account {UserId} from IP {IpAddress}. Lockout ends in {Minutes} minutes",
                user.Id, ipAddress, (int)remainingLockout.TotalMinutes + 1);
            throw new InvalidOperationException("Account is temporarily locked. Please try again later.");
        }

        // Validate status and password
        if (user.Status != UserStatus.Active)
        {
            _logger.LogWarning("Login attempt for inactive account {UserId} (status: {Status}) from IP {IpAddress}",
                user.Id, user.Status, ipAddress);
            throw new InvalidOperationException("Invalid credentials.");
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            // Record failed attempt
            user.RecordFailedLogin(currentTime, MaxFailedAttempts, LockoutMinutes);
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogWarning(
                "Failed login attempt {AttemptNumber}/{MaxAttempts} for user {UserId} from IP {IpAddress}",
                user.FailedLoginAttempts, MaxFailedAttempts, user.Id, ipAddress);

            if (user.IsLockedOut(currentTime))
            {
                _logger.LogWarning(
                    "Account {UserId} has been locked out for {Minutes} minutes due to too many failed attempts",
                    user.Id, LockoutMinutes);
            }

            throw new InvalidOperationException("Invalid credentials.");
        }

        // Successful login - reset failed attempts
        user.ResetFailedLoginAttempts();
        user.LastLoginAt = currentTime;

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

        _logger.LogInformation("User {UserId} logged in successfully from IP {IpAddress}", user.Id, ipAddress);

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

        var currentTime = _timeProvider.UtcNow;

        if (existing is null)
        {
            _logger.LogWarning("Token refresh attempt with non-existent token from IP {IpAddress}", ipAddress);
            throw new InvalidOperationException("Invalid refresh token.");
        }

        if (existing.RevokedAt is not null)
        {
            // Token was already revoked - possible token theft attempt
            _logger.LogWarning(
                "Token refresh attempt with revoked token for user {UserId} from IP {IpAddress}. Token was revoked at {RevokedAt}",
                existing.UserId, ipAddress, existing.RevokedAt);

            // Revoke all tokens for this user as a security measure
            await RevokeAllUserTokensAsync(existing.UserId, ipAddress, "Security: Revoked token reuse detected", cancellationToken);

            throw new InvalidOperationException("Invalid refresh token.");
        }

        if (existing.ExpiresAt <= currentTime)
        {
            _logger.LogWarning("Token refresh attempt with expired token for user {UserId} from IP {IpAddress}", existing.UserId, ipAddress);
            throw new InvalidOperationException("Invalid refresh token.");
        }

        var user = existing.User;

        // Check if user is still active
        if (user.Status != UserStatus.Active)
        {
            _logger.LogWarning("Token refresh attempt for inactive user {UserId} from IP {IpAddress}", user.Id, ipAddress);
            existing.RevokedAt = currentTime;
            existing.RevokedByIp = ipAddress;
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Invalid refresh token.");
        }

        // Check if user is locked out
        if (user.IsLockedOut(currentTime))
        {
            _logger.LogWarning("Token refresh attempt for locked out user {UserId} from IP {IpAddress}", user.Id, ipAddress);
            existing.RevokedAt = currentTime;
            existing.RevokedByIp = ipAddress;
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Account is temporarily locked.");
        }

        existing.RevokedAt = currentTime;
        existing.RevokedByIp = ipAddress;

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

        _logger.LogDebug("Token refreshed for user {UserId} from IP {IpAddress}", user.Id, ipAddress);

        return new AuthResponse(accessToken, expiresAt, newRefreshToken.Token);
    }

    private async Task RevokeAllUserTokensAsync(Guid userId, string? ipAddress, string reason, CancellationToken cancellationToken)
    {
        var activeTokens = await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null && rt.ExpiresAt > _timeProvider.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = _timeProvider.UtcNow;
            token.RevokedByIp = ipAddress;
            token.ReasonRevoked = reason;
        }

        _logger.LogWarning("Revoked {Count} active tokens for user {UserId}. Reason: {Reason}", activeTokens.Count, userId, reason);
        await _dbContext.SaveChangesAsync(cancellationToken);
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
            _logger.LogDebug("Logout attempt with invalid or already-revoked token from IP {IpAddress}", ipAddress);
            return;
        }

        existing.RevokedAt = _timeProvider.UtcNow;
        existing.RevokedByIp = ipAddress;
        existing.ReasonRevoked = "User logout";
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {UserId} logged out from IP {IpAddress}", existing.UserId, ipAddress);
    }
}
