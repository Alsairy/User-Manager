using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Commands;
using UserManager.Application.Interfaces;
using UserManager.Application.Tests.Helpers;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Application.Tests.Commands;

public class CancelContractCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly CancelContractCommandHandler _handler;

    public CancelContractCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new CancelContractCommandHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_ExistingContract_ShouldCancelSuccessfully()
    {
        // Arrange
        var contractId = Guid.NewGuid();
        var contract = new Contract
        {
            Id = contractId,
            ContractCode = "CNT-001",
            LandCode = "LAND-001",
            Status = ContractStatus.Active,
            AssetId = Guid.NewGuid(),
            InvestorId = Guid.NewGuid()
        };
        var contracts = new List<Contract> { contract };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockDbSet.Object);

        var command = new CancelContractCommand(contractId, "Business decision", "admin@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        contract.Status.Should().Be(ContractStatus.Cancelled);
        contract.CancelledAt.Should().NotBeNull();
        contract.CancelledBy.Should().Be("admin@example.com");
        contract.CancellationJustification.Should().Be("Business decision");
        contract.UpdatedAt.Should().NotBeNull();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ExistingContract_ShouldRaiseDomainEvent()
    {
        // Arrange
        var contractId = Guid.NewGuid();
        var contract = new Contract
        {
            Id = contractId,
            ContractCode = "CNT-002",
            LandCode = "LAND-002",
            Status = ContractStatus.Active,
            AssetId = Guid.NewGuid(),
            InvestorId = Guid.NewGuid()
        };
        var contracts = new List<Contract> { contract };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockDbSet.Object);

        var command = new CancelContractCommand(contractId, "Contract violation", "admin@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        contract.DomainEvents.Should().ContainSingle();
        var domainEvent = contract.DomainEvents.First() as ContractCancelledEvent;
        domainEvent.Should().NotBeNull();
        domainEvent!.ContractId.Should().Be(contractId);
        domainEvent.ContractCode.Should().Be("CNT-002");
        domainEvent.Reason.Should().Be("Contract violation");
    }

    [Fact]
    public async Task Handle_ContractNotFound_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var contractId = Guid.NewGuid();
        var contracts = new List<Contract>();

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockDbSet.Object);

        var command = new CancelContractCommand(contractId, "Some reason", "admin@example.com");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Contract not found.");
    }

    [Fact]
    public async Task Handle_DifferentContractId_ShouldThrowException()
    {
        // Arrange
        var existingContractId = Guid.NewGuid();
        var requestedContractId = Guid.NewGuid();
        var contract = new Contract
        {
            Id = existingContractId,
            ContractCode = "CNT-003",
            LandCode = "LAND-003",
            Status = ContractStatus.Active,
            AssetId = Guid.NewGuid(),
            InvestorId = Guid.NewGuid()
        };
        var contracts = new List<Contract> { contract };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockDbSet.Object);

        var command = new CancelContractCommand(requestedContractId, "Reason", "admin@example.com");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Contract not found.");
    }

    [Fact]
    public async Task Handle_AlreadyCancelledContract_ShouldStillUpdateFields()
    {
        // Arrange
        var contractId = Guid.NewGuid();
        var contract = new Contract
        {
            Id = contractId,
            ContractCode = "CNT-004",
            LandCode = "LAND-004",
            Status = ContractStatus.Cancelled,
            CancelledAt = DateTime.UtcNow.AddDays(-1),
            CancelledBy = "old-admin@example.com",
            CancellationJustification = "Old reason",
            AssetId = Guid.NewGuid(),
            InvestorId = Guid.NewGuid()
        };
        var contracts = new List<Contract> { contract };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockDbSet.Object);

        var command = new CancelContractCommand(contractId, "New reason", "new-admin@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        contract.Status.Should().Be(ContractStatus.Cancelled);
        contract.CancelledBy.Should().Be("new-admin@example.com");
        contract.CancellationJustification.Should().Be("New reason");
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(ContractStatus.Draft)]
    [InlineData(ContractStatus.Active)]
    [InlineData(ContractStatus.Expiring)]
    [InlineData(ContractStatus.Incomplete)]
    public async Task Handle_DifferentStatuses_ShouldCancelSuccessfully(ContractStatus initialStatus)
    {
        // Arrange
        var contractId = Guid.NewGuid();
        var contract = new Contract
        {
            Id = contractId,
            ContractCode = "CNT-005",
            LandCode = "LAND-005",
            Status = initialStatus,
            AssetId = Guid.NewGuid(),
            InvestorId = Guid.NewGuid()
        };
        var contracts = new List<Contract> { contract };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockDbSet.Object);

        var command = new CancelContractCommand(contractId, "Cancellation reason", "admin@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        contract.Status.Should().Be(ContractStatus.Cancelled);
    }

    [Fact]
    public async Task Handle_ShouldSetCancelledAtToCurrentTime()
    {
        // Arrange
        var contractId = Guid.NewGuid();
        var contract = new Contract
        {
            Id = contractId,
            ContractCode = "CNT-006",
            LandCode = "LAND-006",
            Status = ContractStatus.Active,
            AssetId = Guid.NewGuid(),
            InvestorId = Guid.NewGuid()
        };
        var contracts = new List<Contract> { contract };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockDbSet.Object);

        var beforeCall = DateTime.UtcNow;
        var command = new CancelContractCommand(contractId, "Reason", "admin@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var afterCall = DateTime.UtcNow;
        contract.CancelledAt.Should().NotBeNull();
        contract.CancelledAt.Should().BeOnOrAfter(beforeCall);
        contract.CancelledAt.Should().BeOnOrBefore(afterCall);
    }

    [Fact]
    public async Task Handle_EmptyReason_ShouldStillCancel()
    {
        // Arrange
        var contractId = Guid.NewGuid();
        var contract = new Contract
        {
            Id = contractId,
            ContractCode = "CNT-007",
            LandCode = "LAND-007",
            Status = ContractStatus.Active,
            AssetId = Guid.NewGuid(),
            InvestorId = Guid.NewGuid()
        };
        var contracts = new List<Contract> { contract };

        var mockDbSet = MockDbSetHelper.CreateMockDbSet(contracts);
        _dbContextMock.Setup(x => x.Contracts).Returns(mockDbSet.Object);

        var command = new CancelContractCommand(contractId, "", "admin@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        contract.Status.Should().Be(ContractStatus.Cancelled);
        contract.CancellationJustification.Should().BeEmpty();
    }
}
