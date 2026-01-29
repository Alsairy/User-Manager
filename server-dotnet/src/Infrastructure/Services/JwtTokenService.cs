using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Infrastructure.Options;

namespace UserManager.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;
    private readonly IDateTimeProvider _timeProvider;

    public JwtTokenService(IOptions<JwtOptions> options, IDateTimeProvider timeProvider)
    {
        _options = options.Value;
        _timeProvider = timeProvider;
    }

    public (string AccessToken, DateTimeOffset ExpiresAtUtc) CreateAccessToken(
        User user,
        IReadOnlyList<string> roles,
        IReadOnlyList<string>? permissions = null)
    {
        var now = _timeProvider.UtcNow;
        var expires = now.AddMinutes(_options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        if (permissions != null)
        {
            claims.AddRange(permissions.Select(p => new Claim("permission", p)));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expires.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public RefreshToken CreateRefreshToken(string? ipAddress)
    {
        var tokenBytes = new byte[64];
        RandomNumberGenerator.Fill(tokenBytes);
        var token = Convert.ToBase64String(tokenBytes);

        return new RefreshToken
        {
            Token = token,
            ExpiresAt = _timeProvider.UtcNow.AddDays(_options.RefreshTokenDays),
            CreatedByIp = ipAddress
        };
    }
}
