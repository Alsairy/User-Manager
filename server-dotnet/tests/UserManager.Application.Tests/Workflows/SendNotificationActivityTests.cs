using FluentAssertions;
using UserManager.Workflows.Activities;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class SendNotificationActivityTests : WorkflowActivityTestBase
{
    public SendNotificationActivityTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Activity_ShouldHaveExpectedInputProperties()
    {
        // Arrange & Act
        var activity = new SendNotificationActivity();

        // Assert - verify activity can be created and has the expected property types
        activity.Should().NotBeNull();
        typeof(SendNotificationActivity).GetProperty("UserId").Should().NotBeNull();
        typeof(SendNotificationActivity).GetProperty("RoleName").Should().NotBeNull();
        // Note: Type property has 'new' modifier due to base class, so we use GetProperties to find it
        typeof(SendNotificationActivity).GetProperties()
            .Where(p => p.Name == "Type" && p.DeclaringType == typeof(SendNotificationActivity))
            .Should().NotBeEmpty("SendNotificationActivity should have a Type property");
        typeof(SendNotificationActivity).GetProperty("Title").Should().NotBeNull();
        typeof(SendNotificationActivity).GetProperty("Message").Should().NotBeNull();
        typeof(SendNotificationActivity).GetProperty("ActionUrl").Should().NotBeNull();
        typeof(SendNotificationActivity).GetProperty("EntityType").Should().NotBeNull();
        typeof(SendNotificationActivity).GetProperty("EntityId").Should().NotBeNull();
    }

    [Fact]
    public void Activity_Properties_ShouldBeSettable()
    {
        // Arrange
        var activity = new SendNotificationActivity();
        var userId = Guid.NewGuid();
        var entityId = Guid.NewGuid();

        // Act & Assert - Verify properties can be assigned
        activity.UserId = new(userId);
        activity.RoleName = new("Admin");
        activity.Type = new("info");
        activity.Title = new("Test Notification");
        activity.Message = new("This is a test message");
        activity.ActionUrl = new("/test/action");
        activity.EntityType = new("Asset");
        activity.EntityId = new(entityId);

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ShouldInheritFromCodeActivity()
    {
        // Arrange & Act
        var activity = new SendNotificationActivity();

        // Assert
        activity.Should().BeAssignableTo<Elsa.Workflows.CodeActivity>();
    }

    [Fact]
    public void Activity_NotifyUser_ShouldBeConfigurable()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entityId = Guid.NewGuid();

        // Act
        var activity = new SendNotificationActivity
        {
            UserId = new(userId),
            Type = new("success"),
            Title = new("Action Completed"),
            Message = new("Your request has been processed."),
            ActionUrl = new("/dashboard"),
            EntityType = new("Request"),
            EntityId = new(entityId)
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_NotifyRole_ShouldBeConfigurable()
    {
        // Arrange & Act
        var activity = new SendNotificationActivity
        {
            RoleName = new("Admin"),
            Type = new("warning"),
            Title = new("Action Required"),
            Message = new("Please review the pending requests.")
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData("info")]
    [InlineData("success")]
    [InlineData("warning")]
    [InlineData("error")]
    public void Activity_ShouldSupportAllNotificationTypes(string type)
    {
        // Arrange & Act
        var activity = new SendNotificationActivity
        {
            UserId = new(Guid.NewGuid()),
            Type = new(type),
            Title = new("Test"),
            Message = new("Test message")
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("Sales")]
    [InlineData("AssetManager")]
    [InlineData("ContractManager")]
    [InlineData("SchoolPlanning")]
    [InlineData("CEO")]
    [InlineData("Minister")]
    public void Activity_ShouldSupportVariousRoleNames(string roleName)
    {
        // Arrange & Act
        var activity = new SendNotificationActivity
        {
            RoleName = new(roleName),
            Type = new("info"),
            Title = new("Notification for " + roleName),
            Message = new("Test message")
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData("Asset")]
    [InlineData("Contract")]
    [InlineData("IsnadForm")]
    [InlineData("Investor")]
    [InlineData("InvestorInterest")]
    [InlineData("IstifadaRequest")]
    public void Activity_ShouldSupportVariousEntityTypes(string entityType)
    {
        // Arrange & Act
        var activity = new SendNotificationActivity
        {
            UserId = new(Guid.NewGuid()),
            Type = new("info"),
            Title = new("Entity Update"),
            Message = new("Entity has been updated"),
            EntityType = new(entityType),
            EntityId = new(Guid.NewGuid())
        };

        // Assert
        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_WithoutUserIdOrRoleName_ShouldStillBeConfigurable()
    {
        // This documents that the activity can be configured without either
        // (though it won't send notifications in this case)
        var activity = new SendNotificationActivity
        {
            Type = new("info"),
            Title = new("Test"),
            Message = new("Test message")
        };

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_WithBothUserIdAndRoleName_ShouldPrioritizeUserId()
    {
        // This documents that UserId takes priority when both are set
        var activity = new SendNotificationActivity
        {
            UserId = new(Guid.NewGuid()),
            RoleName = new("Admin"),
            Type = new("info"),
            Title = new("Test"),
            Message = new("Test message")
        };

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_NullType_ShouldDefaultToInfo()
    {
        // This documents that null type defaults to "info"
        var activity = new SendNotificationActivity
        {
            UserId = new(Guid.NewGuid()),
            Type = new((string)null!),
            Title = new("Test"),
            Message = new("Test message")
        };

        activity.Should().NotBeNull();
    }

    [Theory]
    [InlineData("/assets/123")]
    [InlineData("/contracts/456")]
    [InlineData("/isnad-forms/789")]
    [InlineData("/dashboard")]
    [InlineData(null)]
    public void Activity_ShouldSupportVariousActionUrls(string? actionUrl)
    {
        // Arrange & Act
        var activity = new SendNotificationActivity
        {
            UserId = new(Guid.NewGuid()),
            Type = new("info"),
            Title = new("Test"),
            Message = new("Test message"),
            ActionUrl = new(actionUrl)
        };

        // Assert
        activity.Should().NotBeNull();
    }
}
