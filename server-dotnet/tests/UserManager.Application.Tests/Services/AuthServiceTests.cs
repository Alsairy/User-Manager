using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Application.Models.Auth;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Infrastructure.Services;

namespace UserManager.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
    private readonly Mock<IDateTimeProvider> _dateTimeProviderMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly AuthService _authService;
    private readonly DateTimeOffset _currentTime;

    public AuthServiceTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtTokenServiceMock = new Mock<IJwtTokenService>();
        _dateTimeProviderMock = new Mock<IDateTimeProvider>();
        _loggerMock = new Mock<ILogger<AuthService>>();

        _currentTime = new DateTimeOffset(2024, 1, 15, 12, 0, 0, TimeSpan.Zero);
        _dateTimeProviderMock.Setup(x => x.UtcNow).Returns(_currentTime);

        _authService = new AuthService(
            _dbContextMock.Object,
            _passwordHasherMock.Object,
            _jwtTokenServiceMock.Object,
            _dateTimeProviderMock.Object,
            _loggerMock.Object);
    }

    #region Helper Methods

    private static User CreateTestUser(
        string email = "test@example.com",
        string fullName = "Test User",
        string passwordHash = "hashed-password",
        UserStatus status = UserStatus.Active,
        int failedLoginAttempts = 0,
        DateTimeOffset? lockoutEndAt = null)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FullName = fullName,
            PasswordHash = passwordHash,
            Status = status,
            FailedLoginAttempts = failedLoginAttempts,
            LockoutEndAt = lockoutEndAt,
            UserRoles = new List<UserRole>()
        };
        return user;
    }

    private static User CreateUserWithRolesAndPermissions(
        string email = "test@example.com",
        string fullName = "Test User",
        UserStatus status = UserStatus.Active)
    {
        var permission = new Permission
        {
            Id = Guid.NewGuid(),
            Key = "users.read"
        };

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = "Admin",
            RolePermissions = new List<RolePermission>
            {
                new RolePermission { Permission = permission, PermissionId = permission.Id }
            }
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FullName = fullName,
            PasswordHash = "hashed-password",
            Status = status,
            UserRoles = new List<UserRole>
            {
                new UserRole { Role = role, RoleId = role.Id }
            }
        };

        return user;
    }

    private static RefreshToken CreateRefreshToken(
        User user,
        string token = "valid-refresh-token",
        DateTimeOffset? expiresAt = null,
        DateTimeOffset? revokedAt = null)
    {
        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Token = token,
            ExpiresAt = expiresAt ?? DateTimeOffset.UtcNow.AddDays(7),
            RevokedAt = revokedAt,
            CreatedByIp = "127.0.0.1"
        };
    }

    private Mock<DbSet<T>> CreateMockDbSet<T>(List<T> data) where T : class
    {
        var queryable = data.AsQueryable();
        var mockDbSet = new Mock<DbSet<T>>();

        mockDbSet.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<T>(queryable.GetEnumerator()));

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.Provider)
            .Returns(new TestAsyncQueryProvider<T>(queryable.Provider));

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.Expression)
            .Returns(queryable.Expression);

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.ElementType)
            .Returns(queryable.ElementType);

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.GetEnumerator())
            .Returns(() => queryable.GetEnumerator());

        mockDbSet.Setup(x => x.AddAsync(It.IsAny<T>(), It.IsAny<CancellationToken>()))
            .Callback<T, CancellationToken>((entity, ct) => data.Add(entity))
            .ReturnsAsync((T entity, CancellationToken ct) => null!);

        return mockDbSet;
    }

    private void SetupJwtTokenServiceForLogin()
    {
        _jwtTokenServiceMock
            .Setup(x => x.CreateAccessToken(
                It.IsAny<User>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<IReadOnlyList<string>?>()))
            .Returns(("access-token", _currentTime.AddHours(1)));

        _jwtTokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<string?>()))
            .Returns(new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = "new-refresh-token",
                ExpiresAt = _currentTime.AddDays(7),
                CreatedByIp = "127.0.0.1"
            });
    }

    #endregion

    #region LoginAsync Tests

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnAuthResponse()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        var users = new List<User> { user };
        var refreshTokens = new List<RefreshToken>();

        var usersDbSet = CreateMockDbSet(users);
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);
        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        _passwordHasherMock.Setup(x => x.Verify("correct-password", "hashed-password")).Returns(true);
        SetupJwtTokenServiceForLogin();

        var request = new LoginRequest(user.Email, "correct-password");

        // Act
        var result = await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("new-refresh-token");
        result.AccessTokenExpiresAtUtc.Should().Be(_currentTime.AddHours(1));

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        user.LastLoginAt.Should().Be(_currentTime);
        user.FailedLoginAttempts.Should().Be(0);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ShouldThrowAndRecordFailedAttempt()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        var users = new List<User> { user };
        var refreshTokens = new List<RefreshToken>();

        var usersDbSet = CreateMockDbSet(users);
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);
        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        _passwordHasherMock.Setup(x => x.Verify("wrong-password", "hashed-password")).Returns(false);

        var request = new LoginRequest(user.Email, "wrong-password");

        // Act
        var act = async () => await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid credentials.");

        user.FailedLoginAttempts.Should().Be(1);
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentUser_ShouldThrow()
    {
        // Arrange
        var users = new List<User>();
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        var request = new LoginRequest("nonexistent@example.com", "password");

        // Act
        var act = async () => await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid credentials.");
    }

    [Fact]
    public async Task LoginAsync_WithLockedOutUser_ShouldThrow()
    {
        // Arrange
        var user = CreateTestUser(
            lockoutEndAt: _currentTime.AddMinutes(10),
            failedLoginAttempts: 5);

        var users = new List<User> { user };
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        var request = new LoginRequest(user.Email, "password");

        // Act
        var act = async () => await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Account is temporarily locked. Please try again later.");
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ShouldThrow()
    {
        // Arrange
        var user = CreateTestUser(status: UserStatus.Inactive);
        var users = new List<User> { user };
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        var request = new LoginRequest(user.Email, "password");

        // Act
        var act = async () => await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid credentials.");
    }

    [Fact]
    public async Task LoginAsync_WithPendingUser_ShouldThrow()
    {
        // Arrange
        var user = CreateTestUser(status: UserStatus.Pending);
        var users = new List<User> { user };
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        var request = new LoginRequest(user.Email, "password");

        // Act
        var act = async () => await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid credentials.");
    }

    [Fact]
    public async Task LoginAsync_FailedAttemptTracking_ShouldLockAfterMaxAttempts()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        user.FailedLoginAttempts = 4; // One more attempt will trigger lockout
        var users = new List<User> { user };
        var refreshTokens = new List<RefreshToken>();

        var usersDbSet = CreateMockDbSet(users);
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);
        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        _passwordHasherMock.Setup(x => x.Verify("wrong-password", "hashed-password")).Returns(false);

        var request = new LoginRequest(user.Email, "wrong-password");

        // Act
        var act = async () => await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid credentials.");

        user.FailedLoginAttempts.Should().Be(5);
        user.LockoutEndAt.Should().NotBeNull();
        user.LockoutEndAt.Should().Be(_currentTime.AddMinutes(15));
    }

    [Fact]
    public async Task LoginAsync_SuccessfulLogin_ShouldResetFailedAttempts()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        user.FailedLoginAttempts = 3;
        user.LastFailedLoginAt = _currentTime.AddMinutes(-5);

        var users = new List<User> { user };
        var refreshTokens = new List<RefreshToken>();

        var usersDbSet = CreateMockDbSet(users);
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);
        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        _passwordHasherMock.Setup(x => x.Verify("correct-password", "hashed-password")).Returns(true);
        SetupJwtTokenServiceForLogin();

        var request = new LoginRequest(user.Email, "correct-password");

        // Act
        await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        user.FailedLoginAttempts.Should().Be(0);
        user.LockoutEndAt.Should().BeNull();
        user.LastFailedLoginAt.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_ShouldExtractRolesAndPermissions()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        var users = new List<User> { user };
        var refreshTokens = new List<RefreshToken>();

        var usersDbSet = CreateMockDbSet(users);
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);
        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        _passwordHasherMock.Setup(x => x.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        IReadOnlyList<string>? capturedRoles = null;
        IReadOnlyList<string>? capturedPermissions = null;

        _jwtTokenServiceMock
            .Setup(x => x.CreateAccessToken(
                It.IsAny<User>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<IReadOnlyList<string>?>()))
            .Callback<User, IReadOnlyList<string>, IReadOnlyList<string>?>((u, r, p) =>
            {
                capturedRoles = r;
                capturedPermissions = p;
            })
            .Returns(("access-token", _currentTime.AddHours(1)));

        _jwtTokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<string?>()))
            .Returns(new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = "refresh-token",
                ExpiresAt = _currentTime.AddDays(7)
            });

        var request = new LoginRequest(user.Email, "password");

        // Act
        await _authService.LoginAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        capturedRoles.Should().NotBeNull();
        capturedRoles.Should().Contain("Admin");
        capturedPermissions.Should().NotBeNull();
        capturedPermissions.Should().Contain("users.read");
    }

    #endregion

    #region RefreshAsync Tests

    [Fact]
    public async Task RefreshAsync_WithValidToken_ShouldReturnNewTokens()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        var existingToken = CreateRefreshToken(user, "valid-token", _currentTime.AddDays(7));

        var refreshTokens = new List<RefreshToken> { existingToken };
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        SetupJwtTokenServiceForLogin();

        var request = new RefreshRequest("valid-token");

        // Act
        var result = await _authService.RefreshAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("new-refresh-token");

        existingToken.RevokedAt.Should().Be(_currentTime);
        existingToken.RevokedByIp.Should().Be("127.0.0.1");
        existingToken.ReplacedByToken.Should().Be("new-refresh-token");

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_WithExpiredToken_ShouldThrow()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        var expiredToken = CreateRefreshToken(user, "expired-token", _currentTime.AddDays(-1));

        var refreshTokens = new List<RefreshToken> { expiredToken };
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        var request = new RefreshRequest("expired-token");

        // Act
        var act = async () => await _authService.RefreshAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid refresh token.");
    }

    [Fact]
    public async Task RefreshAsync_WithRevokedToken_ShouldThrowAndRevokeAllUserTokens()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        var revokedToken = CreateRefreshToken(
            user, "revoked-token",
            _currentTime.AddDays(7),
            _currentTime.AddDays(-1));

        var activeToken = CreateRefreshToken(user, "active-token", _currentTime.AddDays(7));

        var refreshTokens = new List<RefreshToken> { revokedToken, activeToken };
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        var request = new RefreshRequest("revoked-token");

        // Act
        var act = async () => await _authService.RefreshAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid refresh token.");

        // The active token should be revoked as a security measure
        activeToken.RevokedAt.Should().NotBeNull();
        activeToken.ReasonRevoked.Should().Contain("Security");
    }

    [Fact]
    public async Task RefreshAsync_WithNonExistentToken_ShouldThrow()
    {
        // Arrange
        var refreshTokens = new List<RefreshToken>();
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        var request = new RefreshRequest("nonexistent-token");

        // Act
        var act = async () => await _authService.RefreshAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid refresh token.");
    }

    [Fact]
    public async Task RefreshAsync_WithInactiveUser_ShouldThrowAndRevokeToken()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        user.Status = UserStatus.Inactive;

        var token = CreateRefreshToken(user, "valid-token", _currentTime.AddDays(7));

        var refreshTokens = new List<RefreshToken> { token };
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        var request = new RefreshRequest("valid-token");

        // Act
        var act = async () => await _authService.RefreshAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid refresh token.");

        token.RevokedAt.Should().Be(_currentTime);
        token.RevokedByIp.Should().Be("127.0.0.1");
    }

    [Fact]
    public async Task RefreshAsync_WithLockedOutUser_ShouldThrowAndRevokeToken()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        user.LockoutEndAt = _currentTime.AddMinutes(10);

        var token = CreateRefreshToken(user, "valid-token", _currentTime.AddDays(7));

        var refreshTokens = new List<RefreshToken> { token };
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        var request = new RefreshRequest("valid-token");

        // Act
        var act = async () => await _authService.RefreshAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Account is temporarily locked.");

        token.RevokedAt.Should().Be(_currentTime);
    }

    [Fact]
    public async Task RefreshAsync_ShouldExtractRolesAndPermissionsFromUser()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions();
        var existingToken = CreateRefreshToken(user, "valid-token", _currentTime.AddDays(7));

        var refreshTokens = new List<RefreshToken> { existingToken };
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        IReadOnlyList<string>? capturedRoles = null;
        IReadOnlyList<string>? capturedPermissions = null;

        _jwtTokenServiceMock
            .Setup(x => x.CreateAccessToken(
                It.IsAny<User>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<IReadOnlyList<string>?>()))
            .Callback<User, IReadOnlyList<string>, IReadOnlyList<string>?>((u, r, p) =>
            {
                capturedRoles = r;
                capturedPermissions = p;
            })
            .Returns(("access-token", _currentTime.AddHours(1)));

        _jwtTokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<string?>()))
            .Returns(new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = "new-refresh-token",
                ExpiresAt = _currentTime.AddDays(7)
            });

        var request = new RefreshRequest("valid-token");

        // Act
        await _authService.RefreshAsync(request, "127.0.0.1", CancellationToken.None);

        // Assert
        capturedRoles.Should().NotBeNull();
        capturedRoles.Should().Contain("Admin");
        capturedPermissions.Should().NotBeNull();
        capturedPermissions.Should().Contain("users.read");
    }

    #endregion

    #region LogoutAsync Tests

    [Fact]
    public async Task LogoutAsync_WithValidToken_ShouldRevokeToken()
    {
        // Arrange
        var user = CreateTestUser();
        var token = CreateRefreshToken(user, "valid-token", _currentTime.AddDays(7));

        var refreshTokens = new List<RefreshToken> { token };
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        // Act
        await _authService.LogoutAsync("valid-token", "127.0.0.1", CancellationToken.None);

        // Assert
        token.RevokedAt.Should().Be(_currentTime);
        token.RevokedByIp.Should().Be("127.0.0.1");
        token.ReasonRevoked.Should().Be("User logout");

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LogoutAsync_WithNonExistentToken_ShouldNotThrow()
    {
        // Arrange
        var refreshTokens = new List<RefreshToken>();
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        // Act
        var act = async () => await _authService.LogoutAsync("nonexistent-token", "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task LogoutAsync_WithAlreadyRevokedToken_ShouldNotThrowOrSave()
    {
        // Arrange
        var user = CreateTestUser();
        var token = CreateRefreshToken(
            user, "revoked-token",
            _currentTime.AddDays(7),
            _currentTime.AddDays(-1));

        var refreshTokens = new List<RefreshToken> { token };
        var refreshTokensDbSet = CreateMockDbSet(refreshTokens);

        _dbContextMock.Setup(x => x.RefreshTokens).Returns(refreshTokensDbSet.Object);

        // Act
        var act = async () => await _authService.LogoutAsync("revoked-token", "127.0.0.1", CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region GetProfileAsync Tests

    [Fact]
    public async Task GetProfileAsync_WithExistingUser_ShouldReturnProfile()
    {
        // Arrange
        var user = CreateUserWithRolesAndPermissions(
            email: "user@example.com",
            fullName: "John Doe");

        var users = new List<User> { user };
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        var result = await _authService.GetProfileAsync(user.Id, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(user.Id);
        result.Email.Should().Be("user@example.com");
        result.FullName.Should().Be("John Doe");
        result.Roles.Should().Contain("Admin");
    }

    [Fact]
    public async Task GetProfileAsync_WithNonExistentUser_ShouldThrow()
    {
        // Arrange
        var users = new List<User>();
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        var nonExistentUserId = Guid.NewGuid();

        // Act
        var act = async () => await _authService.GetProfileAsync(nonExistentUserId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("User not found.");
    }

    [Fact]
    public async Task GetProfileAsync_ShouldReturnMultipleRoles()
    {
        // Arrange
        var role1 = new Role { Id = Guid.NewGuid(), Name = "Admin", RolePermissions = new List<RolePermission>() };
        var role2 = new Role { Id = Guid.NewGuid(), Name = "User", RolePermissions = new List<RolePermission>() };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            FullName = "Multi Role User",
            PasswordHash = "hashed",
            Status = UserStatus.Active,
            UserRoles = new List<UserRole>
            {
                new UserRole { Role = role1, RoleId = role1.Id },
                new UserRole { Role = role2, RoleId = role2.Id }
            }
        };

        var users = new List<User> { user };
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        var result = await _authService.GetProfileAsync(user.Id, CancellationToken.None);

        // Assert
        result.Roles.Should().HaveCount(2);
        result.Roles.Should().Contain("Admin");
        result.Roles.Should().Contain("User");
    }

    [Fact]
    public async Task GetProfileAsync_WithUserHavingNoRoles_ShouldReturnEmptyRoles()
    {
        // Arrange
        var user = CreateTestUser();
        user.UserRoles = new List<UserRole>();

        var users = new List<User> { user };
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        var result = await _authService.GetProfileAsync(user.Id, CancellationToken.None);

        // Assert
        result.Roles.Should().BeEmpty();
    }

    #endregion
}

#region Test Async Helpers

internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public TestAsyncEnumerator(IEnumerator<T> inner)
    {
        _inner = inner;
    }

    public T Current => _inner.Current;

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }

    public ValueTask<bool> MoveNextAsync()
    {
        return ValueTask.FromResult(_inner.MoveNext());
    }
}

internal class TestAsyncQueryProvider<T> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    public TestAsyncQueryProvider(IQueryProvider inner)
    {
        _inner = inner;
    }

    public IQueryable CreateQuery(Expression expression)
    {
        return new TestAsyncEnumerable<T>(expression);
    }

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        return new TestAsyncEnumerable<TElement>(expression);
    }

    public object? Execute(Expression expression)
    {
        return _inner.Execute(expression);
    }

    public TResult Execute<TResult>(Expression expression)
    {
        return _inner.Execute<TResult>(expression);
    }

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var expectedResultType = typeof(TResult).GetGenericArguments()[0];
        var executionResult = typeof(IQueryProvider)
            .GetMethod(
                name: nameof(IQueryProvider.Execute),
                genericParameterCount: 1,
                types: new[] { typeof(Expression) })!
            .MakeGenericMethod(expectedResultType)
            .Invoke(_inner, new[] { expression });

        return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))!
            .MakeGenericMethod(expectedResultType)
            .Invoke(null, new[] { executionResult })!;
    }
}

internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public TestAsyncEnumerable(IEnumerable<T> enumerable)
        : base(enumerable)
    {
    }

    public TestAsyncEnumerable(Expression expression)
        : base(expression)
    {
    }

    IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
    }
}

#endregion
