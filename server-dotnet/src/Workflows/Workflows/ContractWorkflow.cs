using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;

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
        var reason = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("Contract Workflow Started"),
                new SetVariable<Guid>(contractId, context => context.GetInput<Guid>("ContractId")),
                new SetVariable<string>(contractCode, context => context.GetInput<string>("ContractCode") ?? ""),
                new SetVariable<string>(status, context => context.GetInput<string>("Status") ?? "draft"),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? ""),
                new SetVariable<string>(reason, context => context.GetInput<string>("Reason") ?? ""),

                new WriteLine(context => $"Contract: {contractCode.Get(context)}, Status: {status.Get(context)}, Action: {action.Get(context)}"),

                // Action: Activate contract (Draft -> Active)
                new If
                {
                    Condition = new(context => action.Get(context) == "activate"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Activating contract {contractCode.Get(context)}"),
                            new UpdateContractStatusActivity
                            {
                                ContractId = new(context => contractId.Get(context)),
                                NewStatus = new(ContractStatus.Active),
                                Reason = new(context => null as string),
                                GenerateInstallments = new(true)
                            },
                            new WriteLine("Contract activated with installment plan generated")
                        }
                    }
                },

                // Action: Cancel contract
                new If
                {
                    Condition = new(context => action.Get(context) == "cancel"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Cancelling contract {contractCode.Get(context)}: {reason.Get(context)}"),
                            new UpdateContractStatusActivity
                            {
                                ContractId = new(context => contractId.Get(context)),
                                NewStatus = new(ContractStatus.Cancelled),
                                Reason = new(context => reason.Get(context)),
                                GenerateInstallments = new(false)
                            },
                            new WriteLine("Contract cancelled")
                        }
                    }
                },

                // Action: Complete contract
                new If
                {
                    Condition = new(context => action.Get(context) == "complete"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Completing contract {contractCode.Get(context)}"),
                            new UpdateContractStatusActivity
                            {
                                ContractId = new(context => contractId.Get(context)),
                                NewStatus = new(ContractStatus.Completed),
                                Reason = new(context => null as string),
                                GenerateInstallments = new(false)
                            },
                            new WriteLine("Contract completed successfully")
                        }
                    }
                },

                // Action: Archive contract
                new If
                {
                    Condition = new(context => action.Get(context) == "archive"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Archiving contract {contractCode.Get(context)}"),
                            new UpdateContractStatusActivity
                            {
                                ContractId = new(context => contractId.Get(context)),
                                NewStatus = new(ContractStatus.Archived),
                                Reason = new(context => reason.Get(context)),
                                GenerateInstallments = new(false)
                            },
                            new WriteLine("Contract archived")
                        }
                    }
                },

                // Action: Mark as expiring
                new If
                {
                    Condition = new(context => action.Get(context) == "mark_expiring"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Marking contract {contractCode.Get(context)} as expiring"),
                            new UpdateContractStatusActivity
                            {
                                ContractId = new(context => contractId.Get(context)),
                                NewStatus = new(ContractStatus.Expiring),
                                Reason = new(context => null as string),
                                GenerateInstallments = new(false)
                            },
                            new WriteLine("Contract marked as expiring - renewal notifications sent")
                        }
                    }
                },

                // Action: Mark installments as overdue
                new If
                {
                    Condition = new(context => action.Get(context) == "check_overdue"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Checking for overdue installments"),
                            new MarkInstallmentOverdueActivity
                            {
                                ContractId = new(context => contractId.Get(context))
                            },
                            new WriteLine("Overdue installments processed")
                        }
                    }
                },

                new WriteLine("Contract Workflow Step Completed")
            }
        };
    }
}
