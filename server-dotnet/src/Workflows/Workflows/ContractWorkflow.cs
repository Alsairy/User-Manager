using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;

namespace UserManager.Workflows.Workflows;

/// <summary>
/// Contract Workflow - handles contract lifecycle
/// Stages: Draft -> Active -> Expiring -> Expired/Cancelled
/// Monitors installment payments and contract expiry
/// </summary>
public class ContractWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        var contractId = builder.WithVariable<Guid>();
        var contractCode = builder.WithVariable<string>();
        var status = builder.WithVariable<string>();
        var action = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("Contract Workflow Started"),
                new SetVariable<Guid>(contractId, context => context.GetInput<Guid>("ContractId")),
                new SetVariable<string>(contractCode, context => context.GetInput<string>("ContractCode") ?? ""),
                new SetVariable<string>(status, context => context.GetInput<string>("Status") ?? "draft"),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? ""),

                new WriteLine(context => $"Contract: {contractCode.Get(context)}"),
                new WriteLine(context => $"Status: {status.Get(context)}"),

                // Status: DRAFT
                new If
                {
                    Condition = new(context => status.Get(context) == "draft"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Status: DRAFT"),
                            new WriteLine("Validating contract completeness"),
                            new WriteLine("Awaiting signing")
                        }
                    }
                },

                // Status: ACTIVE
                new If
                {
                    Condition = new(context => status.Get(context) == "active"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Status: ACTIVE"),
                            new WriteLine("Contract is in force"),
                            new WriteLine("Monitoring installment payments"),
                            new WriteLine("Checking for expiry (30 days before end)")
                        }
                    }
                },

                // Status: EXPIRING
                new If
                {
                    Condition = new(context => status.Get(context) == "expiring"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Status: EXPIRING"),
                            new WriteLine("Contract ending in 30 days"),
                            new WriteLine("Sending renewal notifications")
                        }
                    }
                },

                // Status: EXPIRED
                new If
                {
                    Condition = new(context => status.Get(context) == "expired"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Status: EXPIRED"),
                            new WriteLine("Contract has ended"),
                            new WriteLine("Archiving contract")
                        }
                    }
                },

                // Status: CANCELLED
                new If
                {
                    Condition = new(context => status.Get(context) == "cancelled"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Status: CANCELLED"),
                            new WriteLine("Contract terminated"),
                            new WriteLine("Notifying all parties")
                        }
                    }
                },

                // Handle specific actions: activate
                new If
                {
                    Condition = new(context => action.Get(context) == "activate"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Action: Activating contract"),
                            new WriteLine("Generating installment plan"),
                            new WriteLine("Notifying investor and admin")
                        }
                    }
                },

                // Handle specific actions: cancel
                new If
                {
                    Condition = new(context => action.Get(context) == "cancel"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Action: Cancelling contract"),
                            new WriteLine("Validating cancellation reason"),
                            new WriteLine("Archiving and notifying parties")
                        }
                    }
                },

                // Handle specific actions: installment_overdue
                new If
                {
                    Condition = new(context => action.Get(context) == "installment_overdue"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Action: Installment overdue"),
                            new WriteLine("Marking installment as overdue"),
                            new WriteLine("Sending reminder notifications")
                        }
                    }
                },

                new WriteLine("Contract Workflow Step Completed")
            }
        };
    }
}
