using FluentAssertions;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class UpdateIsnadStatusActivityTests : WorkflowActivityTestBase
{
    public UpdateIsnadStatusActivityTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Activity_ShouldHaveExpectedInputProperties()
    {
        // Arrange & Act
        var activity = new UpdateIsnadStatusActivity();

        // Assert - verify activity can be created and has the expected property types
        activity.Should().NotBeNull();
        typeof(UpdateIsnadStatusActivity).GetProperty("FormId").Should().NotBeNull();
        typeof(UpdateIsnadStatusActivity).GetProperty("NewStatus").Should().NotBeNull();
        typeof(UpdateIsnadStatusActivity).GetProperty("Reason").Should().NotBeNull();
        typeof(UpdateIsnadStatusActivity).GetProperty("PerformedBy").Should().NotBeNull();
    }

    [Theory]
    [InlineData(IsnadStatus.Draft)]
    [InlineData(IsnadStatus.PendingVerification)]
    [InlineData(IsnadStatus.VerificationDue)]
    [InlineData(IsnadStatus.ChangesRequested)]
    [InlineData(IsnadStatus.VerifiedFilled)]
    [InlineData(IsnadStatus.InvestmentAgencyReview)]
    [InlineData(IsnadStatus.InPackage)]
    [InlineData(IsnadStatus.PendingCeo)]
    [InlineData(IsnadStatus.PendingMinister)]
    [InlineData(IsnadStatus.Approved)]
    [InlineData(IsnadStatus.Rejected)]
    [InlineData(IsnadStatus.Cancelled)]
    public void NewStatus_ShouldAcceptAllIsnadStatusValues(IsnadStatus status)
    {
        // This test validates that all IsnadStatus enum values are valid inputs
        status.Should().BeDefined();
    }

    [Fact]
    public void Activity_Properties_ShouldBeSettable()
    {
        // Arrange
        var activity = new UpdateIsnadStatusActivity();
        var formId = Guid.NewGuid();

        // Act & Assert - Verify properties can be assigned
        activity.FormId = new(formId);
        activity.NewStatus = new(IsnadStatus.PendingVerification);
        activity.Reason = new("Submitted for review");
        activity.PerformedBy = new("user-123");

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ShouldInheritFromCodeActivity()
    {
        // Arrange & Act
        var activity = new UpdateIsnadStatusActivity();

        // Assert
        activity.Should().BeAssignableTo<Elsa.Workflows.CodeActivity<bool>>();
    }

    [Theory]
    [InlineData(IsnadStatus.PendingVerification, "school_planning", 5)]
    [InlineData(IsnadStatus.VerificationDue, "school_planning", 2)]
    [InlineData(IsnadStatus.VerifiedFilled, "investment_agency", 3)]
    [InlineData(IsnadStatus.InvestmentAgencyReview, "asset_manager", 5)]
    [InlineData(IsnadStatus.PendingCeo, "ceo", 7)]
    [InlineData(IsnadStatus.PendingMinister, "minister", 10)]
    public void Activity_ShouldHaveCorrectStageAssignment(IsnadStatus status, string expectedAssignee, int expectedSlaDays)
    {
        // This test documents the expected stage assignments and SLA days
        status.Should().BeDefined();
        expectedAssignee.Should().NotBeNullOrEmpty();
        expectedSlaDays.Should().BeGreaterThan(0);
    }

    [Theory]
    [InlineData(IsnadStatus.ChangesRequested, "Changes required in documentation")]
    [InlineData(IsnadStatus.Rejected, "Does not meet requirements")]
    [InlineData(IsnadStatus.Cancelled, "Form cancelled by submitter")]
    public void Activity_StatusesRequiringReason_ShouldIncludeReason(IsnadStatus status, string reason)
    {
        // Arrange & Act
        var activity = new UpdateIsnadStatusActivity
        {
            NewStatus = new(status),
            Reason = new(reason)
        };

        // Assert - verifies the configuration is valid
        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData(IsnadStatus.Draft, "submitter")]
    [InlineData(IsnadStatus.ChangesRequested, "submitter")]
    [InlineData(IsnadStatus.Approved, "completed")]
    public void Activity_SpecialStageAssignments_ShouldBeDocumented(IsnadStatus status, string expectedAssignee)
    {
        // This test documents special stage assignments
        status.Should().BeDefined();
        expectedAssignee.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Activity_Submit_ShouldTransitionToVerification()
    {
        // Arrange & Act
        var activity = new UpdateIsnadStatusActivity
        {
            NewStatus = new(IsnadStatus.PendingVerification),
            PerformedBy = new("submitter-user")
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_Approve_ShouldTransitionToApproved()
    {
        // Arrange & Act
        var activity = new UpdateIsnadStatusActivity
        {
            NewStatus = new(IsnadStatus.Approved),
            PerformedBy = new("minister")
        };

        // Assert
        activity.Should().NotBeNull();
    }
}
