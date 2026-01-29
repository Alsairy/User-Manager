using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using UserManager.Application.Interfaces;
using UserManager.Infrastructure.Services;

namespace UserManager.Application.Tests.Services;

public class RedisCacheServiceTests
{
    private readonly Mock<IDistributedCache> _cacheMock;
    private readonly Mock<ILogger<RedisCacheService>> _loggerMock;
    private readonly RedisCacheService _cacheService;

    public RedisCacheServiceTests()
    {
        _cacheMock = new Mock<IDistributedCache>();
        _loggerMock = new Mock<ILogger<RedisCacheService>>();
        _cacheService = new RedisCacheService(_cacheMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetAsync_WhenKeyExists_ShouldReturnValue()
    {
        // Arrange
        var key = "test-key";
        var expectedValue = new TestClass { Name = "Test", Value = 42 };
        var json = JsonSerializer.Serialize(expectedValue, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        var bytes = Encoding.UTF8.GetBytes(json);

        // Mock the underlying GetAsync method that extension methods use
        _cacheMock.Setup(x => x.GetAsync(key, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bytes);

        // Act
        var result = await _cacheService.GetAsync<TestClass>(key);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Test");
        result.Value.Should().Be(42);
    }

    [Fact]
    public async Task GetAsync_WhenKeyDoesNotExist_ShouldReturnNull()
    {
        // Arrange
        var key = "nonexistent-key";
        _cacheMock.Setup(x => x.GetAsync(key, It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[]?)null);

        // Act
        var result = await _cacheService.GetAsync<TestClass>(key);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task SetAsync_ShouldStoreValue()
    {
        // Arrange
        var key = "test-key";
        var value = new TestClass { Name = "Test", Value = 42 };

        // Act
        await _cacheService.SetAsync(key, value);

        // Assert
        _cacheMock.Verify(x => x.SetAsync(
            key,
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SetAsync_WithExpiration_ShouldUseProvidedExpiration()
    {
        // Arrange
        var key = "test-key";
        var value = new TestClass { Name = "Test", Value = 42 };
        var expiration = TimeSpan.FromMinutes(10);
        DistributedCacheEntryOptions? capturedOptions = null;

        _cacheMock.Setup(x => x.SetAsync(key, It.IsAny<byte[]>(), It.IsAny<DistributedCacheEntryOptions>(), It.IsAny<CancellationToken>()))
            .Callback<string, byte[], DistributedCacheEntryOptions, CancellationToken>((k, v, o, ct) => capturedOptions = o)
            .Returns(Task.CompletedTask);

        // Act
        await _cacheService.SetAsync(key, value, expiration);

        // Assert
        capturedOptions.Should().NotBeNull();
        capturedOptions!.AbsoluteExpirationRelativeToNow.Should().Be(expiration);
    }

    [Fact]
    public async Task GetOrSetAsync_WhenCacheHit_ShouldReturnCachedValue()
    {
        // Arrange
        var key = "test-key";
        var cachedValue = new TestClass { Name = "Cached", Value = 100 };
        var json = JsonSerializer.Serialize(cachedValue, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        var bytes = Encoding.UTF8.GetBytes(json);

        _cacheMock.Setup(x => x.GetAsync(key, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bytes);

        var factoryCalled = false;

        // Act
        var result = await _cacheService.GetOrSetAsync(key, async () =>
        {
            factoryCalled = true;
            return new TestClass { Name = "Fresh", Value = 200 };
        });

        // Assert
        result.Name.Should().Be("Cached");
        result.Value.Should().Be(100);
        factoryCalled.Should().BeFalse();
    }

    [Fact]
    public async Task GetOrSetAsync_WhenCacheMiss_ShouldCallFactoryAndCache()
    {
        // Arrange
        var key = "test-key";
        _cacheMock.Setup(x => x.GetAsync(key, It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[]?)null);

        var factoryCalled = false;
        var freshValue = new TestClass { Name = "Fresh", Value = 200 };

        // Act
        var result = await _cacheService.GetOrSetAsync(key, async () =>
        {
            factoryCalled = true;
            return freshValue;
        });

        // Assert
        result.Name.Should().Be("Fresh");
        result.Value.Should().Be(200);
        factoryCalled.Should().BeTrue();

        _cacheMock.Verify(x => x.SetAsync(
            key,
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_ShouldRemoveKey()
    {
        // Arrange
        var key = "test-key";

        // Act
        await _cacheService.RemoveAsync(key);

        // Assert
        _cacheMock.Verify(x => x.RemoveAsync(key, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAsync_WhenCacheThrows_ShouldReturnNullAndLog()
    {
        // Arrange
        var key = "test-key";
        _cacheMock.Setup(x => x.GetAsync(key, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Cache error"));

        // Act
        var result = await _cacheService.GetAsync<TestClass>(key);

        // Assert
        result.Should().BeNull();
    }

    private class TestClass
    {
        public string Name { get; set; } = string.Empty;
        public int Value { get; set; }
    }
}

public class CacheKeysTests
{
    [Fact]
    public void CacheKeys_ShouldHaveCorrectStaticValues()
    {
        CacheKeys.DashboardStats.Should().Be("dashboard:stats");
        CacheKeys.ReferenceRegions.Should().Be("reference:regions");
        CacheKeys.ReferenceCities.Should().Be("reference:cities");
        CacheKeys.ReferenceDistricts.Should().Be("reference:districts");
        CacheKeys.AllPermissions.Should().Be("permissions:all");
    }

    [Fact]
    public void UserPermissions_ShouldGenerateCorrectKey()
    {
        var userId = Guid.Parse("12345678-1234-1234-1234-123456789012");
        var key = CacheKeys.UserPermissions(userId);
        key.Should().Be("user:12345678-1234-1234-1234-123456789012:permissions");
    }

    [Fact]
    public void UserRoles_ShouldGenerateCorrectKey()
    {
        var userId = Guid.Parse("12345678-1234-1234-1234-123456789012");
        var key = CacheKeys.UserRoles(userId);
        key.Should().Be("user:12345678-1234-1234-1234-123456789012:roles");
    }

    [Fact]
    public void RolePermissions_ShouldGenerateCorrectKey()
    {
        var roleId = Guid.Parse("87654321-4321-4321-4321-210987654321");
        var key = CacheKeys.RolePermissions(roleId);
        key.Should().Be("role:87654321-4321-4321-4321-210987654321:permissions");
    }
}

public class CacheDurationsTests
{
    [Fact]
    public void CacheDurations_ShouldHaveCorrectValues()
    {
        CacheDurations.Short.Should().Be(TimeSpan.FromMinutes(5));
        CacheDurations.Medium.Should().Be(TimeSpan.FromMinutes(30));
        CacheDurations.Long.Should().Be(TimeSpan.FromHours(1));
        CacheDurations.VeryLong.Should().Be(TimeSpan.FromHours(24));
    }
}
