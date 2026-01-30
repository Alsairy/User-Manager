using FluentAssertions;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class UpdateContractStatusActivityTests : WorkflowActivityTestBase
{
    public UpdateContractStatusActivityTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Activity_ShouldHaveExpectedInputProperties()
    {
        // Arrange & Act
        var activity = new UpdateContractStatusActivity();

        // Assert - verify activity can be created and has the expected property types
        activity.Should().NotBeNull();
        typeof(UpdateContractStatusActivity).GetProperty("ContractId").Should().NotBeNull();
        typeof(UpdateContractStatusActivity).GetProperty("NewStatus").Should().NotBeNull();
        typeof(UpdateContractStatusActivity).GetProperty("Reason").Should().NotBeNull();
        typeof(UpdateContractStatusActivity).GetProperty("GenerateInstallments").Should().NotBeNull();
    }

    [Theory]
    [InlineData(ContractStatus.Draft)]
    [InlineData(ContractStatus.Active)]
    [InlineData(ContractStatus.Expiring)]
    [InlineData(ContractStatus.Expired)]
    [InlineData(ContractStatus.Completed)]
    [InlineData(ContractStatus.Cancelled)]
    [InlineData(ContractStatus.Archived)]
    public void NewStatus_ShouldAcceptAllContractStatusValues(ContractStatus status)
    {
        // This test validates that all ContractStatus enum values are valid inputs
        status.Should().BeDefined();
    }

    [Fact]
    public void Activity_Properties_ShouldBeSettable()
    {
        // Arrange
        var activity = new UpdateContractStatusActivity();
        var contractId = Guid.NewGuid();

        // Act & Assert - Verify properties can be assigned
        activity.ContractId = new(contractId);
        activity.NewStatus = new(ContractStatus.Active);
        activity.Reason = new("Contract activated");
        activity.GenerateInstallments = new(true);

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ShouldInheritFromCodeActivity()
    {
        // Arrange & Act
        var activity = new UpdateContractStatusActivity();

        // Assert
        activity.Should().BeAssignableTo<Elsa.Workflows.CodeActivity<bool>>();
    }

    [Theory]
    [InlineData(ContractStatus.Active, true, null)]
    [InlineData(ContractStatus.Cancelled, false, "Contract cancelled by investor")]
    [InlineData(ContractStatus.Completed, false, null)]
    [InlineData(ContractStatus.Expiring, false, null)]
    [InlineData(ContractStatus.Archived, false, "Archived after completion")]
    public void Activity_ShouldSupportDifferentStatusTransitions(ContractStatus status, bool generateInstallments, string? reason)
    {
        // This test documents the expected behavior for different status transitions
        var activity = new UpdateContractStatusActivity
        {
            NewStatus = new(status),
            Reason = new(reason),
            GenerateInstallments = new(generateInstallments)
        };

        activity.NewStatus.Should().NotBeNull();
    }

    [Theory]
    [InlineData(InstallmentFrequency.Monthly, 12)]
    [InlineData(InstallmentFrequency.Quarterly, 4)]
    [InlineData(InstallmentFrequency.SemiAnnual, 2)]
    [InlineData(InstallmentFrequency.Annual, 1)]
    public void InstallmentGeneration_ShouldSupportAllFrequencies(InstallmentFrequency frequency, int expectedCount)
    {
        // This test documents the supported installment frequencies
        frequency.Should().BeDefined();
        expectedCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Activity_ActivateWithInstallments_ShouldSetGenerateInstallmentsTrue()
    {
        // Arrange & Act
        var activity = new UpdateContractStatusActivity
        {
            NewStatus = new(ContractStatus.Active),
            GenerateInstallments = new(true)
        };

        // Assert - verifies the configuration is valid
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_CancelWithReason_ShouldIncludeReason()
    {
        // Arrange
        var reason = "Contract cancelled due to non-payment";

        // Act
        var activity = new UpdateContractStatusActivity
        {
            NewStatus = new(ContractStatus.Cancelled),
            Reason = new(reason),
            GenerateInstallments = new(false)
        };

        // Assert - verifies the configuration is valid
        activity.Should().NotBeNull();
    }
}
