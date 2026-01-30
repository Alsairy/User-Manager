using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Commands;
using UserManager.Application.Interfaces;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Tests.Commands;

public class UpdateAssetStatusCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly UpdateAssetStatusCommandHandler _handler;

    public UpdateAssetStatusCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new UpdateAssetStatusCommandHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_TransitionToInReview_ShouldSetSubmittedAtAndRaiseEvent()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-001",
            Status = AssetStatus.Draft
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "InReview", null, "user@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        asset.Status.Should().Be(AssetStatus.InReview);
        asset.SubmittedAt.Should().NotBeNull();
        asset.UpdatedBy.Should().Be("user@example.com");
        asset.UpdatedAt.Should().NotBeNull();

        asset.DomainEvents.Should().ContainSingle();
        var domainEvent = asset.DomainEvents.First() as AssetSubmittedEvent;
        domainEvent.Should().NotBeNull();
        domainEvent!.AssetId.Should().Be(assetId);
        domainEvent.AssetCode.Should().Be("ASSET-001");
        domainEvent.SubmittedBy.Should().Be("user@example.com");
    }

    [Fact]
    public async Task Handle_TransitionToCompleted_ShouldSetCompletedAtAndRaiseEvent()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-002",
            Status = AssetStatus.InReview
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "Completed", null, "approver@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        asset.Status.Should().Be(AssetStatus.Completed);
        asset.CompletedAt.Should().NotBeNull();
        asset.UpdatedBy.Should().Be("approver@example.com");

        asset.DomainEvents.Should().ContainSingle();
        var domainEvent = asset.DomainEvents.First() as AssetApprovedEvent;
        domainEvent.Should().NotBeNull();
        domainEvent!.AssetId.Should().Be(assetId);
        domainEvent.AssetCode.Should().Be("ASSET-002");
        domainEvent.ApprovedBy.Should().Be("approver@example.com");
    }

    [Fact]
    public async Task Handle_TransitionToRejected_ShouldSetRejectionReasonAndRaiseEvent()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-003",
            Status = AssetStatus.InReview
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "Rejected", "Missing documentation", "reviewer@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        asset.Status.Should().Be(AssetStatus.Rejected);
        asset.RejectionReason.Should().Be("Missing documentation");
        asset.UpdatedBy.Should().Be("reviewer@example.com");

        asset.DomainEvents.Should().ContainSingle();
        var domainEvent = asset.DomainEvents.First() as AssetRejectedEvent;
        domainEvent.Should().NotBeNull();
        domainEvent!.AssetId.Should().Be(assetId);
        domainEvent.AssetCode.Should().Be("ASSET-003");
        domainEvent.RejectedBy.Should().Be("reviewer@example.com");
        domainEvent.Reason.Should().Be("Missing documentation");
    }

    [Fact]
    public async Task Handle_TransitionToRejected_WithNullReason_ShouldUseEmptyString()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-004",
            Status = AssetStatus.InReview
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "Rejected", null, "reviewer@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        asset.Status.Should().Be(AssetStatus.Rejected);
        asset.RejectionReason.Should().BeNull();

        var domainEvent = asset.DomainEvents.First() as AssetRejectedEvent;
        domainEvent!.Reason.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_AssetNotFound_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var assets = new List<Asset>();

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "InReview", null, "user@example.com");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Asset not found.");
    }

    [Fact]
    public async Task Handle_InvalidStatus_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-005",
            Status = AssetStatus.Draft
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "InvalidStatus", null, "user@example.com");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Invalid asset status: InvalidStatus");
    }

    [Fact]
    public async Task Handle_TransitionToDraft_ShouldNotRaiseEvent()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-006",
            Status = AssetStatus.Rejected
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "Draft", null, "user@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        asset.Status.Should().Be(AssetStatus.Draft);
        asset.DomainEvents.Should().BeEmpty();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("Draft")]
    [InlineData("InReview")]
    [InlineData("Completed")]
    [InlineData("Rejected")]
    [InlineData("IncompleteBulk")]
    [InlineData("draft")]
    [InlineData("inreview")]
    [InlineData("COMPLETED")]
    public async Task Handle_ValidStatusValues_ShouldUpdateStatus(string statusValue)
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-007",
            Status = AssetStatus.Draft
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, statusValue, null, "user@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        Enum.TryParse<AssetStatus>(statusValue, true, out var expectedStatus);
        asset.Status.Should().Be(expectedStatus);
    }

    [Fact]
    public async Task Handle_ShouldSaveChanges()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-008",
            Status = AssetStatus.Draft
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "InReview", null, "user@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_TransitionToIncompleteBulk_ShouldNotRaiseEvent()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-009",
            Status = AssetStatus.Draft
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var command = new UpdateAssetStatusCommand(assetId, "IncompleteBulk", null, "user@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        asset.Status.Should().Be(AssetStatus.IncompleteBulk);
        asset.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ShouldSetUpdatedAtToCurrentTime()
    {
        // Arrange
        var assetId = Guid.NewGuid();
        var asset = new Asset
        {
            Id = assetId,
            Name = "Test Asset",
            Code = "ASSET-010",
            Status = AssetStatus.Draft
        };
        var assets = new List<Asset> { asset };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(assets);
        _dbContextMock.Setup(x => x.Assets).Returns(mockDbSet.Object);

        var beforeCall = DateTimeOffset.UtcNow;
        var command = new UpdateAssetStatusCommand(assetId, "InReview", null, "user@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var afterCall = DateTimeOffset.UtcNow;
        asset.UpdatedAt.Should().NotBeNull();
        asset.UpdatedAt.Should().BeOnOrAfter(beforeCall);
        asset.UpdatedAt.Should().BeOnOrBefore(afterCall);
    }
}
