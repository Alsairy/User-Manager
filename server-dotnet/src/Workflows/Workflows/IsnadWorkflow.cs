using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;

namespace UserManager.Workflows.Workflows;

public class IsnadWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        var formId = builder.WithVariable<Guid>();
        var referenceNumber = builder.WithVariable<string>();
        var currentStage = builder.WithVariable<string>();
        var action = builder.WithVariable<string>();
        var reason = builder.WithVariable<string>();
        var performedBy = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("ISNAD Workflow Started - Government Approval Process"),
                new SetVariable<Guid>(formId, context => context.GetInput<Guid>("FormId")),
                new SetVariable<string>(referenceNumber, context => context.GetInput<string>("ReferenceNumber") ?? ""),
                new SetVariable<string>(currentStage, context => context.GetInput<string>("CurrentStage") ?? "draft"),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? "advance"),
                new SetVariable<string>(reason, context => context.GetInput<string>("Reason") ?? ""),
                new SetVariable<string>(performedBy, context => context.GetInput<string>("PerformedBy") ?? "workflow"),

                new WriteLine(context => $"ISNAD Form: {referenceNumber.Get(context)}, Stage: {currentStage.Get(context)}, Action: {action.Get(context)}"),

                // Action: Submit (Draft -> PendingVerification)
                new If
                {
                    Condition = new(context => action.Get(context) == "submit" && currentStage.Get(context) == "draft"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Submitting ISNAD form for verification"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.PendingVerification),
                                Reason = new(context => null as string),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Verify (PendingVerification -> VerifiedFilled)
                new If
                {
                    Condition = new(context => action.Get(context) == "verify" &&
                        (currentStage.Get(context) == "pending_verification" || currentStage.Get(context) == "verification_due")),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Verifying ISNAD form"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.VerifiedFilled),
                                Reason = new(context => null as string),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Send to Agency Review (VerifiedFilled -> InvestmentAgencyReview)
                new If
                {
                    Condition = new(context => action.Get(context) == "send_to_agency" && currentStage.Get(context) == "verified_filled"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Sending to Investment Agency for review"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.InvestmentAgencyReview),
                                Reason = new(context => null as string),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Add to Package (InvestmentAgencyReview -> InPackage)
                new If
                {
                    Condition = new(context => action.Get(context) == "add_to_package" && currentStage.Get(context) == "investment_agency_review"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Adding to approval package"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.InPackage),
                                Reason = new(context => null as string),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Send to CEO (InPackage -> PendingCeo)
                new If
                {
                    Condition = new(context => action.Get(context) == "send_to_ceo" && currentStage.Get(context) == "in_package"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Submitting package to CEO"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.PendingCeo),
                                Reason = new(context => null as string),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: CEO Approve (PendingCeo -> PendingMinister)
                new If
                {
                    Condition = new(context => action.Get(context) == "ceo_approve" && currentStage.Get(context) == "pending_ceo"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("CEO approved - sending to Minister"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.PendingMinister),
                                Reason = new(context => null as string),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Minister Approve (PendingMinister -> Approved)
                new If
                {
                    Condition = new(context => action.Get(context) == "minister_approve" && currentStage.Get(context) == "pending_minister"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Minister approved - ISNAD complete"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.Approved),
                                Reason = new(context => null as string),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Return for Changes (any stage -> ChangesRequested)
                new If
                {
                    Condition = new(context => action.Get(context) == "return"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Returning form for changes: {reason.Get(context)}"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.ChangesRequested),
                                Reason = new(context => reason.Get(context)),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Resubmit after changes (ChangesRequested -> PendingVerification)
                new If
                {
                    Condition = new(context => action.Get(context) == "resubmit" && currentStage.Get(context) == "changes_requested"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Resubmitting after changes"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.PendingVerification),
                                Reason = new(context => null as string),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Reject (any stage -> Rejected)
                new If
                {
                    Condition = new(context => action.Get(context) == "reject"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Rejecting form: {reason.Get(context)}"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.Rejected),
                                Reason = new(context => reason.Get(context)),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                // Action: Cancel (any stage -> Cancelled)
                new If
                {
                    Condition = new(context => action.Get(context) == "cancel"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Cancelling form: {reason.Get(context)}"),
                            new UpdateIsnadStatusActivity
                            {
                                FormId = new(context => formId.Get(context)),
                                NewStatus = new(IsnadStatus.Cancelled),
                                Reason = new(context => reason.Get(context)),
                                PerformedBy = new(context => performedBy.Get(context))
                            }
                        }
                    }
                },

                new WriteLine("ISNAD Workflow Step Completed")
            }
        };
    }
}
