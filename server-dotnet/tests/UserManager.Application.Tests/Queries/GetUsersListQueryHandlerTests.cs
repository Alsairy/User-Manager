using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Interfaces;
using UserManager.Application.Queries;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Application.Tests.Queries;

public class GetUsersListQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly GetUsersListQueryHandler _handler;

    public GetUsersListQueryHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new GetUsersListQueryHandler(_dbContextMock.Object);
    }

    private User CreateUser(string email, string fullName, UserStatus status, DateTimeOffset createdAt, List<UserRole>? userRoles = null)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FullName = fullName,
            Status = status,
            CreatedAt = createdAt,
            UserRoles = userRoles ?? new List<UserRole>()
        };
    }

    [Fact]
    public async Task Handle_Pagination_ReturnsCorrectPage()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("user1@example.com", "User 1", UserStatus.Active, now.AddDays(-1)),
            CreateUser("user2@example.com", "User 2", UserStatus.Active, now.AddDays(-2)),
            CreateUser("user3@example.com", "User 3", UserStatus.Active, now.AddDays(-3)),
            CreateUser("user4@example.com", "User 4", UserStatus.Active, now.AddDays(-4)),
            CreateUser("user5@example.com", "User 5", UserStatus.Active, now.AddDays(-5))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 2, Search: null, Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2);
        result.Total.Should().Be(5);
        result.Page.Should().Be(1);
        result.Limit.Should().Be(2);
    }

    [Fact]
    public async Task Handle_Pagination_ReturnsSecondPage()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("user1@example.com", "User 1", UserStatus.Active, now.AddDays(-1)),
            CreateUser("user2@example.com", "User 2", UserStatus.Active, now.AddDays(-2)),
            CreateUser("user3@example.com", "User 3", UserStatus.Active, now.AddDays(-3)),
            CreateUser("user4@example.com", "User 4", UserStatus.Active, now.AddDays(-4)),
            CreateUser("user5@example.com", "User 5", UserStatus.Active, now.AddDays(-5))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 2, Limit: 2, Search: null, Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2);
        result.Total.Should().Be(5);
        result.Page.Should().Be(2);
    }

    [Fact]
    public async Task Handle_Pagination_ReturnsLastPartialPage()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("user1@example.com", "User 1", UserStatus.Active, now.AddDays(-1)),
            CreateUser("user2@example.com", "User 2", UserStatus.Active, now.AddDays(-2)),
            CreateUser("user3@example.com", "User 3", UserStatus.Active, now.AddDays(-3)),
            CreateUser("user4@example.com", "User 4", UserStatus.Active, now.AddDays(-4)),
            CreateUser("user5@example.com", "User 5", UserStatus.Active, now.AddDays(-5))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 3, Limit: 2, Search: null, Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1); // Only 1 user left on page 3
        result.Total.Should().Be(5);
        result.Page.Should().Be(3);
    }

    [Fact]
    public async Task Handle_SearchByEmail_ReturnsMatchingUsers()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("john@example.com", "John Doe", UserStatus.Active, now.AddDays(-1)),
            CreateUser("jane@example.com", "Jane Smith", UserStatus.Active, now.AddDays(-2)),
            CreateUser("bob@test.com", "Bob Johnson", UserStatus.Active, now.AddDays(-3))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: "example", Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2);
        result.Data.Should().OnlyContain(u => u.Email.Contains("example"));
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task Handle_SearchByFullName_ReturnsMatchingUsers()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("john@example.com", "John Doe", UserStatus.Active, now.AddDays(-1)),
            CreateUser("jane@example.com", "Jane Smith", UserStatus.Active, now.AddDays(-2)),
            CreateUser("bob@test.com", "Bob Johnson", UserStatus.Active, now.AddDays(-3))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: "john", Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2); // John Doe and Bob Johnson
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task Handle_SearchIsCaseInsensitive()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("John@Example.com", "JOHN DOE", UserStatus.Active, now.AddDays(-1)),
            CreateUser("jane@example.com", "Jane Smith", UserStatus.Active, now.AddDays(-2))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: "JOHN", Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
        result.Data.First().FullName.Should().Be("JOHN DOE");
    }

    [Fact]
    public async Task Handle_FilterByStatus_ReturnsActiveUsersOnly()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("active1@example.com", "Active User 1", UserStatus.Active, now.AddDays(-1)),
            CreateUser("pending@example.com", "Pending User", UserStatus.Pending, now.AddDays(-2)),
            CreateUser("active2@example.com", "Active User 2", UserStatus.Active, now.AddDays(-3)),
            CreateUser("inactive@example.com", "Inactive User", UserStatus.Inactive, now.AddDays(-4))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: null, Status: "Active");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2);
        result.Data.Should().OnlyContain(u => u.Status == "Active");
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task Handle_FilterByStatus_ReturnsPendingUsersOnly()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("active@example.com", "Active User", UserStatus.Active, now.AddDays(-1)),
            CreateUser("pending1@example.com", "Pending User 1", UserStatus.Pending, now.AddDays(-2)),
            CreateUser("pending2@example.com", "Pending User 2", UserStatus.Pending, now.AddDays(-3))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: null, Status: "Pending");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2);
        result.Data.Should().OnlyContain(u => u.Status == "Pending");
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task Handle_FilterByStatusCaseInsensitive()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("active@example.com", "Active User", UserStatus.Active, now.AddDays(-1)),
            CreateUser("inactive@example.com", "Inactive User", UserStatus.Inactive, now.AddDays(-2))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: null, Status: "active");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
        result.Data.First().Status.Should().Be("Active");
    }

    [Fact]
    public async Task Handle_InvalidStatus_ReturnsAllUsers()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("user1@example.com", "User 1", UserStatus.Active, now.AddDays(-1)),
            CreateUser("user2@example.com", "User 2", UserStatus.Pending, now.AddDays(-2))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: null, Status: "InvalidStatus");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2); // Invalid status is ignored
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task Handle_EmptyResults_ReturnsEmptyList()
    {
        // Arrange
        var users = new List<User>();
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: null, Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().BeEmpty();
        result.Total.Should().Be(0);
        result.Page.Should().Be(1);
        result.Limit.Should().Be(10);
    }

    [Fact]
    public async Task Handle_NoMatchingSearch_ReturnsEmptyList()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("john@example.com", "John Doe", UserStatus.Active, now.AddDays(-1)),
            CreateUser("jane@example.com", "Jane Smith", UserStatus.Active, now.AddDays(-2))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: "nonexistent", Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    [Fact]
    public async Task Handle_CombinedSearchAndStatusFilter()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("john.active@example.com", "John Active", UserStatus.Active, now.AddDays(-1)),
            CreateUser("john.pending@example.com", "John Pending", UserStatus.Pending, now.AddDays(-2)),
            CreateUser("jane.active@example.com", "Jane Active", UserStatus.Active, now.AddDays(-3))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: "john", Status: "Active");

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
        result.Data.First().Email.Should().Be("john.active@example.com");
        result.Total.Should().Be(1);
    }

    [Fact]
    public async Task Handle_ReturnsUsersWithRoles()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var roleId = Guid.NewGuid();
        var role = new Role { Id = roleId, Name = "Admin" };
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "admin@example.com",
            FullName = "Admin User",
            Status = UserStatus.Active,
            CreatedAt = now,
            UserRoles = new List<UserRole>
            {
                new UserRole { UserId = userId, RoleId = roleId, Role = role }
            }
        };

        var users = new List<User> { user };
        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: null, Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
        result.Data.First().Roles.Should().ContainSingle().Which.Should().Be("Admin");
    }

    [Fact]
    public async Task Handle_OrdersByCreatedAtDescending()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("oldest@example.com", "Oldest User", UserStatus.Active, now.AddDays(-10)),
            CreateUser("newest@example.com", "Newest User", UserStatus.Active, now),
            CreateUser("middle@example.com", "Middle User", UserStatus.Active, now.AddDays(-5))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: null, Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(3);
        result.Data.First().Email.Should().Be("newest@example.com");
        result.Data.Last().Email.Should().Be("oldest@example.com");
    }

    [Fact]
    public async Task Handle_WhitespaceSearch_ReturnsAllUsers()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var users = new List<User>
        {
            CreateUser("user1@example.com", "User 1", UserStatus.Active, now.AddDays(-1)),
            CreateUser("user2@example.com", "User 2", UserStatus.Active, now.AddDays(-2))
        };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(users);
        _dbContextMock.Setup(x => x.Users).Returns(mockDbSet.Object);

        var query = new GetUsersListQuery(Page: 1, Limit: 10, Search: "   ", Status: null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(2); // Whitespace search is treated as no filter
        result.Total.Should().Be(2);
    }
}
