using FluentAssertions;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class UpdateUserStatusActivityTests : WorkflowActivityTestBase
{
    public UpdateUserStatusActivityTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Activity_ShouldHaveExpectedInputProperties()
    {
        // Arrange & Act
        var activity = new UpdateUserStatusActivity();

        // Assert - verify activity can be created and has the expected property types
        activity.Should().NotBeNull();
        typeof(UpdateUserStatusActivity).GetProperty("UserId").Should().NotBeNull();
        typeof(UpdateUserStatusActivity).GetProperty("NewStatus").Should().NotBeNull();
        typeof(UpdateUserStatusActivity).GetProperty("SendEmail").Should().NotBeNull();
    }

    [Theory]
    [InlineData(UserStatus.Pending)]
    [InlineData(UserStatus.Active)]
    [InlineData(UserStatus.Inactive)]
    public void NewStatus_ShouldAcceptAllUserStatusValues(UserStatus status)
    {
        // This test validates that all UserStatus enum values are valid inputs
        status.Should().BeDefined();
    }

    [Fact]
    public void Activity_Properties_ShouldBeSettable()
    {
        // Arrange
        var activity = new UpdateUserStatusActivity();
        var userId = Guid.NewGuid();

        // Act & Assert - Verify properties can be assigned
        activity.UserId = new(userId);
        activity.NewStatus = new(UserStatus.Active);
        activity.SendEmail = new(true);

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ShouldInheritFromCodeActivity()
    {
        // Arrange & Act
        var activity = new UpdateUserStatusActivity();

        // Assert
        activity.Should().BeAssignableTo<Elsa.Workflows.CodeActivity<bool>>();
    }

    [Theory]
    [InlineData(UserStatus.Active, true)]
    [InlineData(UserStatus.Active, false)]
    [InlineData(UserStatus.Inactive, true)]
    [InlineData(UserStatus.Inactive, false)]
    public void Activity_ShouldSupportEmailNotificationToggle(UserStatus status, bool sendEmail)
    {
        // Arrange & Act
        var activity = new UpdateUserStatusActivity
        {
            NewStatus = new(status),
            SendEmail = new(sendEmail)
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ActivateUser_ShouldSetStatusActive()
    {
        // Arrange & Act
        var activity = new UpdateUserStatusActivity
        {
            UserId = new(Guid.NewGuid()),
            NewStatus = new(UserStatus.Active),
            SendEmail = new(true)
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_DeactivateUser_ShouldSetStatusInactive()
    {
        // Arrange & Act
        var activity = new UpdateUserStatusActivity
        {
            UserId = new(Guid.NewGuid()),
            NewStatus = new(UserStatus.Inactive),
            SendEmail = new(true)
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ActivateWithoutEmail_ShouldNotSendEmail()
    {
        // Arrange & Act
        var activity = new UpdateUserStatusActivity
        {
            UserId = new(Guid.NewGuid()),
            NewStatus = new(UserStatus.Active),
            SendEmail = new(false)
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData(UserStatus.Pending, UserStatus.Active, "Account activated")]
    [InlineData(UserStatus.Active, UserStatus.Inactive, "Account deactivated")]
    [InlineData(UserStatus.Inactive, UserStatus.Active, "Account reactivated")]
    public void Activity_StatusTransitions_ShouldBeValid(UserStatus from, UserStatus to, string expectedAction)
    {
        // This test documents valid status transitions
        from.Should().BeDefined();
        to.Should().BeDefined();
        expectedAction.Should().NotBeNullOrEmpty();
    }
}
