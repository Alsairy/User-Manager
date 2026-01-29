using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;

namespace UserManager.Workflows.Workflows;

/// <summary>
/// User Lifecycle Workflow - handles user account states
/// Stages: Created (Pending) -> Activated -> Deactivated/Reactivated
/// Sends invitation emails and manages user status transitions
/// </summary>
public class UserLifecycleWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        var userId = builder.WithVariable<Guid>();
        var email = builder.WithVariable<string>();
        var action = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("User Lifecycle Workflow Started"),
                new SetVariable<Guid>(userId, context => context.GetInput<Guid>("UserId")),
                new SetVariable<string>(email, context => context.GetInput<string>("Email") ?? ""),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? "created"),

                new WriteLine(context => $"User: {email.Get(context)}"),
                new WriteLine(context => $"Action: {action.Get(context)}"),

                // Action: created
                new If
                {
                    Condition = new(context => action.Get(context) == "created"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("User created with Pending status"),
                            new WriteLine("Sending invitation email"),
                            new WriteLine("Awaiting user activation")
                        }
                    }
                },

                // Action: activated
                new If
                {
                    Condition = new(context => action.Get(context) == "activated"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("User activated"),
                            new WriteLine("Status changed to Active"),
                            new WriteLine("User can now access the system")
                        }
                    }
                },

                // Action: deactivated
                new If
                {
                    Condition = new(context => action.Get(context) == "deactivated"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("User deactivated by admin"),
                            new WriteLine("Status changed to Inactive"),
                            new WriteLine("Sending deactivation notification"),
                            new WriteLine("Revoking active sessions")
                        }
                    }
                },

                // Action: reactivated
                new If
                {
                    Condition = new(context => action.Get(context) == "reactivated"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("User reactivated"),
                            new WriteLine("Status changed back to Active"),
                            new WriteLine("Sending reactivation notification")
                        }
                    }
                },

                new WriteLine("User Lifecycle Workflow Completed")
            }
        };
    }
}
