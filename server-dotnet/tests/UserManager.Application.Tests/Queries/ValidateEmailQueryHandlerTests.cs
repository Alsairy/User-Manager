using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Interfaces;
using UserManager.Application.Queries;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Application.Tests.Queries;

public class ValidateEmailQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly ValidateEmailQueryHandler _handler;

    public ValidateEmailQueryHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new ValidateEmailQueryHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_EmailExists_ReturnsFalse()
    {
        // Arrange
        var existingEmail = "existing@example.com";
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Email = existingEmail,
                FullName = "Existing User",
                Status = UserStatus.Active
            }
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new ValidateEmailQuery(existingEmail);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeFalse(); // Email exists, so it's not valid for a new user
    }

    [Fact]
    public async Task Handle_EmailDoesNotExist_ReturnsTrue()
    {
        // Arrange
        var newEmail = "new@example.com";
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@example.com",
                FullName = "Existing User",
                Status = UserStatus.Active
            }
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new ValidateEmailQuery(newEmail);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeTrue(); // Email doesn't exist, so it's valid for a new user
    }

    [Fact]
    public async Task Handle_EmptyDatabase_ReturnsTrue()
    {
        // Arrange
        var email = "any@example.com";
        var users = new List<User>();

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new ValidateEmailQuery(email);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeTrue(); // No users exist, so any email is valid
    }

    [Fact]
    public async Task Handle_EmailMatchIsCaseSensitive()
    {
        // Arrange
        var existingEmail = "User@Example.com";
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Email = existingEmail,
                FullName = "Existing User",
                Status = UserStatus.Active
            }
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        // Query with different case
        var query = new ValidateEmailQuery("user@example.com");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        // Note: This test documents the current behavior - email comparison is case-sensitive
        // The result depends on the exact string matching behavior
        result.Should().BeTrue(); // Different case, so email is considered available
    }

    [Fact]
    public async Task Handle_ExactEmailMatch_ReturnsFalse()
    {
        // Arrange
        var email = "test@example.com";
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                FullName = "Test User",
                Status = UserStatus.Active
            },
            new User
            {
                Id = Guid.NewGuid(),
                Email = "other@example.com",
                FullName = "Other User",
                Status = UserStatus.Active
            }
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new ValidateEmailQuery(email);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeFalse(); // Exact match found
    }

    [Fact]
    public async Task Handle_SimilarEmailButNotExact_ReturnsTrue()
    {
        // Arrange
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                FullName = "Test User",
                Status = UserStatus.Active
            }
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new ValidateEmailQuery("test@example.org"); // Different domain

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeTrue(); // Similar but not exact match
    }

    [Fact]
    public async Task Handle_MultipleUsersNoneMatch_ReturnsTrue()
    {
        // Arrange
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Email = "user1@example.com",
                FullName = "User 1",
                Status = UserStatus.Active
            },
            new User
            {
                Id = Guid.NewGuid(),
                Email = "user2@example.com",
                FullName = "User 2",
                Status = UserStatus.Pending
            },
            new User
            {
                Id = Guid.NewGuid(),
                Email = "user3@example.com",
                FullName = "User 3",
                Status = UserStatus.Inactive
            }
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new ValidateEmailQuery("newuser@example.com");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeTrue(); // No matching email found
    }

    [Fact]
    public async Task Handle_InactiveUserEmailExists_ReturnsFalse()
    {
        // Arrange
        // Even if a user is inactive, their email should still be considered "taken"
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                Email = "inactive@example.com",
                FullName = "Inactive User",
                Status = UserStatus.Inactive
            }
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new ValidateEmailQuery("inactive@example.com");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeFalse(); // Email exists regardless of user status
    }
}
