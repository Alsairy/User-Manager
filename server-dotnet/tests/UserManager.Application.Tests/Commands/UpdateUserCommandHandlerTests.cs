using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Commands;
using UserManager.Application.Interfaces;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Tests.Commands;

public class UpdateUserCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly UpdateUserCommandHandler _handler;

    public UpdateUserCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new UpdateUserCommandHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_ExistingUser_ShouldUpdateFullName()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Old Name",
            PasswordHash = "hashed",
            Status = UserStatus.Active
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, "New Name", null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        user.FullName.Should().Be("New Name");
        user.UpdatedAt.Should().NotBeNull();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ExistingUser_ShouldUpdateStatus()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hashed",
            Status = UserStatus.Pending
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, null, "Active");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        user.Status.Should().Be(UserStatus.Active);
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_StatusChange_ShouldRaiseDomainEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hashed",
            Status = UserStatus.Pending
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, null, "Active");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        user.DomainEvents.Should().ContainSingle();
        var domainEvent = user.DomainEvents.First() as UserStatusChangedEvent;
        domainEvent.Should().NotBeNull();
        domainEvent!.UserId.Should().Be(userId);
        domainEvent.OldStatus.Should().Be("Pending");
        domainEvent.NewStatus.Should().Be("Active");
    }

    [Fact]
    public async Task Handle_SameStatus_ShouldNotRaiseDomainEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hashed",
            Status = UserStatus.Active
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, null, "Active");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        user.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_UpdateBothFields_ShouldUpdateBoth()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Old Name",
            PasswordHash = "hashed",
            Status = UserStatus.Pending
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, "New Name", "Active");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        user.FullName.Should().Be("New Name");
        user.Status.Should().Be(UserStatus.Active);
    }

    [Fact]
    public async Task Handle_NonExistingUser_ShouldReturnFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var users = new List<User>();

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, "New Name", "Active");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_InvalidStatus_ShouldNotUpdateStatus()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hashed",
            Status = UserStatus.Pending
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, null, "InvalidStatus");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        user.Status.Should().Be(UserStatus.Pending); // Status should remain unchanged
        user.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WhitespaceFullName_ShouldNotUpdateFullName()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Original Name",
            PasswordHash = "hashed",
            Status = UserStatus.Active
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, "   ", null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        user.FullName.Should().Be("Original Name");
    }

    [Fact]
    public async Task Handle_FullNameWithWhitespace_ShouldTrim()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Old Name",
            PasswordHash = "hashed",
            Status = UserStatus.Active
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, "  New Name  ", null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        user.FullName.Should().Be("New Name");
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("Active")]
    [InlineData("Inactive")]
    [InlineData("pending")]
    [InlineData("ACTIVE")]
    public async Task Handle_ValidStatusValues_ShouldUpdateStatus(string statusValue)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hashed",
            Status = UserStatus.Pending
        };
        // Clear any pre-existing domain events
        user.ClearDomainEvents();
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new UpdateUserCommand(userId, null, statusValue);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        Enum.TryParse<UserStatus>(statusValue, true, out var expectedStatus);
        user.Status.Should().Be(expectedStatus);
    }
}
