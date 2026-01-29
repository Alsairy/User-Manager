using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;

namespace UserManager.Workflows.Workflows;

/// <summary>
/// Portal Workflow - handles investor interest and Istifada requests
/// Types: Interest submission, Istifada program requests, Favorites management
/// </summary>
public class PortalWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        var requestType = builder.WithVariable<string>();
        var requestId = builder.WithVariable<Guid>();
        var action = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("Portal Workflow Started"),
                new SetVariable<string>(requestType, context => context.GetInput<string>("RequestType") ?? "interest"),
                new SetVariable<Guid>(requestId, context => context.GetInput<Guid>("RequestId")),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? "submitted"),

                new WriteLine(context => $"Request Type: {requestType.Get(context)}"),
                new WriteLine(context => $"Action: {action.Get(context)}"),

                // Interest processing
                new If
                {
                    Condition = new(context => requestType.Get(context) == "interest"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Processing Investor Interest"),
                            new If
                            {
                                Condition = new(context => action.Get(context) == "submitted"),
                                Then = new WriteLine("Interest submitted for review")
                            },
                            new If
                            {
                                Condition = new(context => action.Get(context) == "approved"),
                                Then = new WriteLine("Interest approved - creating contract opportunity")
                            },
                            new If
                            {
                                Condition = new(context => action.Get(context) == "rejected"),
                                Then = new WriteLine("Interest rejected - notifying investor")
                            }
                        }
                    }
                },

                // Istifada processing
                new If
                {
                    Condition = new(context => requestType.Get(context) == "istifada"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Processing Istifada Request"),
                            new If
                            {
                                Condition = new(context => action.Get(context) == "submitted"),
                                Then = new WriteLine("Istifada request submitted")
                            },
                            new If
                            {
                                Condition = new(context => action.Get(context) == "approved"),
                                Then = new WriteLine("Istifada program approved")
                            },
                            new If
                            {
                                Condition = new(context => action.Get(context) == "rejected"),
                                Then = new WriteLine("Istifada request rejected")
                            },
                            new If
                            {
                                Condition = new(context => action.Get(context) == "completed"),
                                Then = new WriteLine("Istifada program completed")
                            }
                        }
                    }
                },

                // Favorites management
                new If
                {
                    Condition = new(context => requestType.Get(context) == "favorite"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Managing Favorites"),
                            new WriteLine("Tracking investor asset interests")
                        }
                    }
                },

                new WriteLine("Portal Workflow Completed")
            }
        };
    }
}
