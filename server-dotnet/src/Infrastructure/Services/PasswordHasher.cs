using Microsoft.AspNetCore.Identity;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;

namespace UserManager.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    private readonly IPasswordHasher<User> _hasher = new PasswordHasher<User>();

    public string Hash(string password)
    {
        var user = new User();
        return _hasher.HashPassword(user, password);
    }

    public bool Verify(string password, string passwordHash)
    {
        var user = new User { PasswordHash = passwordHash };
        var result = _hasher.VerifyHashedPassword(user, passwordHash, password);
        return result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}
