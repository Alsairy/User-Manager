using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Interfaces;
using UserManager.Application.Queries;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Application.Tests.Queries;

public class GetUserByIdQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly GetUserByIdQueryHandler _handler;

    public GetUserByIdQueryHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new GetUserByIdQueryHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_UserFound_ReturnsCorrectDataWithRoles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var role = new Role { Id = roleId, Name = "Admin" };
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Test User",
            Status = UserStatus.Active,
            FailedLoginAttempts = 0,
            LockoutEndAt = null,
            UserRoles = new List<UserRole>
            {
                new UserRole { UserId = userId, RoleId = roleId, Role = role }
            }
        };

        var users = new List<User> { user };
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUserByIdQuery(userId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);
        result.Email.Should().Be("test@example.com");
        result.FullName.Should().Be("Test User");
        result.Status.Should().Be("Active");
        result.Roles.Should().ContainSingle().Which.Should().Be("Admin");
        result.IsLockedOut.Should().BeFalse();
        result.LockoutEndAt.Should().BeNull();
        result.FailedLoginAttempts.Should().Be(0);
    }

    [Fact]
    public async Task Handle_UserFound_ReturnsMultipleRoles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var adminRoleId = Guid.NewGuid();
        var userRoleId = Guid.NewGuid();
        var adminRole = new Role { Id = adminRoleId, Name = "Admin" };
        var userRole = new Role { Id = userRoleId, Name = "User" };
        var user = new User
        {
            Id = userId,
            Email = "multi.role@example.com",
            FullName = "Multi Role User",
            Status = UserStatus.Active,
            UserRoles = new List<UserRole>
            {
                new UserRole { UserId = userId, RoleId = adminRoleId, Role = adminRole },
                new UserRole { UserId = userId, RoleId = userRoleId, Role = userRole }
            }
        };

        var users = new List<User> { user };
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUserByIdQuery(userId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Roles.Should().HaveCount(2);
        result.Roles.Should().Contain("Admin");
        result.Roles.Should().Contain("User");
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNull()
    {
        // Arrange
        var nonExistentUserId = Guid.NewGuid();
        var users = new List<User>();
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUserByIdQuery(nonExistentUserId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_UserIsLockedOut_ReturnsIsLockedOutTrue()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(10); // Locked out for 10 more minutes
        var user = new User
        {
            Id = userId,
            Email = "locked@example.com",
            FullName = "Locked User",
            Status = UserStatus.Active,
            FailedLoginAttempts = 5,
            LockoutEndAt = lockoutEnd,
            UserRoles = new List<UserRole>()
        };

        var users = new List<User> { user };
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUserByIdQuery(userId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.IsLockedOut.Should().BeTrue();
        result.LockoutEndAt.Should().Be(lockoutEnd);
        result.FailedLoginAttempts.Should().Be(5);
    }

    [Fact]
    public async Task Handle_UserLockoutExpired_ReturnsIsLockedOutFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(-5); // Lockout expired 5 minutes ago
        var user = new User
        {
            Id = userId,
            Email = "unlocked@example.com",
            FullName = "Unlocked User",
            Status = UserStatus.Active,
            FailedLoginAttempts = 5,
            LockoutEndAt = lockoutEnd,
            UserRoles = new List<UserRole>()
        };

        var users = new List<User> { user };
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUserByIdQuery(userId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.IsLockedOut.Should().BeFalse();
        result.LockoutEndAt.Should().Be(lockoutEnd);
        result.FailedLoginAttempts.Should().Be(5);
    }

    [Fact]
    public async Task Handle_UserWithNoRoles_ReturnsEmptyRolesList()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "noroles@example.com",
            FullName = "No Roles User",
            Status = UserStatus.Pending,
            UserRoles = new List<UserRole>()
        };

        var users = new List<User> { user };
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUserByIdQuery(userId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Roles.Should().BeEmpty();
        result.Status.Should().Be("Pending");
    }

    [Fact]
    public async Task Handle_UserWithDifferentStatuses_ReturnsCorrectStatusString()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "inactive@example.com",
            FullName = "Inactive User",
            Status = UserStatus.Inactive,
            UserRoles = new List<UserRole>()
        };

        var users = new List<User> { user };
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUserByIdQuery(userId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be("Inactive");
    }
}
