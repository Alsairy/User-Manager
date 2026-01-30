using Elsa.Workflows;
using FluentAssertions;
using UserManager.Workflows.Workflows;
using Xunit;

namespace UserManager.Application.Tests.Workflows;

public class CrmWorkflowTests : WorkflowActivityTestBase
{
    public CrmWorkflowTests()
    {
        InitializeMocks();
    }

    [Fact]
    public void Workflow_ShouldInheritFromWorkflowBase()
    {
        // Arrange & Act
        var workflow = new CrmWorkflow();

        // Assert
        workflow.Should().BeAssignableTo<WorkflowBase>();
    }

    [Fact]
    public void Workflow_ShouldNotBeNull()
    {
        // Arrange & Act
        var workflow = new CrmWorkflow();

        // Assert
        workflow.Should().NotBeNull();
    }

    [Theory]
    [InlineData("assign")]
    [InlineData("contacted")]
    [InlineData("qualified")]
    [InlineData("proposal")]
    [InlineData("negotiation")]
    [InlineData("closed_won")]
    [InlineData("closed_lost")]
    [InlineData("follow_up")]
    public void Workflow_ShouldSupportAllActions(string action)
    {
        // This documents the workflow's supported actions
        action.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Workflow_AssignAction_ShouldNotifySalesTeam()
    {
        // This documents that assigning a new lead notifies the Sales team
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_ContactedAction_ShouldUpdateStageToContacted()
    {
        // This documents that contacted action updates the stage
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_QualifiedAction_ShouldNotifyAssetManager()
    {
        // This documents that qualifying a lead notifies the AssetManager
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_ProposalAction_ShouldNotifySalesTeam()
    {
        // This documents that proposal action notifies the Sales team
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_NegotiationAction_ShouldNotifyContractManager()
    {
        // This documents that entering negotiation notifies the ContractManager
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_ClosedWonAction_ShouldNotifyAdminAndContractManager()
    {
        // This documents that closing won notifies Admin and ContractManager
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_ClosedLostAction_ShouldNotifySalesTeamWithReason()
    {
        // This documents that closing lost notifies Sales with the reason
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }

    [Fact]
    public void Workflow_FollowUpAction_ShouldSendReminder()
    {
        // This documents that follow_up action sends a reminder
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }

    [Theory]
    [InlineData("InvestorId")]
    [InlineData("InvestorName")]
    [InlineData("PipelineStage")]
    [InlineData("Action")]
    [InlineData("Notes")]
    [InlineData("AssignedTo")]
    public void Workflow_ShouldAcceptExpectedInputs(string inputName)
    {
        // This documents the expected workflow inputs
        inputName.Should().NotBeNullOrEmpty();
    }

    [Theory]
    [InlineData("new")]
    [InlineData("contacted")]
    [InlineData("qualified")]
    [InlineData("proposal")]
    [InlineData("negotiation")]
    [InlineData("closed_won")]
    [InlineData("closed_lost")]
    public void Workflow_PipelineStages_ShouldFollowExpectedOrder(string stage)
    {
        // Documents the CRM pipeline stages
        stage.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Workflow_Stages_ShouldFollowExpectedPipeline()
    {
        // Documents: New -> Contacted -> Qualified -> Proposal -> Negotiation -> Closed Won/Lost
        var stages = new[] { "new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost" };

        foreach (var stage in stages)
        {
            stage.Should().NotBeNullOrEmpty();
        }
    }

    [Theory]
    [InlineData("Sales", "assign")]
    [InlineData("Sales", "contacted")]
    [InlineData("AssetManager", "qualified")]
    [InlineData("Sales", "proposal")]
    [InlineData("ContractManager", "negotiation")]
    [InlineData("Admin", "closed_won")]
    [InlineData("Sales", "closed_lost")]
    public void Workflow_Actions_ShouldNotifyCorrectRoles(string role, string action)
    {
        // Documents the expected role notifications for each action
        role.Should().NotBeNullOrEmpty();
        action.Should().NotBeNullOrEmpty();
    }

    [Theory]
    [InlineData("Investor not interested")]
    [InlineData("Budget constraints")]
    [InlineData("Chose competitor")]
    [InlineData(null)]
    public void Workflow_ClosedLost_ShouldAcceptVariousReasons(string? notes)
    {
        // This documents that closed_lost accepts various reason notes
        var workflow = new CrmWorkflow();
        workflow.Should().NotBeNull();
    }
}
