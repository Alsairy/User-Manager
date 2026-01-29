using UserManager.Domain.Common;
using UserManager.Domain.Enums;

namespace UserManager.Domain.Entities;

public class User : EntityBase
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserStatus Status { get; set; } = UserStatus.Pending;
    public DateTimeOffset? LastLoginAt { get; set; }

    // Account lockout properties
    public int FailedLoginAttempts { get; set; }
    public DateTimeOffset? LockoutEndAt { get; set; }
    public DateTimeOffset? LastFailedLoginAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public bool IsLockedOut(DateTimeOffset currentTime)
    {
        return LockoutEndAt.HasValue && LockoutEndAt.Value > currentTime;
    }

    public void RecordFailedLogin(DateTimeOffset currentTime, int maxAttempts = 5, int lockoutMinutes = 15)
    {
        FailedLoginAttempts++;
        LastFailedLoginAt = currentTime;

        if (FailedLoginAttempts >= maxAttempts)
        {
            LockoutEndAt = currentTime.AddMinutes(lockoutMinutes);
        }
    }

    public void ResetFailedLoginAttempts()
    {
        FailedLoginAttempts = 0;
        LockoutEndAt = null;
        LastFailedLoginAt = null;
    }
}
