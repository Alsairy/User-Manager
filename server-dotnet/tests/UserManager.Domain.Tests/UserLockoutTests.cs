using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Tests;

public class UserLockoutTests
{
    [Fact]
    public void NewUser_ShouldNotBeLockedOut()
    {
        var user = new User();
        var currentTime = DateTimeOffset.UtcNow;

        user.IsLockedOut(currentTime).Should().BeFalse();
        user.FailedLoginAttempts.Should().Be(0);
        user.LockoutEndAt.Should().BeNull();
    }

    [Fact]
    public void RecordFailedLogin_ShouldIncrementAttempts()
    {
        var user = new User();
        var currentTime = DateTimeOffset.UtcNow;

        user.RecordFailedLogin(currentTime);

        user.FailedLoginAttempts.Should().Be(1);
        user.LastFailedLoginAt.Should().Be(currentTime);
        user.IsLockedOut(currentTime).Should().BeFalse();
    }

    [Fact]
    public void RecordFailedLogin_AfterMaxAttempts_ShouldLockAccount()
    {
        var user = new User();
        var currentTime = DateTimeOffset.UtcNow;
        var maxAttempts = 5;
        var lockoutMinutes = 15;

        for (int i = 0; i < maxAttempts; i++)
        {
            user.RecordFailedLogin(currentTime, maxAttempts, lockoutMinutes);
        }

        user.FailedLoginAttempts.Should().Be(maxAttempts);
        user.IsLockedOut(currentTime).Should().BeTrue();
        user.LockoutEndAt.Should().Be(currentTime.AddMinutes(lockoutMinutes));
    }

    [Fact]
    public void IsLockedOut_AfterLockoutExpires_ShouldReturnFalse()
    {
        var user = new User();
        var lockoutTime = DateTimeOffset.UtcNow;
        var lockoutMinutes = 15;

        // Lock the account
        for (int i = 0; i < 5; i++)
        {
            user.RecordFailedLogin(lockoutTime, 5, lockoutMinutes);
        }

        // Check at time after lockout expires
        var afterLockout = lockoutTime.AddMinutes(lockoutMinutes + 1);
        user.IsLockedOut(afterLockout).Should().BeFalse();
    }

    [Fact]
    public void IsLockedOut_DuringLockout_ShouldReturnTrue()
    {
        var user = new User();
        var lockoutTime = DateTimeOffset.UtcNow;
        var lockoutMinutes = 15;

        // Lock the account
        for (int i = 0; i < 5; i++)
        {
            user.RecordFailedLogin(lockoutTime, 5, lockoutMinutes);
        }

        // Check at time during lockout
        var duringLockout = lockoutTime.AddMinutes(10);
        user.IsLockedOut(duringLockout).Should().BeTrue();
    }

    [Fact]
    public void ResetFailedLoginAttempts_ShouldClearAllLockoutData()
    {
        var user = new User();
        var currentTime = DateTimeOffset.UtcNow;

        // Lock the account
        for (int i = 0; i < 5; i++)
        {
            user.RecordFailedLogin(currentTime);
        }

        // Reset
        user.ResetFailedLoginAttempts();

        user.FailedLoginAttempts.Should().Be(0);
        user.LockoutEndAt.Should().BeNull();
        user.LastFailedLoginAt.Should().BeNull();
        user.IsLockedOut(currentTime).Should().BeFalse();
    }

    [Theory]
    [InlineData(3, 10)]
    [InlineData(5, 15)]
    [InlineData(10, 30)]
    public void RecordFailedLogin_WithCustomMaxAttempts_ShouldRespectThreshold(int maxAttempts, int lockoutMinutes)
    {
        var user = new User();
        var currentTime = DateTimeOffset.UtcNow;

        // Record one less than max attempts
        for (int i = 0; i < maxAttempts - 1; i++)
        {
            user.RecordFailedLogin(currentTime, maxAttempts, lockoutMinutes);
        }

        user.IsLockedOut(currentTime).Should().BeFalse();

        // One more should lock it
        user.RecordFailedLogin(currentTime, maxAttempts, lockoutMinutes);
        user.IsLockedOut(currentTime).Should().BeTrue();
    }
}
