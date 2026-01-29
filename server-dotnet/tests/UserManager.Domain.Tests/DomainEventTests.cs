using UserManager.Domain.Entities;
using UserManager.Domain.Events;

namespace UserManager.Domain.Tests;

public class DomainEventTests
{
    [Fact]
    public void UserCreatedEvent_ShouldStoreProperties()
    {
        var userId = Guid.NewGuid();
        var evt = new UserCreatedEvent(userId, "test@example.com", "Test User");

        evt.UserId.Should().Be(userId);
        evt.Email.Should().Be("test@example.com");
        evt.FullName.Should().Be("Test User");
    }

    [Fact]
    public void UserStatusChangedEvent_ShouldStoreProperties()
    {
        var userId = Guid.NewGuid();
        var evt = new UserStatusChangedEvent(userId, "Pending", "Active");

        evt.UserId.Should().Be(userId);
        evt.OldStatus.Should().Be("Pending");
        evt.NewStatus.Should().Be("Active");
    }

    [Fact]
    public void AssetSubmittedEvent_ShouldStoreProperties()
    {
        var assetId = Guid.NewGuid();
        var evt = new AssetSubmittedEvent(assetId, "AST-001", "user@example.com");

        evt.AssetId.Should().Be(assetId);
        evt.AssetCode.Should().Be("AST-001");
        evt.SubmittedBy.Should().Be("user@example.com");
    }

    [Fact]
    public void AssetApprovedEvent_ShouldStoreProperties()
    {
        var assetId = Guid.NewGuid();
        var evt = new AssetApprovedEvent(assetId, "AST-001", "admin-user");

        evt.AssetId.Should().Be(assetId);
        evt.AssetCode.Should().Be("AST-001");
        evt.ApprovedBy.Should().Be("admin-user");
    }

    [Fact]
    public void AssetRejectedEvent_ShouldStoreProperties()
    {
        var assetId = Guid.NewGuid();
        var evt = new AssetRejectedEvent(assetId, "AST-001", "admin-user", "Does not meet requirements");

        evt.AssetId.Should().Be(assetId);
        evt.AssetCode.Should().Be("AST-001");
        evt.RejectedBy.Should().Be("admin-user");
        evt.Reason.Should().Be("Does not meet requirements");
    }

    [Fact]
    public void ContractCreatedEvent_ShouldStoreProperties()
    {
        var contractId = Guid.NewGuid();
        var assetId = Guid.NewGuid();
        var investorId = Guid.NewGuid();
        var evt = new ContractCreatedEvent(contractId, "CTR-001", assetId, investorId);

        evt.ContractId.Should().Be(contractId);
        evt.ContractCode.Should().Be("CTR-001");
        evt.AssetId.Should().Be(assetId);
        evt.InvestorId.Should().Be(investorId);
    }

    [Fact]
    public void ContractActivatedEvent_ShouldStoreProperties()
    {
        var contractId = Guid.NewGuid();
        var evt = new ContractActivatedEvent(contractId, "CTR-001");

        evt.ContractId.Should().Be(contractId);
        evt.ContractCode.Should().Be("CTR-001");
    }

    [Fact]
    public void ContractCancelledEvent_ShouldStoreProperties()
    {
        var contractId = Guid.NewGuid();
        var evt = new ContractCancelledEvent(contractId, "CTR-001", "Client request");

        evt.ContractId.Should().Be(contractId);
        evt.ContractCode.Should().Be("CTR-001");
        evt.Reason.Should().Be("Client request");
    }

    [Fact]
    public void InstallmentOverdueEvent_ShouldStoreProperties()
    {
        var installmentId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var evt = new InstallmentOverdueEvent(installmentId, contractId, 3, 5000m);

        evt.InstallmentId.Should().Be(installmentId);
        evt.ContractId.Should().Be(contractId);
        evt.InstallmentNumber.Should().Be(3);
        evt.Amount.Should().Be(5000m);
    }

    [Fact]
    public void User_AddDomainEvent_ShouldAddEventToCollection()
    {
        var user = new User();
        var evt = new UserCreatedEvent(user.Id, "test@example.com", "Test User");

        user.AddDomainEvent(evt);

        user.DomainEvents.Should().ContainSingle();
        user.DomainEvents.First().Should().Be(evt);
    }

    [Fact]
    public void User_ClearDomainEvents_ShouldRemoveAllEvents()
    {
        var user = new User();
        user.AddDomainEvent(new UserCreatedEvent(user.Id, "test@example.com", "Test User"));
        user.AddDomainEvent(new UserStatusChangedEvent(user.Id, "Pending", "Active"));

        user.ClearDomainEvents();

        user.DomainEvents.Should().BeEmpty();
    }
}
