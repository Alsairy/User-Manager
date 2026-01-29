using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;

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

                new WriteLine(context => $"User: {email.Get(context)}, Action: {action.Get(context)}"),

                // Action: User created - send invitation email
                new If
                {
                    Condition = new(context => action.Get(context) == "created"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("User created with Pending status"),
                            new SendEmailActivity
                            {
                                To = new(context => email.Get(context)),
                                Subject = new("Welcome to Madares Business Platform"),
                                Body = new(context => $@"
                                    <h2>Welcome to Madares Business Platform</h2>
                                    <p>Your account has been created.</p>
                                    <p>Please click the link below to activate your account and set your password.</p>
                                    <p><a href='https://madares.sa/activate?email={email.Get(context)}'>Activate Account</a></p>
                                    <p>If you did not request this account, please ignore this email.</p>
                                    <br/>
                                    <p>Best regards,<br/>Madares Business Platform</p>
                                ")
                            },
                            new SendNotificationActivity
                            {
                                UserId = new(context => userId.Get(context)),
                                Type = new("info"),
                                Title = new("Welcome to Madares Business Platform"),
                                Message = new("Your account has been created. Please check your email for activation instructions.")
                            },
                            new WriteLine("Invitation email sent")
                        }
                    }
                },

                // Action: User activated
                new If
                {
                    Condition = new(context => action.Get(context) == "activated"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Activating user account"),
                            new UpdateUserStatusActivity
                            {
                                UserId = new(context => userId.Get(context)),
                                NewStatus = new(UserStatus.Active),
                                SendEmail = new(true)
                            },
                            new WriteLine("User activated")
                        }
                    }
                },

                // Action: User deactivated
                new If
                {
                    Condition = new(context => action.Get(context) == "deactivated"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Deactivating user account"),
                            new UpdateUserStatusActivity
                            {
                                UserId = new(context => userId.Get(context)),
                                NewStatus = new(UserStatus.Inactive),
                                SendEmail = new(true)
                            },
                            new WriteLine("User deactivated")
                        }
                    }
                },

                // Action: User reactivated
                new If
                {
                    Condition = new(context => action.Get(context) == "reactivated"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Reactivating user account"),
                            new UpdateUserStatusActivity
                            {
                                UserId = new(context => userId.Get(context)),
                                NewStatus = new(UserStatus.Active),
                                SendEmail = new(true)
                            },
                            new WriteLine("User reactivated")
                        }
                    }
                },

                // Action: Resend invitation
                new If
                {
                    Condition = new(context => action.Get(context) == "resend_invitation"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Resending invitation email"),
                            new SendEmailActivity
                            {
                                To = new(context => email.Get(context)),
                                Subject = new("Reminder: Activate Your Madares Business Account"),
                                Body = new(context => $@"
                                    <h2>Reminder: Account Activation</h2>
                                    <p>We noticed you haven't activated your account yet.</p>
                                    <p>Please click the link below to activate your account:</p>
                                    <p><a href='https://madares.sa/activate?email={email.Get(context)}'>Activate Account</a></p>
                                    <br/>
                                    <p>Best regards,<br/>Madares Business Platform</p>
                                ")
                            },
                            new WriteLine("Invitation email resent")
                        }
                    }
                },

                new WriteLine("User Lifecycle Workflow Completed")
            }
        };
    }
}
