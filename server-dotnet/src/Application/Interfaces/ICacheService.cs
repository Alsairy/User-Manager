namespace UserManager.Application.Interfaces;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
}

public static class CacheKeys
{
    public const string DashboardStats = "dashboard:stats";
    public const string ReferenceRegions = "reference:regions";
    public const string ReferenceCities = "reference:cities";
    public const string ReferenceDistricts = "reference:districts";
    public const string AllPermissions = "permissions:all";

    public static string UserPermissions(Guid userId) => $"user:{userId}:permissions";
    public static string UserRoles(Guid userId) => $"user:{userId}:roles";
    public static string RolePermissions(Guid roleId) => $"role:{roleId}:permissions";
}

public static class CacheDurations
{
    public static readonly TimeSpan Short = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan Medium = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan Long = TimeSpan.FromHours(1);
    public static readonly TimeSpan VeryLong = TimeSpan.FromHours(24);
}
