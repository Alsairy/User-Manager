using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Commands;
using UserManager.Application.Interfaces;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Application.Tests.Commands;

public class DeleteUserCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<DbSet<User>> _usersDbSetMock;
    private readonly DeleteUserCommandHandler _handler;

    public DeleteUserCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _usersDbSetMock = new Mock<DbSet<User>>();

        _dbContextMock.Setup(x => x.Users).Returns(_usersDbSetMock.Object);

        _handler = new DeleteUserCommandHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_ExistingUser_ShouldDeleteAndReturnTrue()
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

        var command = new DeleteUserCommand(userId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        mockDbSet.Verify(x => x.Remove(user), Times.Once);
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_NonExistingUser_ShouldReturnFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var users = new List<User>(); // Empty list - no users

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new DeleteUserCommand(userId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
        mockDbSet.Verify(x => x.Remove(It.IsAny<User>()), Times.Never);
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_DifferentUserId_ShouldReturnFalse()
    {
        // Arrange
        var existingUserId = Guid.NewGuid();
        var requestedUserId = Guid.NewGuid(); // Different ID
        var user = new User
        {
            Id = existingUserId,
            Email = "test@example.com",
            FullName = "Test User",
            PasswordHash = "hashed",
            Status = UserStatus.Active
        };
        var users = new List<User> { user };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var command = new DeleteUserCommand(requestedUserId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
        mockDbSet.Verify(x => x.Remove(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldCallSaveChangesOnlyOnSuccessfulDeletion()
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

        var command = new DeleteUserCommand(userId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
