using UserManager.Domain.Entities;

namespace UserManager.Domain.Tests;

public class RefreshTokenTests
{
    [Fact]
    public void NewRefreshToken_ShouldHaveDefaultValues()
    {
        var token = new RefreshToken();

        token.Token.Should().BeEmpty();
        token.RevokedAt.Should().BeNull();
        token.ReplacedByToken.Should().BeNull();
        token.ReasonRevoked.Should().BeNull();
    }

    [Fact]
    public void IsActive_WhenNotRevokedAndNotExpired_ShouldReturnTrue()
    {
        var token = new RefreshToken
        {
            Token = "test-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            RevokedAt = null
        };

        token.IsActive.Should().BeTrue();
    }

    [Fact]
    public void IsActive_WhenRevoked_ShouldReturnFalse()
    {
        var token = new RefreshToken
        {
            Token = "test-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            RevokedAt = DateTimeOffset.UtcNow
        };

        token.IsActive.Should().BeFalse();
    }

    [Fact]
    public void IsActive_WhenExpired_ShouldReturnFalse()
    {
        var token = new RefreshToken
        {
            Token = "test-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1),
            RevokedAt = null
        };

        token.IsActive.Should().BeFalse();
    }

    [Fact]
    public void IsActive_WhenExpiredAndRevoked_ShouldReturnFalse()
    {
        var token = new RefreshToken
        {
            Token = "test-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1),
            RevokedAt = DateTimeOffset.UtcNow.AddDays(-2)
        };

        token.IsActive.Should().BeFalse();
    }

    [Fact]
    public void RefreshToken_ShouldStoreAllProperties()
    {
        var userId = Guid.NewGuid();
        var expiresAt = DateTimeOffset.UtcNow.AddDays(7);
        var revokedAt = DateTimeOffset.UtcNow;

        var token = new RefreshToken
        {
            UserId = userId,
            Token = "test-token-123",
            ExpiresAt = expiresAt,
            RevokedAt = revokedAt,
            ReplacedByToken = "new-token-456",
            CreatedByIp = "192.168.1.1",
            RevokedByIp = "192.168.1.2",
            ReasonRevoked = "User logout"
        };

        token.UserId.Should().Be(userId);
        token.Token.Should().Be("test-token-123");
        token.ExpiresAt.Should().Be(expiresAt);
        token.RevokedAt.Should().Be(revokedAt);
        token.ReplacedByToken.Should().Be("new-token-456");
        token.CreatedByIp.Should().Be("192.168.1.1");
        token.RevokedByIp.Should().Be("192.168.1.2");
        token.ReasonRevoked.Should().Be("User logout");
    }
}
