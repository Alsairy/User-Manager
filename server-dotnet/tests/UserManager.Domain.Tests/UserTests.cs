using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Tests;

public class UserTests
{
    [Fact]
    public void NewUser_ShouldHaveDefaultStatus()
    {
        var user = new User();
        user.Status.Should().Be(UserStatus.Pending);
    }

    [Fact]
    public void NewUser_ShouldHaveEmptyCollections()
    {
        var user = new User();
        user.UserRoles.Should().BeEmpty();
        user.RefreshTokens.Should().BeEmpty();
    }

    [Fact]
    public void User_ShouldStoreProperties()
    {
        var user = new User
        {
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hash123",
            Status = UserStatus.Active
        };

        user.Email.Should().Be("test@example.com");
        user.FullName.Should().Be("Test User");
        user.PasswordHash.Should().Be("hash123");
        user.Status.Should().Be(UserStatus.Active);
    }
}
