using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Infrastructure.Services;

namespace UserManager.Application.Tests.Services;

public class NotificationServiceTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<NotificationService>> _loggerMock;
    private readonly NotificationService _notificationService;

    public NotificationServiceTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<NotificationService>>();

        _notificationService = new NotificationService(
            _dbContextMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object);
    }

    #region Helper Methods

    private static Mock<DbSet<T>> CreateMockDbSet<T>(List<T> data) where T : class
    {
        var queryable = data.AsQueryable();
        var mockDbSet = new Mock<DbSet<T>>();

        mockDbSet.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new NotificationTestAsyncEnumerator<T>(queryable.GetEnumerator()));

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.Provider)
            .Returns(new NotificationTestAsyncQueryProvider<T>(queryable.Provider));

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.Expression)
            .Returns(queryable.Expression);

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.ElementType)
            .Returns(queryable.ElementType);

        mockDbSet.As<IQueryable<T>>()
            .Setup(m => m.GetEnumerator())
            .Returns(() => queryable.GetEnumerator());

        mockDbSet.Setup(x => x.AddAsync(It.IsAny<T>(), It.IsAny<CancellationToken>()))
            .Callback<T, CancellationToken>((entity, ct) => data.Add(entity))
            .ReturnsAsync((T entity, CancellationToken ct) => null!);

        return mockDbSet;
    }

    private static User CreateTestUser(string email = "test@example.com", string fullName = "Test User")
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FullName = fullName,
            PasswordHash = "hashed-password"
        };
    }

    private static Role CreateTestRole(string name = "Admin")
    {
        return new Role
        {
            Id = Guid.NewGuid(),
            Name = name,
            RolePermissions = new List<RolePermission>()
        };
    }

    #endregion

    #region NotifyUserAsync Tests

    [Fact]
    public async Task NotifyUserAsync_ShouldCreateNotificationRecord()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser();
        user.Id = userId;

        var notifications = new List<Notification>();
        var users = new List<User> { user };

        var notificationsDbSet = CreateMockDbSet(notifications);
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Notifications).Returns(notificationsDbSet.Object);
        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        await _notificationService.NotifyUserAsync(
            userId,
            "info",
            "Test Title",
            "Test Message",
            CancellationToken.None);

        // Assert
        notifications.Should().HaveCount(1);
        var notification = notifications.First();
        notification.UserId.Should().Be(userId);
        notification.Type.Should().Be("info");
        notification.Title.Should().Be("Test Title");
        notification.Message.Should().Be("Test Message");
        notification.IsRead.Should().BeFalse();

        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task NotifyUserAsync_WithOptionalParams_ShouldCreateNotificationWithAllFields()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entityId = Guid.NewGuid();
        var user = CreateTestUser();
        user.Id = userId;

        var notifications = new List<Notification>();
        var users = new List<User> { user };

        var notificationsDbSet = CreateMockDbSet(notifications);
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Notifications).Returns(notificationsDbSet.Object);
        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        await _notificationService.NotifyUserAsync(
            userId,
            "warning",
            "Asset Created",
            "A new asset has been created",
            "/assets/123",
            "Asset",
            entityId,
            CancellationToken.None);

        // Assert
        notifications.Should().HaveCount(1);
        var notification = notifications.First();
        notification.ActionUrl.Should().Be("/assets/123");
        notification.RelatedEntityType.Should().Be("Asset");
        notification.RelatedEntityId.Should().Be(entityId);
    }

    [Fact]
    public async Task NotifyUserAsync_ShouldSendEmailToUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser("user@example.com");
        user.Id = userId;

        var notifications = new List<Notification>();
        var users = new List<User> { user };

        var notificationsDbSet = CreateMockDbSet(notifications);
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Notifications).Returns(notificationsDbSet.Object);
        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        await _notificationService.NotifyUserAsync(
            userId,
            "info",
            "Test Title",
            "Test Message",
            CancellationToken.None);

        // Assert
        _emailServiceMock.Verify(
            x => x.SendAsync(
                "user@example.com",
                "Test Title",
                "<p>Test Message</p>",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyUserAsync_WhenUserNotFound_ShouldNotSendEmail()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>();
        var users = new List<User>();

        var notificationsDbSet = CreateMockDbSet(notifications);
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Notifications).Returns(notificationsDbSet.Object);
        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        await _notificationService.NotifyUserAsync(
            userId,
            "info",
            "Test Title",
            "Test Message",
            CancellationToken.None);

        // Assert
        notifications.Should().HaveCount(1);
        _emailServiceMock.Verify(
            x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task NotifyUserAsync_WhenEmailFails_ShouldNotThrow()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser();
        user.Id = userId;

        var notifications = new List<Notification>();
        var users = new List<User> { user };

        var notificationsDbSet = CreateMockDbSet(notifications);
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.Notifications).Returns(notificationsDbSet.Object);
        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        _emailServiceMock
            .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Email service unavailable"));

        // Act
        var act = async () => await _notificationService.NotifyUserAsync(
            userId,
            "info",
            "Test Title",
            "Test Message",
            CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
        notifications.Should().HaveCount(1);
    }

    #endregion

    #region NotifyRoleAsync Tests

    [Fact]
    public async Task NotifyRoleAsync_ShouldNotifyAllUsersWithRole()
    {
        // Arrange
        var role = CreateTestRole("Admin");

        var user1 = CreateTestUser("user1@example.com", "User One");
        var user2 = CreateTestUser("user2@example.com", "User Two");
        var user3 = CreateTestUser("user3@example.com", "User Three");

        var userRoles = new List<UserRole>
        {
            new UserRole { UserId = user1.Id, User = user1, RoleId = role.Id, Role = role },
            new UserRole { UserId = user2.Id, User = user2, RoleId = role.Id, Role = role }
        };

        var notifications = new List<Notification>();
        var users = new List<User> { user1, user2, user3 };

        var userRolesDbSet = CreateMockDbSet(userRoles);
        var notificationsDbSet = CreateMockDbSet(notifications);
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.UserRoles).Returns(userRolesDbSet.Object);
        _dbContextMock.Setup(x => x.Notifications).Returns(notificationsDbSet.Object);
        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        await _notificationService.NotifyRoleAsync(
            "Admin",
            "info",
            "Admin Notification",
            "This is for admins only",
            CancellationToken.None);

        // Assert
        notifications.Should().HaveCount(2);
        notifications.Should().Contain(n => n.UserId == user1.Id);
        notifications.Should().Contain(n => n.UserId == user2.Id);
        notifications.Should().NotContain(n => n.UserId == user3.Id);
    }

    [Fact]
    public async Task NotifyRoleAsync_WhenNoUsersWithRole_ShouldNotCreateNotifications()
    {
        // Arrange
        var userRoles = new List<UserRole>();
        var notifications = new List<Notification>();

        var userRolesDbSet = CreateMockDbSet(userRoles);
        var notificationsDbSet = CreateMockDbSet(notifications);

        _dbContextMock.Setup(x => x.UserRoles).Returns(userRolesDbSet.Object);
        _dbContextMock.Setup(x => x.Notifications).Returns(notificationsDbSet.Object);

        // Act
        await _notificationService.NotifyRoleAsync(
            "NonExistentRole",
            "info",
            "Test Title",
            "Test Message",
            CancellationToken.None);

        // Assert
        notifications.Should().BeEmpty();
    }

    [Fact]
    public async Task NotifyRoleAsync_ShouldCreateNotificationsWithCorrectContent()
    {
        // Arrange
        var role = CreateTestRole("Manager");
        var user = CreateTestUser("manager@example.com", "Manager User");

        var userRoles = new List<UserRole>
        {
            new UserRole { UserId = user.Id, User = user, RoleId = role.Id, Role = role }
        };

        var notifications = new List<Notification>();
        var users = new List<User> { user };

        var userRolesDbSet = CreateMockDbSet(userRoles);
        var notificationsDbSet = CreateMockDbSet(notifications);
        var usersDbSet = CreateMockDbSet(users);

        _dbContextMock.Setup(x => x.UserRoles).Returns(userRolesDbSet.Object);
        _dbContextMock.Setup(x => x.Notifications).Returns(notificationsDbSet.Object);
        _dbContextMock.Setup(x => x.Users).Returns(usersDbSet.Object);

        // Act
        await _notificationService.NotifyRoleAsync(
            "Manager",
            "warning",
            "Important Update",
            "Please review the new policy",
            CancellationToken.None);

        // Assert
        notifications.Should().HaveCount(1);
        var notification = notifications.First();
        notification.Type.Should().Be("warning");
        notification.Title.Should().Be("Important Update");
        notification.Message.Should().Be("Please review the new policy");
    }

    #endregion
}

#region Notification Test Async Helpers

internal class NotificationTestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public NotificationTestAsyncEnumerator(IEnumerator<T> inner)
    {
        _inner = inner;
    }

    public T Current => _inner.Current;

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }

    public ValueTask<bool> MoveNextAsync()
    {
        return ValueTask.FromResult(_inner.MoveNext());
    }
}

internal class NotificationTestAsyncQueryProvider<T> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    public NotificationTestAsyncQueryProvider(IQueryProvider inner)
    {
        _inner = inner;
    }

    public IQueryable CreateQuery(Expression expression)
    {
        return new NotificationTestAsyncEnumerable<T>(expression);
    }

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        return new NotificationTestAsyncEnumerable<TElement>(expression);
    }

    public object? Execute(Expression expression)
    {
        return _inner.Execute(expression);
    }

    public TResult Execute<TResult>(Expression expression)
    {
        return _inner.Execute<TResult>(expression);
    }

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var expectedResultType = typeof(TResult).GetGenericArguments()[0];
        var executionResult = typeof(IQueryProvider)
            .GetMethod(
                name: nameof(IQueryProvider.Execute),
                genericParameterCount: 1,
                types: new[] { typeof(Expression) })!
            .MakeGenericMethod(expectedResultType)
            .Invoke(_inner, new[] { expression });

        return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))!
            .MakeGenericMethod(expectedResultType)
            .Invoke(null, new[] { executionResult })!;
    }
}

internal class NotificationTestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public NotificationTestAsyncEnumerable(IEnumerable<T> enumerable)
        : base(enumerable)
    {
    }

    public NotificationTestAsyncEnumerable(Expression expression)
        : base(expression)
    {
    }

    IQueryProvider IQueryable.Provider => new NotificationTestAsyncQueryProvider<T>(this);

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        return new NotificationTestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
    }
}

#endregion
