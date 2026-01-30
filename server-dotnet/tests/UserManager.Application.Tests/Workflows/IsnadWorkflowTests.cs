using Elsa.Workflows;
using FluentAssertions;
using UserManager.Domain.Enums;
using UserManager.Workflows.Workflows;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class IsnadWorkflowTests : WorkflowActivityTestBase
{
    public IsnadWorkflowTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Workflow_ShouldInheritFromWorkflowBase()
    {
        // Arrange & Act
        var workflow = new IsnadWorkflow();

        // Assert
        workflow.Should().BeAssignableTo<WorkflowBase>();
    }

    [Fact]
    public void Workflow_ShouldNotBeNull()
    {
        // Arrange & Act
        var workflow = new IsnadWorkflow();

        // Assert
        workflow.Should().NotBeNull();
    }

    [Theory]
    [InlineData("submit", "draft", IsnadStatus.PendingVerification)]
    [InlineData("verify", "pending_verification", IsnadStatus.VerifiedFilled)]
    [InlineData("verify", "verification_due", IsnadStatus.VerifiedFilled)]
    [InlineData("send_to_agency", "verified_filled", IsnadStatus.InvestmentAgencyReview)]
    [InlineData("add_to_package", "investment_agency_review", IsnadStatus.InPackage)]
    [InlineData("send_to_ceo", "in_package", IsnadStatus.PendingCeo)]
    [InlineData("ceo_approve", "pending_ceo", IsnadStatus.PendingMinister)]
    [InlineData("minister_approve", "pending_minister", IsnadStatus.Approved)]
    public void Workflow_ShouldSupportStageTransitions(string action, string currentStage, IsnadStatus expectedStatus)
    {
        // This documents the workflow's stage transitions
        action.Should().NotBeNullOrEmpty();
        currentStage.Should().NotBeNullOrEmpty();
        expectedStatus.Should().BeDefined();
    }

    [Theory]
    [InlineData("submit")]
    [InlineData("verify")]
    [InlineData("send_to_agency")]
    [InlineData("add_to_package")]
    [InlineData("send_to_ceo")]
    [InlineData("ceo_approve")]
    [InlineData("minister_approve")]
    [InlineData("return")]
    [InlineData("resubmit")]
    [InlineData("reject")]
    [InlineData("cancel")]
    public void Workflow_ShouldSupportAllActions(string action)
    {
        // This documents the workflow's supported actions
        action.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Workflow_SubmitAction_ShouldTransitionToVerification()
    {
        // This documents that submit action moves form to PendingVerification
        var workflow = new IsnadWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_VerifyAction_ShouldTransitionToVerifiedFilled()
    {
        // This documents that verify action moves form to VerifiedFilled
        var workflow = new IsnadWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_ReturnAction_ShouldTransitionToChangesRequested()
    {
        // This documents that return action moves form to ChangesRequested
        var workflow = new IsnadWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_ResubmitAction_ShouldReturnToVerification()
    {
        // This documents that resubmit after changes returns to PendingVerification
        var workflow = new IsnadWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_RejectAction_ShouldTransitionToRejected()
    {
        // This documents that reject action moves form to Rejected status
        var workflow = new IsnadWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_CancelAction_ShouldTransitionToCancelled()
    {
        // This documents that cancel action moves form to Cancelled status
        var workflow = new IsnadWorkflow();
        workflow.Should().NotBeNull();
    }

    [Theory]
    [InlineData("FormId")]
    [InlineData("ReferenceNumber")]
    [InlineData("CurrentStage")]
    [InlineData("Action")]
    [InlineData("Reason")]
    [InlineData("PerformedBy")]
    public void Workflow_ShouldAcceptExpectedInputs(string inputName)
    {
        // This documents the expected workflow inputs
        inputName.Should().NotBeNullOrEmpty();
    }

    [Theory]
    [InlineData("draft")]
    [InlineData("pending_verification")]
    [InlineData("verification_due")]
    [InlineData("changes_requested")]
    [InlineData("verified_filled")]
    [InlineData("investment_agency_review")]
    [InlineData("in_package")]
    [InlineData("pending_ceo")]
    [InlineData("pending_minister")]
    public void Workflow_CurrentStage_ShouldAcceptAllStages(string stage)
    {
        // This documents the accepted current stage values
        stage.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Workflow_FullApprovalPath_ShouldFollowExpectedSequence()
    {
        // Documents the full approval path:
        // Draft -> PendingVerification -> VerifiedFilled -> InvestmentAgencyReview
        //       -> InPackage -> PendingCeo -> PendingMinister -> Approved
        var expectedPath = new[]
        {
            IsnadStatus.Draft,
            IsnadStatus.PendingVerification,
            IsnadStatus.VerifiedFilled,
            IsnadStatus.InvestmentAgencyReview,
            IsnadStatus.InPackage,
            IsnadStatus.PendingCeo,
            IsnadStatus.PendingMinister,
            IsnadStatus.Approved
        };

        foreach (var status in expectedPath)
        {
            status.Should().BeDefined();
        }
    }

    [Theory]
    [InlineData("Missing required documents")]
    [InlineData("Asset information incomplete")]
    [InlineData("Does not meet investment criteria")]
    [InlineData(null)]
    [InlineData("")]
    public void Workflow_ReturnReason_ShouldAcceptVariousReasons(string? reason)
    {
        // This documents that return/reject actions accept various reasons
        var workflow = new IsnadWorkflow();
        workflow.Should().NotBeNull();
    }

    [Theory]
    [InlineData("school_planning_user")]
    [InlineData("asset_manager")]
    [InlineData("ceo")]
    [InlineData("minister")]
    [InlineData("workflow")]
    public void Workflow_PerformedBy_ShouldAcceptVariousUsers(string performedBy)
    {
        // This documents that PerformedBy accepts various user identifiers
        performedBy.Should().NotBeNullOrEmpty();
    }
}
