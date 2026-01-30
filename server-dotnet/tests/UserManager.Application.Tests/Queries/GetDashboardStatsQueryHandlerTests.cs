using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Interfaces;
using UserManager.Application.Queries;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Application.Tests.Queries;

public class GetDashboardStatsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<ICacheService> _cacheServiceMock;
    private readonly GetDashboardStatsQueryHandler _handler;

    public GetDashboardStatsQueryHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _cacheServiceMock = new Mock<ICacheService>();
        _handler = new GetDashboardStatsQueryHandler(_dbContextMock.Object, _cacheServiceMock.Object);
    }

    private void SetupEmptyDbSets()
    {
        var emptyUsers = MockDbSetHelper.CreateMockDbSet(new List<User>());
        var emptyAssets = MockDbSetHelper.CreateMockDbSet(new List<Asset>());
        var emptyContracts = MockDbSetHelper.CreateMockDbSet(new List<Contract>());
        var emptyInvestors = MockDbSetHelper.CreateMockDbSet(new List<Investor>());
        var emptyIsnadForms = MockDbSetHelper.CreateMockDbSet(new List<IsnadForm>());

        _dbContextMock.Setup(x => x.Users).Returns(emptyUsers.Object);
        _dbContextMock.Setup(x => x.Assets).Returns(emptyAssets.Object);
        _dbContextMock.Setup(x => x.Contracts).Returns(emptyContracts.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(emptyInvestors.Object);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(emptyIsnadForms.Object);
    }

    [Fact]
    public async Task Handle_ReturnsCorrectStats()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), Email = "user1@test.com", FullName = "User 1", Status = UserStatus.Active },
            new User { Id = Guid.NewGuid(), Email = "user2@test.com", FullName = "User 2", Status = UserStatus.Active },
            new User { Id = Guid.NewGuid(), Email = "user3@test.com", FullName = "User 3", Status = UserStatus.Pending },
            new User { Id = Guid.NewGuid(), Email = "user4@test.com", FullName = "User 4", Status = UserStatus.Inactive }
        };

        var assets = new List<Asset>
        {
            new Asset { Id = Guid.NewGuid(), Name = "Asset 1", Status = AssetStatus.Completed },
            new Asset { Id = Guid.NewGuid(), Name = "Asset 2", Status = AssetStatus.InReview },
            new Asset { Id = Guid.NewGuid(), Name = "Asset 3", Status = AssetStatus.InReview },
            new Asset { Id = Guid.NewGuid(), Name = "Asset 4", Status = AssetStatus.Draft }
        };

        var contracts = new List<Contract>
        {
            new Contract { Id = Guid.NewGuid(), ContractCode = "C001", Status = ContractStatus.Active, TotalContractAmount = 100000m },
            new Contract { Id = Guid.NewGuid(), ContractCode = "C002", Status = ContractStatus.Active, TotalContractAmount = 200000m },
            new Contract { Id = Guid.NewGuid(), ContractCode = "C003", Status = ContractStatus.Draft, TotalContractAmount = 50000m },
            new Contract { Id = Guid.NewGuid(), ContractCode = "C004", Status = ContractStatus.Expired, TotalContractAmount = 75000m }
        };

        var investors = new List<Investor>
        {
            new Investor { Id = Guid.NewGuid(), InvestorCode = "INV001", NameAr = "Investor 1", NameEn = "Investor 1" },
            new Investor { Id = Guid.NewGuid(), InvestorCode = "INV002", NameAr = "Investor 2", NameEn = "Investor 2" },
            new Investor { Id = Guid.NewGuid(), InvestorCode = "INV003", NameAr = "Investor 3", NameEn = "Investor 3" }
        };

        var isnadForms = new List<IsnadForm>
        {
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 1", ReferenceNumber = "REF001", Status = IsnadStatus.Approved },
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 2", ReferenceNumber = "REF002", Status = IsnadStatus.PendingVerification },
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 3", ReferenceNumber = "REF003", Status = IsnadStatus.VerificationDue },
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 4", ReferenceNumber = "REF004", Status = IsnadStatus.Draft }
        };

        var mockUsers = MockDbSetHelper.CreateMockDbSet(users);
        var mockAssets = MockDbSetHelper.CreateMockDbSet(assets);
        var mockContracts = MockDbSetHelper.CreateMockDbSet(contracts);
        var mockInvestors = MockDbSetHelper.CreateMockDbSet(investors);
        var mockIsnadForms = MockDbSetHelper.CreateMockDbSet(isnadForms);

        _dbContextMock.Setup(x => x.Users).Returns(mockUsers.Object);
        _dbContextMock.Setup(x => x.Assets).Returns(mockAssets.Object);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockContracts.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(mockInvestors.Object);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockIsnadForms.Object);

        var expectedResult = new DashboardStatsResult(
            TotalUsers: 4,
            ActiveUsers: 2,
            TotalAssets: 4,
            AssetsInReview: 2,
            TotalContracts: 4,
            ActiveContracts: 2,
            TotalInvestors: 3,
            TotalIsnadForms: 4,
            PendingIsnadForms: 2,
            TotalContractValue: 300000m
        );

        _cacheServiceMock
            .Setup(x => x.GetOrSetAsync(
                CacheKeys.DashboardStats,
                It.IsAny<Func<Task<DashboardStatsResult>>>(),
                CacheDurations.Short,
                It.IsAny<CancellationToken>()))
            .Returns((string key, Func<Task<DashboardStatsResult>> factory, TimeSpan? exp, CancellationToken ct) => factory());

        var query = new GetDashboardStatsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TotalUsers.Should().Be(4);
        result.ActiveUsers.Should().Be(2);
        result.TotalAssets.Should().Be(4);
        result.AssetsInReview.Should().Be(2);
        result.TotalContracts.Should().Be(4);
        result.ActiveContracts.Should().Be(2);
        result.TotalInvestors.Should().Be(3);
        result.TotalIsnadForms.Should().Be(4);
        result.PendingIsnadForms.Should().Be(2);
        result.TotalContractValue.Should().Be(300000m);
    }

    [Fact]
    public async Task Handle_WithEmptyDatabase_ReturnsZeroCounts()
    {
        // Arrange
        SetupEmptyDbSets();

        _cacheServiceMock
            .Setup(x => x.GetOrSetAsync(
                CacheKeys.DashboardStats,
                It.IsAny<Func<Task<DashboardStatsResult>>>(),
                CacheDurations.Short,
                It.IsAny<CancellationToken>()))
            .Returns((string key, Func<Task<DashboardStatsResult>> factory, TimeSpan? exp, CancellationToken ct) => factory());

        var query = new GetDashboardStatsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TotalUsers.Should().Be(0);
        result.ActiveUsers.Should().Be(0);
        result.TotalAssets.Should().Be(0);
        result.AssetsInReview.Should().Be(0);
        result.TotalContracts.Should().Be(0);
        result.ActiveContracts.Should().Be(0);
        result.TotalInvestors.Should().Be(0);
        result.TotalIsnadForms.Should().Be(0);
        result.PendingIsnadForms.Should().Be(0);
        result.TotalContractValue.Should().Be(0m);
    }

    [Fact]
    public async Task Handle_UsesCacheService()
    {
        // Arrange
        var cachedResult = new DashboardStatsResult(10, 5, 20, 3, 15, 8, 12, 25, 4, 500000m);

        _cacheServiceMock
            .Setup(x => x.GetOrSetAsync(
                CacheKeys.DashboardStats,
                It.IsAny<Func<Task<DashboardStatsResult>>>(),
                CacheDurations.Short,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cachedResult);

        var query = new GetDashboardStatsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().Be(cachedResult);
        _cacheServiceMock.Verify(x => x.GetOrSetAsync(
            CacheKeys.DashboardStats,
            It.IsAny<Func<Task<DashboardStatsResult>>>(),
            CacheDurations.Short,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_OnlyCountsActiveContractsForTotalValue()
    {
        // Arrange
        var users = new List<User>();
        var assets = new List<Asset>();
        var investors = new List<Investor>();
        var isnadForms = new List<IsnadForm>();

        var contracts = new List<Contract>
        {
            new Contract { Id = Guid.NewGuid(), ContractCode = "C001", Status = ContractStatus.Active, TotalContractAmount = 100000m },
            new Contract { Id = Guid.NewGuid(), ContractCode = "C002", Status = ContractStatus.Active, TotalContractAmount = 150000m },
            new Contract { Id = Guid.NewGuid(), ContractCode = "C003", Status = ContractStatus.Draft, TotalContractAmount = 999999m }, // Should not be counted
            new Contract { Id = Guid.NewGuid(), ContractCode = "C004", Status = ContractStatus.Cancelled, TotalContractAmount = 888888m }, // Should not be counted
            new Contract { Id = Guid.NewGuid(), ContractCode = "C005", Status = ContractStatus.Expired, TotalContractAmount = 777777m } // Should not be counted
        };

        var mockUsers = MockDbSetHelper.CreateMockDbSet(users);
        var mockAssets = MockDbSetHelper.CreateMockDbSet(assets);
        var mockContracts = MockDbSetHelper.CreateMockDbSet(contracts);
        var mockInvestors = MockDbSetHelper.CreateMockDbSet(investors);
        var mockIsnadForms = MockDbSetHelper.CreateMockDbSet(isnadForms);

        _dbContextMock.Setup(x => x.Users).Returns(mockUsers.Object);
        _dbContextMock.Setup(x => x.Assets).Returns(mockAssets.Object);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockContracts.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(mockInvestors.Object);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockIsnadForms.Object);

        _cacheServiceMock
            .Setup(x => x.GetOrSetAsync(
                CacheKeys.DashboardStats,
                It.IsAny<Func<Task<DashboardStatsResult>>>(),
                CacheDurations.Short,
                It.IsAny<CancellationToken>()))
            .Returns((string key, Func<Task<DashboardStatsResult>> factory, TimeSpan? exp, CancellationToken ct) => factory());

        var query = new GetDashboardStatsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalContractValue.Should().Be(250000m); // Only active contracts: 100000 + 150000
        result.TotalContracts.Should().Be(5);
        result.ActiveContracts.Should().Be(2);
    }

    [Fact]
    public async Task Handle_CountsPendingAndVerificationDueIsnadForms()
    {
        // Arrange
        var users = new List<User>();
        var assets = new List<Asset>();
        var contracts = new List<Contract>();
        var investors = new List<Investor>();

        var isnadForms = new List<IsnadForm>
        {
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 1", ReferenceNumber = "REF001", Status = IsnadStatus.PendingVerification },
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 2", ReferenceNumber = "REF002", Status = IsnadStatus.VerificationDue },
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 3", ReferenceNumber = "REF003", Status = IsnadStatus.PendingVerification },
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 4", ReferenceNumber = "REF004", Status = IsnadStatus.Approved }, // Not pending
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 5", ReferenceNumber = "REF005", Status = IsnadStatus.Draft }, // Not pending
            new IsnadForm { Id = Guid.NewGuid(), Title = "Form 6", ReferenceNumber = "REF006", Status = IsnadStatus.Rejected } // Not pending
        };

        var mockUsers = MockDbSetHelper.CreateMockDbSet(users);
        var mockAssets = MockDbSetHelper.CreateMockDbSet(assets);
        var mockContracts = MockDbSetHelper.CreateMockDbSet(contracts);
        var mockInvestors = MockDbSetHelper.CreateMockDbSet(investors);
        var mockIsnadForms = MockDbSetHelper.CreateMockDbSet(isnadForms);

        _dbContextMock.Setup(x => x.Users).Returns(mockUsers.Object);
        _dbContextMock.Setup(x => x.Assets).Returns(mockAssets.Object);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockContracts.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(mockInvestors.Object);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockIsnadForms.Object);

        _cacheServiceMock
            .Setup(x => x.GetOrSetAsync(
                CacheKeys.DashboardStats,
                It.IsAny<Func<Task<DashboardStatsResult>>>(),
                CacheDurations.Short,
                It.IsAny<CancellationToken>()))
            .Returns((string key, Func<Task<DashboardStatsResult>> factory, TimeSpan? exp, CancellationToken ct) => factory());

        var query = new GetDashboardStatsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalIsnadForms.Should().Be(6);
        result.PendingIsnadForms.Should().Be(3); // 2 PendingVerification + 1 VerificationDue
    }

    [Fact]
    public async Task Handle_CountsAssetsInReviewCorrectly()
    {
        // Arrange
        var users = new List<User>();
        var contracts = new List<Contract>();
        var investors = new List<Investor>();
        var isnadForms = new List<IsnadForm>();

        var assets = new List<Asset>
        {
            new Asset { Id = Guid.NewGuid(), Name = "Asset 1", Status = AssetStatus.InReview },
            new Asset { Id = Guid.NewGuid(), Name = "Asset 2", Status = AssetStatus.InReview },
            new Asset { Id = Guid.NewGuid(), Name = "Asset 3", Status = AssetStatus.Completed },
            new Asset { Id = Guid.NewGuid(), Name = "Asset 4", Status = AssetStatus.Draft },
            new Asset { Id = Guid.NewGuid(), Name = "Asset 5", Status = AssetStatus.Rejected }
        };

        var mockUsers = MockDbSetHelper.CreateMockDbSet(users);
        var mockAssets = MockDbSetHelper.CreateMockDbSet(assets);
        var mockContracts = MockDbSetHelper.CreateMockDbSet(contracts);
        var mockInvestors = MockDbSetHelper.CreateMockDbSet(investors);
        var mockIsnadForms = MockDbSetHelper.CreateMockDbSet(isnadForms);

        _dbContextMock.Setup(x => x.Users).Returns(mockUsers.Object);
        _dbContextMock.Setup(x => x.Assets).Returns(mockAssets.Object);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockContracts.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(mockInvestors.Object);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockIsnadForms.Object);

        _cacheServiceMock
            .Setup(x => x.GetOrSetAsync(
                CacheKeys.DashboardStats,
                It.IsAny<Func<Task<DashboardStatsResult>>>(),
                CacheDurations.Short,
                It.IsAny<CancellationToken>()))
            .Returns((string key, Func<Task<DashboardStatsResult>> factory, TimeSpan? exp, CancellationToken ct) => factory());

        var query = new GetDashboardStatsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalAssets.Should().Be(5);
        result.AssetsInReview.Should().Be(2);
    }

    [Fact]
    public void Handle_QueryObjectIsProperlyConstructed()
    {
        // Arrange & Act
        var query = new GetDashboardStatsQuery();

        // Assert
        query.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_CountsAllUserStatusesForTotalUsers()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), Email = "active1@test.com", FullName = "Active 1", Status = UserStatus.Active },
            new User { Id = Guid.NewGuid(), Email = "active2@test.com", FullName = "Active 2", Status = UserStatus.Active },
            new User { Id = Guid.NewGuid(), Email = "active3@test.com", FullName = "Active 3", Status = UserStatus.Active },
            new User { Id = Guid.NewGuid(), Email = "pending1@test.com", FullName = "Pending 1", Status = UserStatus.Pending },
            new User { Id = Guid.NewGuid(), Email = "pending2@test.com", FullName = "Pending 2", Status = UserStatus.Pending },
            new User { Id = Guid.NewGuid(), Email = "inactive@test.com", FullName = "Inactive", Status = UserStatus.Inactive }
        };

        var assets = new List<Asset>();
        var contracts = new List<Contract>();
        var investors = new List<Investor>();
        var isnadForms = new List<IsnadForm>();

        var mockUsers = MockDbSetHelper.CreateMockDbSet(users);
        var mockAssets = MockDbSetHelper.CreateMockDbSet(assets);
        var mockContracts = MockDbSetHelper.CreateMockDbSet(contracts);
        var mockInvestors = MockDbSetHelper.CreateMockDbSet(investors);
        var mockIsnadForms = MockDbSetHelper.CreateMockDbSet(isnadForms);

        _dbContextMock.Setup(x => x.Users).Returns(mockUsers.Object);
        _dbContextMock.Setup(x => x.Assets).Returns(mockAssets.Object);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockContracts.Object);
        _dbContextMock.Setup(x => x.Investors).Returns(mockInvestors.Object);
        _dbContextMock.Setup(x => x.IsnadForms).Returns(mockIsnadForms.Object);

        _cacheServiceMock
            .Setup(x => x.GetOrSetAsync(
                CacheKeys.DashboardStats,
                It.IsAny<Func<Task<DashboardStatsResult>>>(),
                CacheDurations.Short,
                It.IsAny<CancellationToken>()))
            .Returns((string key, Func<Task<DashboardStatsResult>> factory, TimeSpan? exp, CancellationToken ct) => factory());

        var query = new GetDashboardStatsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalUsers.Should().Be(6); // All users regardless of status
        result.ActiveUsers.Should().Be(3); // Only Active status users
    }
}
