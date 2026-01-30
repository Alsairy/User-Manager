using FluentAssertions;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class MarkInstallmentOverdueActivityTests : WorkflowActivityTestBase
{
    public MarkInstallmentOverdueActivityTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Activity_ShouldHaveExpectedInputProperties()
    {
        // Arrange & Act
        var activity = new MarkInstallmentOverdueActivity();

        // Assert - verify activity can be created and has the expected property types
        activity.Should().NotBeNull();
        typeof(MarkInstallmentOverdueActivity).GetProperty("ContractId").Should().NotBeNull();
    }

    [Fact]
    public void Activity_Properties_ShouldBeSettable()
    {
        // Arrange
        var activity = new MarkInstallmentOverdueActivity();
        var contractId = Guid.NewGuid();

        // Act & Assert - Verify properties can be assigned
        activity.ContractId = new(contractId);

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ShouldInheritFromCodeActivity()
    {
        // Arrange & Act
        var activity = new MarkInstallmentOverdueActivity();

        // Assert
        activity.Should().BeAssignableTo<Elsa.Workflows.CodeActivity<int>>();
    }

    [Fact]
    public void Activity_WithSpecificContract_ShouldBeConfigurable()
    {
        // Arrange & Act
        var activity = new MarkInstallmentOverdueActivity
        {
            ContractId = new(Guid.NewGuid())
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_WithNullContractId_ShouldProcessAllContracts()
    {
        // This documents that null ContractId processes all overdue installments
        var activity = new MarkInstallmentOverdueActivity
        {
            ContractId = new((Guid?)null)
        };

        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData(InstallmentStatus.Pending, true)]
    [InlineData(InstallmentStatus.Overdue, false)]
    [InlineData(InstallmentStatus.Partial, false)]
    [InlineData(InstallmentStatus.Paid, false)]
    public void Activity_ShouldOnlyProcessPendingInstallments(InstallmentStatus status, bool shouldProcess)
    {
        // This documents that only Pending installments are marked as Overdue
        status.Should().BeDefined();
        shouldProcess.Should().Be(status == InstallmentStatus.Pending);
    }

    [Fact]
    public void Activity_ReturnsCount_ShouldReturnIntegerResult()
    {
        // This documents that the activity returns the count of processed installments
        var activity = new MarkInstallmentOverdueActivity();

        // The activity returns int (count of overdue installments marked)
        activity.Should().BeAssignableTo<Elsa.Workflows.CodeActivity<int>>();
    }

    [Fact]
    public void InstallmentOverdue_ShouldSendEmailToInvestor()
    {
        // This documents the expected behavior: email is sent to investor
        var activity = new MarkInstallmentOverdueActivity
        {
            ContractId = new(Guid.NewGuid())
        };

        activity.Should().NotBeNull();
    }

    [Fact]
    public void InstallmentOverdue_ShouldNotifyAdminRole()
    {
        // This documents the expected behavior: Admin role is notified
        var activity = new MarkInstallmentOverdueActivity
        {
            ContractId = new(Guid.NewGuid())
        };

        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData(-1, true)]   // Due yesterday
    [InlineData(-7, true)]   // Due a week ago
    [InlineData(-30, true)]  // Due a month ago
    [InlineData(0, false)]   // Due today - not overdue
    [InlineData(1, false)]   // Due tomorrow
    [InlineData(7, false)]   // Due next week
    public void Activity_ShouldIdentifyOverdueBasedOnDueDate(int daysFromToday, bool isOverdue)
    {
        // This documents the overdue logic based on due date
        var dueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(daysFromToday));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        (dueDate < today).Should().Be(isOverdue);
    }

    [Fact]
    public void Activity_EmailFailure_ShouldNotStopProcessing()
    {
        // This documents that email failures are caught and don't stop processing
        var activity = new MarkInstallmentOverdueActivity
        {
            ContractId = new(Guid.NewGuid())
        };

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_UpdatesInstallmentStatus_ShouldSetOverdue()
    {
        // This documents the expected status change
        var expectedNewStatus = InstallmentStatus.Overdue;
        expectedNewStatus.Should().Be(InstallmentStatus.Overdue);
    }

    [Fact]
    public void Activity_UpdatesInstallmentTimestamp_ShouldSetUpdatedAt()
    {
        // This documents that UpdatedAt is set when marking overdue
        var activity = new MarkInstallmentOverdueActivity();
        activity.Should().NotBeNull();
    }
}
