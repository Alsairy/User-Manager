using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;

namespace UserManager.Workflows.Workflows;

public class IsnadWorkflow : WorkflowBase
{
    // ISNAD 12-Stage Government Approval Process
    private static readonly string[] Stages = new[]
    {
        "draft",
        "pending_verification",
        "verification_due",
        "changes_requested",
        "verified_filled",
        "investment_agency_review",
        "in_package",
        "pending_ceo",
        "pending_minister",
        "approved"
    };

    protected override void Build(IWorkflowBuilder builder)
    {
        var formId = builder.WithVariable<Guid>();
        var referenceNumber = builder.WithVariable<string>();
        var currentStage = builder.WithVariable<string>();
        var action = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("ISNAD Workflow Started - Government Approval Process"),
                new SetVariable<Guid>(formId, context => context.GetInput<Guid>("FormId")),
                new SetVariable<string>(referenceNumber, context => context.GetInput<string>("ReferenceNumber") ?? ""),
                new SetVariable<string>(currentStage, context => context.GetInput<string>("CurrentStage") ?? "draft"),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? "advance"),

                new WriteLine(context => $"ISNAD Form: {referenceNumber.Get(context)}"),
                new WriteLine(context => $"Current Stage: {currentStage.Get(context)}"),

                // Stage: DRAFT
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "draft"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: DRAFT - Form being prepared"),
                            new WriteLine("Awaiting submission to verification")
                        }
                    }
                },

                // Stage: PENDING VERIFICATION
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "pending_verification"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: PENDING VERIFICATION"),
                            new WriteLine("Assigned to School Planning department"),
                            new WriteLine("SLA: 5 business days")
                        }
                    }
                },

                // Stage: VERIFICATION DUE
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "verification_due"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: VERIFICATION DUE"),
                            new WriteLine("Verification deadline approaching"),
                            new WriteLine("Escalation may be triggered")
                        }
                    }
                },

                // Stage: VERIFIED & FILLED
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "verified_filled"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: VERIFIED & FILLED"),
                            new WriteLine("Ready for Investment Agency review")
                        }
                    }
                },

                // Stage: INVESTMENT AGENCY REVIEW
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "investment_agency_review"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: INVESTMENT AGENCY REVIEW"),
                            new WriteLine("Asset Manager reviewing for packaging")
                        }
                    }
                },

                // Stage: IN PACKAGE
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "in_package"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: IN PACKAGE"),
                            new WriteLine("Form included in approval package"),
                            new WriteLine("Awaiting CEO/Minister batch review")
                        }
                    }
                },

                // Stage: PENDING CEO APPROVAL
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "pending_ceo"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: PENDING CEO APPROVAL"),
                            new WriteLine("Package submitted to CEO")
                        }
                    }
                },

                // Stage: PENDING MINISTER APPROVAL
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "pending_minister"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: PENDING MINISTER APPROVAL"),
                            new WriteLine("Final approval stage")
                        }
                    }
                },

                // Stage: APPROVED
                new If
                {
                    Condition = new(context => currentStage.Get(context) == "approved"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Stage: APPROVED"),
                            new WriteLine("ISNAD form fully approved"),
                            new WriteLine("Contract can now be created")
                        }
                    }
                },

                // Handle actions: advance
                new If
                {
                    Condition = new(context => action.Get(context) == "advance"),
                    Then = new WriteLine("Action: Advancing to next stage")
                },

                // Handle actions: return
                new If
                {
                    Condition = new(context => action.Get(context) == "return"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Action: Returning for changes"),
                            new WriteLine("Incrementing return count"),
                            new WriteLine("Notifying submitter")
                        }
                    }
                },

                // Handle actions: reject
                new If
                {
                    Condition = new(context => action.Get(context) == "reject"),
                    Then = new WriteLine("Action: Form rejected")
                },

                // Handle actions: escalate
                new If
                {
                    Condition = new(context => action.Get(context) == "escalate"),
                    Then = new WriteLine("Action: SLA breach - escalating")
                },

                new WriteLine("ISNAD Workflow Step Completed")
            }
        };
    }
}
