using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Infrastructure.Options;
using UserManager.Infrastructure.Services;

namespace UserManager.Application.Tests.Services;

public class JwtTokenServiceTests
{
    private readonly Mock<IOptions<JwtOptions>> _optionsMock;
    private readonly Mock<IDateTimeProvider> _dateTimeProviderMock;
    private readonly JwtTokenService _sut;
    private readonly JwtOptions _jwtOptions;
    private readonly DateTimeOffset _fixedTime;

    public JwtTokenServiceTests()
    {
        _jwtOptions = new JwtOptions
        {
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            SigningKey = "ThisIsAVeryLongSecretKeyForTestingPurposesOnly123456!",
            AccessTokenMinutes = 15,
            RefreshTokenDays = 7
        };

        _fixedTime = new DateTimeOffset(2024, 6, 15, 12, 0, 0, TimeSpan.Zero);

        _optionsMock = new Mock<IOptions<JwtOptions>>();
        _optionsMock.Setup(x => x.Value).Returns(_jwtOptions);

        _dateTimeProviderMock = new Mock<IDateTimeProvider>();
        _dateTimeProviderMock.Setup(x => x.UtcNow).Returns(_fixedTime);

        _sut = new JwtTokenService(_optionsMock.Object, _dateTimeProviderMock.Object);
    }

    #region CreateAccessToken Tests

    [Fact]
    public void CreateAccessToken_ShouldReturnValidJwtToken()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin", "User" };

        // Act
        var (accessToken, expiresAtUtc) = _sut.CreateAccessToken(user, roles);

        // Assert
        accessToken.Should().NotBeNullOrEmpty();
        var handler = new JwtSecurityTokenHandler();
        handler.CanReadToken(accessToken).Should().BeTrue();
    }

    [Fact]
    public void CreateAccessToken_ShouldContainCorrectSubjectClaim()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var claims = DecodeToken(accessToken);
        var subClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        subClaim.Should().NotBeNull();
        subClaim!.Value.Should().Be(user.Id.ToString());
    }

    [Fact]
    public void CreateAccessToken_ShouldContainCorrectEmailClaim()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var claims = DecodeToken(accessToken);
        var emailClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email);
        emailClaim.Should().NotBeNull();
        emailClaim!.Value.Should().Be(user.Email);
    }

    [Fact]
    public void CreateAccessToken_ShouldContainCorrectNameClaim()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var claims = DecodeToken(accessToken);
        var nameClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name);
        nameClaim.Should().NotBeNull();
        nameClaim!.Value.Should().Be(user.FullName);
    }

    [Fact]
    public void CreateAccessToken_ShouldContainAllRoleClaims()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "Admin", "Manager", "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var claims = DecodeToken(accessToken);
        var roleClaims = claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();
        roleClaims.Should().HaveCount(3);
        roleClaims.Should().Contain("Admin");
        roleClaims.Should().Contain("Manager");
        roleClaims.Should().Contain("User");
    }

    [Fact]
    public void CreateAccessToken_WithNoRoles_ShouldNotContainRoleClaims()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string>();

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var claims = DecodeToken(accessToken);
        var roleClaims = claims.Where(c => c.Type == ClaimTypes.Role).ToList();
        roleClaims.Should().BeEmpty();
    }

    [Fact]
    public void CreateAccessToken_WithPermissions_ShouldContainAllPermissionClaims()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };
        var permissions = new List<string> { "users.read", "users.write", "reports.view" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles, permissions);

        // Assert
        var claims = DecodeToken(accessToken);
        var permissionClaims = claims.Where(c => c.Type == "permission").Select(c => c.Value).ToList();
        permissionClaims.Should().HaveCount(3);
        permissionClaims.Should().Contain("users.read");
        permissionClaims.Should().Contain("users.write");
        permissionClaims.Should().Contain("reports.view");
    }

    [Fact]
    public void CreateAccessToken_WithNullPermissions_ShouldNotContainPermissionClaims()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles, permissions: null);

        // Assert
        var claims = DecodeToken(accessToken);
        var permissionClaims = claims.Where(c => c.Type == "permission").ToList();
        permissionClaims.Should().BeEmpty();
    }

    [Fact]
    public void CreateAccessToken_WithEmptyPermissions_ShouldNotContainPermissionClaims()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };
        var permissions = new List<string>();

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles, permissions);

        // Assert
        var claims = DecodeToken(accessToken);
        var permissionClaims = claims.Where(c => c.Type == "permission").ToList();
        permissionClaims.Should().BeEmpty();
    }

    [Fact]
    public void CreateAccessToken_ShouldSetCorrectExpiration()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };
        var expectedExpiration = _fixedTime.AddMinutes(_jwtOptions.AccessTokenMinutes);

        // Act
        var (accessToken, expiresAtUtc) = _sut.CreateAccessToken(user, roles);

        // Assert
        expiresAtUtc.Should().Be(expectedExpiration);
    }

    [Fact]
    public void CreateAccessToken_TokenShouldHaveCorrectExpirationInPayload()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(accessToken);
        var expectedExpiration = _fixedTime.AddMinutes(_jwtOptions.AccessTokenMinutes).UtcDateTime;

        // JWT exp claim has second precision
        token.ValidTo.Should().BeCloseTo(expectedExpiration, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void CreateAccessToken_ShouldSetCorrectIssuer()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(accessToken);
        token.Issuer.Should().Be(_jwtOptions.Issuer);
    }

    [Fact]
    public void CreateAccessToken_ShouldSetCorrectAudience()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(accessToken);
        token.Audiences.Should().Contain(_jwtOptions.Audience);
    }

    [Fact]
    public void CreateAccessToken_ShouldSetCorrectNotBeforeTime()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(accessToken);
        token.ValidFrom.Should().BeCloseTo(_fixedTime.UtcDateTime, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void CreateAccessToken_ShouldUseHmacSha256Algorithm()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new List<string> { "User" };

        // Act
        var (accessToken, _) = _sut.CreateAccessToken(user, roles);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(accessToken);
        token.Header.Alg.Should().Be("HS256");
    }

    #endregion

    #region CreateRefreshToken Tests

    [Fact]
    public void CreateRefreshToken_ShouldReturnNonEmptyToken()
    {
        // Arrange
        var ipAddress = "192.168.1.1";

        // Act
        var refreshToken = _sut.CreateRefreshToken(ipAddress);

        // Assert
        refreshToken.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void CreateRefreshToken_ShouldReturnBase64EncodedToken()
    {
        // Arrange
        var ipAddress = "192.168.1.1";

        // Act
        var refreshToken = _sut.CreateRefreshToken(ipAddress);

        // Assert
        var action = () => Convert.FromBase64String(refreshToken.Token);
        action.Should().NotThrow<FormatException>();
    }

    [Fact]
    public void CreateRefreshToken_ShouldReturn64ByteTokenWhenDecoded()
    {
        // Arrange
        var ipAddress = "192.168.1.1";

        // Act
        var refreshToken = _sut.CreateRefreshToken(ipAddress);

        // Assert
        var tokenBytes = Convert.FromBase64String(refreshToken.Token);
        tokenBytes.Length.Should().Be(64);
    }

    [Fact]
    public void CreateRefreshToken_ShouldSetCorrectExpiration()
    {
        // Arrange
        var ipAddress = "192.168.1.1";
        var expectedExpiration = _fixedTime.AddDays(_jwtOptions.RefreshTokenDays);

        // Act
        var refreshToken = _sut.CreateRefreshToken(ipAddress);

        // Assert
        refreshToken.ExpiresAt.Should().Be(expectedExpiration);
    }

    [Fact]
    public void CreateRefreshToken_ShouldSetCreatedByIp()
    {
        // Arrange
        var ipAddress = "10.0.0.1";

        // Act
        var refreshToken = _sut.CreateRefreshToken(ipAddress);

        // Assert
        refreshToken.CreatedByIp.Should().Be(ipAddress);
    }

    [Fact]
    public void CreateRefreshToken_WithNullIpAddress_ShouldSetNullCreatedByIp()
    {
        // Arrange
        string? ipAddress = null;

        // Act
        var refreshToken = _sut.CreateRefreshToken(ipAddress);

        // Assert
        refreshToken.CreatedByIp.Should().BeNull();
    }

    [Fact]
    public void CreateRefreshToken_ShouldGenerateUniqueTokens()
    {
        // Arrange
        var ipAddress = "192.168.1.1";
        var tokens = new HashSet<string>();

        // Act
        for (int i = 0; i < 100; i++)
        {
            var refreshToken = _sut.CreateRefreshToken(ipAddress);
            tokens.Add(refreshToken.Token);
        }

        // Assert
        tokens.Should().HaveCount(100, "all generated tokens should be unique");
    }

    [Fact]
    public void CreateRefreshToken_ShouldReturnSecureRandomToken()
    {
        // Arrange
        var ipAddress = "192.168.1.1";

        // Act
        var token1 = _sut.CreateRefreshToken(ipAddress);
        var token2 = _sut.CreateRefreshToken(ipAddress);

        // Assert
        token1.Token.Should().NotBe(token2.Token);
    }

    [Fact]
    public void CreateRefreshToken_TokenShouldHaveSufficientEntropy()
    {
        // Arrange
        var ipAddress = "192.168.1.1";

        // Act
        var refreshToken = _sut.CreateRefreshToken(ipAddress);

        // Assert
        // 64 bytes = 512 bits of entropy, base64 encoded should be ~88 characters
        // This verifies the token has sufficient length for security
        refreshToken.Token.Length.Should().BeGreaterThanOrEqualTo(80);
    }

    #endregion

    #region Helper Methods

    private static User CreateTestUser()
    {
        return new User
        {
            Id = Guid.Parse("12345678-1234-1234-1234-123456789012"),
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hashedpassword"
        };
    }

    private static IEnumerable<Claim> DecodeToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);
        return jwtToken.Claims;
    }

    #endregion
}
