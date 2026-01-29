using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;
using UserManager.Workflows.Activities;

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
        var investorName = builder.WithVariable<string>();
        var pipelineStage = builder.WithVariable<string>();
        var action = builder.WithVariable<string>();
        var notes = builder.WithVariable<string>();
        var assignedTo = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("CRM Workflow Started"),
                new SetVariable<Guid>(investorId, context => context.GetInput<Guid>("InvestorId")),
                new SetVariable<string>(investorName, context => context.GetInput<string>("InvestorName") ?? ""),
                new SetVariable<string>(pipelineStage, context => context.GetInput<string>("PipelineStage") ?? "new"),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? ""),
                new SetVariable<string>(notes, context => context.GetInput<string>("Notes") ?? ""),
                new SetVariable<string>(assignedTo, context => context.GetInput<string>("AssignedTo") ?? ""),

                new WriteLine(context => $"Investor: {investorName.Get(context)}, Stage: {pipelineStage.Get(context)}, Action: {action.Get(context)}"),

                // Stage: NEW LEAD - Assign to sales team
                new If
                {
                    Condition = new(context => pipelineStage.Get(context) == "new" && action.Get(context) == "assign"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Assigning new lead '{investorName.Get(context)}' to sales team"),
                            new SendNotificationActivity
                            {
                                RoleName = new("Sales"),
                                Type = new("info"),
                                Title = new("New Lead Assigned"),
                                Message = new(context => $"A new investor lead '{investorName.Get(context)}' has been assigned for initial contact."),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            }
                        }
                    }
                },

                // Action: Move to Contacted
                new If
                {
                    Condition = new(context => action.Get(context) == "contacted"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Investor '{investorName.Get(context)}' contacted"),
                            new SendNotificationActivity
                            {
                                RoleName = new("Sales"),
                                Type = new("info"),
                                Title = new("Lead Contacted"),
                                Message = new(context => $"Initial contact made with '{investorName.Get(context)}'. Ready for qualification."),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            }
                        }
                    }
                },

                // Action: Move to Qualified
                new If
                {
                    Condition = new(context => action.Get(context) == "qualified"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Investor '{investorName.Get(context)}' qualified"),
                            new SendNotificationActivity
                            {
                                RoleName = new("AssetManager"),
                                Type = new("success"),
                                Title = new("Lead Qualified"),
                                Message = new(context => $"Investor '{investorName.Get(context)}' has been qualified and is ready for asset presentation."),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            }
                        }
                    }
                },

                // Action: Send Proposal
                new If
                {
                    Condition = new(context => action.Get(context) == "proposal"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Sending proposal to investor '{investorName.Get(context)}'"),
                            new SendNotificationActivity
                            {
                                RoleName = new("Sales"),
                                Type = new("info"),
                                Title = new("Proposal Sent"),
                                Message = new(context => $"Investment proposal sent to '{investorName.Get(context)}'. Awaiting response."),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            }
                        }
                    }
                },

                // Action: Enter Negotiation
                new If
                {
                    Condition = new(context => action.Get(context) == "negotiation"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Entering negotiation with investor '{investorName.Get(context)}'"),
                            new SendNotificationActivity
                            {
                                RoleName = new("ContractManager"),
                                Type = new("info"),
                                Title = new("Contract Negotiation Started"),
                                Message = new(context => $"Contract negotiation started with '{investorName.Get(context)}'. Please prepare contract draft."),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            }
                        }
                    }
                },

                // Action: Close Won
                new If
                {
                    Condition = new(context => action.Get(context) == "closed_won"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Deal WON with investor '{investorName.Get(context)}'!"),
                            new SendNotificationActivity
                            {
                                RoleName = new("Admin"),
                                Type = new("success"),
                                Title = new("Deal Closed - Won!"),
                                Message = new(context => $"Congratulations! Deal closed with investor '{investorName.Get(context)}'. Contract process can begin."),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            },
                            new SendNotificationActivity
                            {
                                RoleName = new("ContractManager"),
                                Type = new("success"),
                                Title = new("New Contract Required"),
                                Message = new(context => $"Deal closed with '{investorName.Get(context)}'. Please create the contract."),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            }
                        }
                    }
                },

                // Action: Close Lost
                new If
                {
                    Condition = new(context => action.Get(context) == "closed_lost"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Deal LOST with investor '{investorName.Get(context)}'"),
                            new SendNotificationActivity
                            {
                                RoleName = new("Sales"),
                                Type = new("warning"),
                                Title = new("Deal Lost"),
                                Message = new(context => $"Deal with '{investorName.Get(context)}' was lost. Reason: {notes.Get(context)}"),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            }
                        }
                    }
                },

                // Action: Follow Up Reminder
                new If
                {
                    Condition = new(context => action.Get(context) == "follow_up"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Follow-up reminder for investor '{investorName.Get(context)}'"),
                            new SendNotificationActivity
                            {
                                RoleName = new("Sales"),
                                Type = new("info"),
                                Title = new("Follow-up Reminder"),
                                Message = new(context => $"Time to follow up with investor '{investorName.Get(context)}'. {notes.Get(context)}"),
                                EntityType = new("Investor"),
                                EntityId = new(context => investorId.Get(context))
                            }
                        }
                    }
                },

                new WriteLine("CRM Workflow Step Completed")
            }
        };
    }
}
