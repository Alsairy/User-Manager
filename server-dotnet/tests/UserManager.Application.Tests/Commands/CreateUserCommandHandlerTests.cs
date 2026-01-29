using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Commands;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Application.Tests.Commands;

public class CreateUserCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<DbSet<User>> _usersDbSetMock;
    private readonly Mock<DbSet<Role>> _rolesDbSetMock;
    private readonly CreateUserCommandHandler _handler;

    public CreateUserCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _usersDbSetMock = new Mock<DbSet<User>>();
        _rolesDbSetMock = new Mock<DbSet<Role>>();

        _dbContextMock.Setup(x => x.Users).Returns(_usersDbSetMock.Object);
        _dbContextMock.Setup(x => x.Roles).Returns(_rolesDbSetMock.Object);
        _passwordHasherMock.Setup(x => x.Hash(It.IsAny<string>())).Returns("hashed-password");

        _handler = new CreateUserCommandHandler(_dbContextMock.Object, _passwordHasherMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ShouldCreateUser()
    {
        // Arrange
        var command = new CreateUserCommand("test@example.com", "Test User", "Password123!", null);
        User? capturedUser = null;
        _usersDbSetMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((u, ct) => capturedUser = u)
            .ReturnsAsync((User u, CancellationToken ct) => null!);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBe(Guid.Empty);
        _usersDbSetMock.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _passwordHasherMock.Verify(x => x.Hash("Password123!"), Times.Once);

        capturedUser.Should().NotBeNull();
        capturedUser!.Email.Should().Be("test@example.com");
        capturedUser.FullName.Should().Be("Test User");
        capturedUser.PasswordHash.Should().Be("hashed-password");
        capturedUser.Status.Should().Be(UserStatus.Pending);
    }

    [Fact]
    public async Task Handle_WithNoRole_ShouldCreateUserWithoutRole()
    {
        // Arrange - pass null role
        var command = new CreateUserCommand("test@example.com", "Test User", "Password123!", null);
        User? capturedUser = null;
        _usersDbSetMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((u, ct) => capturedUser = u)
            .ReturnsAsync((User u, CancellationToken ct) => null!);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBe(Guid.Empty);
        capturedUser.Should().NotBeNull();
        capturedUser!.UserRoles.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ShouldAddDomainEvent()
    {
        // Arrange
        var command = new CreateUserCommand("test@example.com", "Test User", "Password123!", null);
        User? capturedUser = null;
        _usersDbSetMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((u, ct) => capturedUser = u)
            .ReturnsAsync((User u, CancellationToken ct) => null!);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.DomainEvents.Should().ContainSingle();
        capturedUser.DomainEvents.First().Should().BeOfType<Domain.Events.UserCreatedEvent>();
    }

    [Fact]
    public async Task Handle_ShouldHashPassword()
    {
        // Arrange
        var command = new CreateUserCommand("test@example.com", "Test User", "MySecurePass123!", null);
        User? capturedUser = null;
        _usersDbSetMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Callback<User, CancellationToken>((u, ct) => capturedUser = u)
            .ReturnsAsync((User u, CancellationToken ct) => null!);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _passwordHasherMock.Verify(x => x.Hash("MySecurePass123!"), Times.Once);
        capturedUser!.PasswordHash.Should().Be("hashed-password");
    }

    [Fact]
    public async Task Handle_ShouldSaveChanges()
    {
        // Arrange
        var command = new CreateUserCommand("test@example.com", "Test User", "Password123!", null);
        _usersDbSetMock.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken ct) => null!);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
