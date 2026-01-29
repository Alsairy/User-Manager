using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;

namespace UserManager.Workflows.Workflows;

/// <summary>
/// CRM Workflow - handles investor pipeline tracking
/// Stages: New -> Contacted -> Qualified -> Proposal -> Negotiation -> Closed Won/Lost
/// </summary>
public class CrmWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        var investorId = builder.WithVariable<Guid>();
        var pipelineStage = builder.WithVariable<string>();
        var action = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("CRM Workflow Started"),
                new SetVariable<Guid>(investorId, context => context.GetInput<Guid>("InvestorId")),
                new SetVariable<string>(pipelineStage, context => context.GetInput<string>("PipelineStage") ?? "new"),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? ""),

                new WriteLine(context => $"Pipeline Stage: {pipelineStage.Get(context)}"),

                // Stage: NEW LEAD
                new If
                {
                    Condition = new(context => pipelineStage.Get(context) == "new"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: NEW LEAD"),
                            new WriteLine("Investor registered in CRM"),
                            new WriteLine("Awaiting initial contact")
                        }
                    }
                },

                // Stage: CONTACTED
                new If
                {
                    Condition = new(context => pipelineStage.Get(context) == "contacted"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: CONTACTED"),
                            new WriteLine("Initial outreach completed"),
                            new WriteLine("Gathering investor requirements")
                        }
                    }
                },

                // Stage: QUALIFIED
                new If
                {
                    Condition = new(context => pipelineStage.Get(context) == "qualified"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: QUALIFIED"),
                            new WriteLine("Investor meets criteria"),
                            new WriteLine("Presenting asset opportunities")
                        }
                    }
                },

                // Stage: PROPOSAL
                new If
                {
                    Condition = new(context => pipelineStage.Get(context) == "proposal"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: PROPOSAL"),
                            new WriteLine("Investment proposal sent"),
                            new WriteLine("Awaiting investor response")
                        }
                    }
                },

                // Stage: NEGOTIATION
                new If
                {
                    Condition = new(context => pipelineStage.Get(context) == "negotiation"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: NEGOTIATION"),
                            new WriteLine("Terms being negotiated"),
                            new WriteLine("Contract draft in progress")
                        }
                    }
                },

                // Stage: CLOSED WON
                new If
                {
                    Condition = new(context => pipelineStage.Get(context) == "closed_won"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: CLOSED WON"),
                            new WriteLine("Deal completed"),
                            new WriteLine("Contract created and activated")
                        }
                    }
                },

                // Stage: CLOSED LOST
                new If
                {
                    Condition = new(context => pipelineStage.Get(context) == "closed_lost"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: CLOSED LOST"),
                            new WriteLine("Opportunity lost"),
                            new WriteLine("Recording reason for loss")
                        }
                    }
                },

                new WriteLine("CRM Workflow Step Completed")
            }
        };
    }
}
