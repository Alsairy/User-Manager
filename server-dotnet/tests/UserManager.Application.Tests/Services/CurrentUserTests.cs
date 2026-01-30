using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using UserManager.Infrastructure.Services;

namespace UserManager.Application.Tests.Services;

public class CurrentUserTests
{
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly CurrentUser _currentUser;

    public CurrentUserTests()
    {
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _currentUser = new CurrentUser(_httpContextAccessorMock.Object);
    }

    #region Helper Methods

    private void SetupHttpContextWithClaims(params Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, "TestAuthentication");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = claimsPrincipal
        };

        _httpContextAccessorMock
            .Setup(x => x.HttpContext)
            .Returns(httpContext);
    }

    private void SetupNullHttpContext()
    {
        _httpContextAccessorMock
            .Setup(x => x.HttpContext)
            .Returns((HttpContext?)null);
    }

    #endregion

    #region UserId Tests

    [Fact]
    public void UserId_WithValidGuidClaim_ShouldReturnGuid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()));

        // Act
        var result = _currentUser.UserId;

        // Assert
        result.Should().Be(userId);
    }

    [Fact]
    public void UserId_WithInvalidGuidClaim_ShouldReturnNull()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.NameIdentifier, "not-a-guid"));

        // Act
        var result = _currentUser.UserId;

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void UserId_WithNoNameIdentifierClaim_ShouldReturnNull()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.Email, "test@example.com"));

        // Act
        var result = _currentUser.UserId;

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void UserId_WhenHttpContextIsNull_ShouldReturnNull()
    {
        // Arrange
        SetupNullHttpContext();

        // Act
        var result = _currentUser.UserId;

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void UserId_WithEmptyStringClaim_ShouldReturnNull()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.NameIdentifier, string.Empty));

        // Act
        var result = _currentUser.UserId;

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region Email Tests

    [Fact]
    public void Email_WithValidEmailClaim_ShouldReturnEmail()
    {
        // Arrange
        var email = "test@example.com";
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.Email, email));

        // Act
        var result = _currentUser.Email;

        // Assert
        result.Should().Be(email);
    }

    [Fact]
    public void Email_WithNoEmailClaim_ShouldReturnNull()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()));

        // Act
        var result = _currentUser.Email;

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void Email_WhenHttpContextIsNull_ShouldReturnNull()
    {
        // Arrange
        SetupNullHttpContext();

        // Act
        var result = _currentUser.Email;

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void Email_WithEmptyEmailClaim_ShouldReturnEmptyString()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.Email, string.Empty));

        // Act
        var result = _currentUser.Email;

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region Roles Tests

    [Fact]
    public void Roles_WithSingleRoleClaim_ShouldReturnSingleRole()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.Role, "Admin"));

        // Act
        var result = _currentUser.Roles;

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain("Admin");
    }

    [Fact]
    public void Roles_WithMultipleRoleClaims_ShouldReturnAllRoles()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.Role, "User"),
            new Claim(ClaimTypes.Role, "Manager"));

        // Act
        var result = _currentUser.Roles;

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain("Admin");
        result.Should().Contain("User");
        result.Should().Contain("Manager");
    }

    [Fact]
    public void Roles_WithNoRoleClaims_ShouldReturnEmptyList()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.Email, "test@example.com"));

        // Act
        var result = _currentUser.Roles;

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public void Roles_WhenHttpContextIsNull_ShouldReturnEmptyList()
    {
        // Arrange
        SetupNullHttpContext();

        // Act
        var result = _currentUser.Roles;

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public void Roles_ShouldReturnReadOnlyList()
    {
        // Arrange
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.Role, "Admin"));

        // Act
        var result = _currentUser.Roles;

        // Assert
        result.Should().BeAssignableTo<IReadOnlyList<string>>();
    }

    #endregion

    #region Combined Tests

    [Fact]
    public void AllProperties_WithCompleteClaims_ShouldReturnCorrectValues()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var email = "user@example.com";
        SetupHttpContextWithClaims(
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.Role, "User"));

        // Act & Assert
        _currentUser.UserId.Should().Be(userId);
        _currentUser.Email.Should().Be(email);
        _currentUser.Roles.Should().HaveCount(2);
        _currentUser.Roles.Should().Contain("Admin");
        _currentUser.Roles.Should().Contain("User");
    }

    [Fact]
    public void AllProperties_WithNullHttpContext_ShouldReturnNullOrEmpty()
    {
        // Arrange
        SetupNullHttpContext();

        // Act & Assert
        _currentUser.UserId.Should().BeNull();
        _currentUser.Email.Should().BeNull();
        _currentUser.Roles.Should().BeEmpty();
    }

    [Fact]
    public void AllProperties_WithUnauthenticatedUser_ShouldHandleGracefully()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        // User property is not null but has no identity/claims

        _httpContextAccessorMock
            .Setup(x => x.HttpContext)
            .Returns(httpContext);

        // Act & Assert
        _currentUser.UserId.Should().BeNull();
        _currentUser.Email.Should().BeNull();
        _currentUser.Roles.Should().BeEmpty();
    }

    #endregion
}
