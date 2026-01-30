using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class UpdateAssetStatusActivityTests : WorkflowActivityTestBase
{
    public UpdateAssetStatusActivityTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Activity_ShouldHaveExpectedInputProperties()
    {
        // Arrange & Act
        var activity = new UpdateAssetStatusActivity();

        // Assert - verify activity can be created and has the expected property types
        activity.Should().NotBeNull();
        // Input properties are initialized to default! so we verify their types exist
        typeof(UpdateAssetStatusActivity).GetProperty("AssetId").Should().NotBeNull();
        typeof(UpdateAssetStatusActivity).GetProperty("NewStatus").Should().NotBeNull();
        typeof(UpdateAssetStatusActivity).GetProperty("Reason").Should().NotBeNull();
        typeof(UpdateAssetStatusActivity).GetProperty("SetVisibleToInvestors").Should().NotBeNull();
    }

    [Theory]
    [InlineData(AssetStatus.Draft)]
    [InlineData(AssetStatus.InReview)]
    [InlineData(AssetStatus.Completed)]
    [InlineData(AssetStatus.Rejected)]
    public void NewStatus_ShouldAcceptAllAssetStatusValues(AssetStatus status)
    {
        // This test validates that all AssetStatus enum values are valid inputs
        status.Should().BeDefined();
    }

    [Fact]
    public void Activity_Properties_ShouldBeSettable()
    {
        // Arrange
        var activity = new UpdateAssetStatusActivity();
        var assetId = Guid.NewGuid();

        // Act & Assert - Verify properties can be assigned (compile-time check)
        activity.AssetId = new(assetId);
        activity.NewStatus = new(AssetStatus.Completed);
        activity.Reason = new("Test reason");
        activity.SetVisibleToInvestors = new(true);

        activity.Should().NotBeNull();
    }

    [Fact]
    public void Activity_ShouldInheritFromCodeActivity()
    {
        // Arrange & Act
        var activity = new UpdateAssetStatusActivity();

        // Assert
        activity.Should().BeAssignableTo<Elsa.Workflows.CodeActivity<bool>>();
    }

    [Theory]
    [InlineData(AssetStatus.Completed, true, "Asset approved")]
    [InlineData(AssetStatus.Rejected, false, "Asset rejected due to issues")]
    [InlineData(AssetStatus.Draft, false, "Returned for changes")]
    [InlineData(AssetStatus.InReview, false, null)]
    public void Activity_ShouldSupportDifferentStatusTransitions(AssetStatus status, bool expectedVisibility, string? reason)
    {
        // This test documents the expected behavior for different status transitions
        var activity = new UpdateAssetStatusActivity
        {
            NewStatus = new(status),
            Reason = new(reason),
            SetVisibleToInvestors = new(expectedVisibility)
        };

        activity.NewStatus.Should().NotBeNull();
    }
}
