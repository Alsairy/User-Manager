using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;
using UserManager.Workflows.Activities;

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
        var investorId = builder.WithVariable<Guid>();
        var assetId = builder.WithVariable<Guid>();
        var action = builder.WithVariable<string>();
        var reason = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("Portal Workflow Started"),
                new SetVariable<string>(requestType, context => context.GetInput<string>("RequestType") ?? "interest"),
                new SetVariable<Guid>(requestId, context => context.GetInput<Guid>("RequestId")),
                new SetVariable<Guid>(investorId, context => context.GetInput<Guid>("InvestorId")),
                new SetVariable<Guid>(assetId, context => context.GetInput<Guid>("AssetId")),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? "submitted"),
                new SetVariable<string>(reason, context => context.GetInput<string>("Reason") ?? ""),

                new WriteLine(context => $"Request Type: {requestType.Get(context)}, Action: {action.Get(context)}"),

                // Interest submission
                new If
                {
                    Condition = new(context => requestType.Get(context) == "interest" && action.Get(context) == "submitted"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Processing new investor interest submission"),
                            new SendNotificationActivity
                            {
                                RoleName = new("AssetManager"),
                                Type = new("info"),
                                Title = new("New Investor Interest"),
                                Message = new("A new investor interest has been submitted for review."),
                                EntityType = new("InvestorInterest"),
                                EntityId = new(context => requestId.Get(context))
                            },
                            new WriteLine("Interest submitted for review - notification sent to Asset Manager")
                        }
                    }
                },

                // Interest approved
                new If
                {
                    Condition = new(context => requestType.Get(context) == "interest" && action.Get(context) == "approved"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Interest approved - creating contract opportunity"),
                            new SendNotificationActivity
                            {
                                UserId = new(context => investorId.Get(context)),
                                Type = new("success"),
                                Title = new("Interest Approved"),
                                Message = new("Your investment interest has been approved. Our team will contact you soon to proceed with the contract."),
                                EntityType = new("InvestorInterest"),
                                EntityId = new(context => requestId.Get(context))
                            },
                            new SendEmailActivity
                            {
                                To = new(context => context.GetInput<string>("InvestorEmail") ?? ""),
                                Subject = new("Your Investment Interest Has Been Approved"),
                                Body = new(@"
                                    <h2>Congratulations!</h2>
                                    <p>Your investment interest has been approved.</p>
                                    <p>Our investment team will contact you shortly to discuss the next steps and proceed with the contract process.</p>
                                    <br/>
                                    <p>Best regards,<br/>Madares Business Platform</p>
                                ")
                            }
                        }
                    }
                },

                // Interest rejected
                new If
                {
                    Condition = new(context => requestType.Get(context) == "interest" && action.Get(context) == "rejected"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Interest rejected: {reason.Get(context)}"),
                            new SendNotificationActivity
                            {
                                UserId = new(context => investorId.Get(context)),
                                Type = new("warning"),
                                Title = new("Interest Update"),
                                Message = new(context => $"Your investment interest could not be approved at this time. Reason: {reason.Get(context)}"),
                                EntityType = new("InvestorInterest"),
                                EntityId = new(context => requestId.Get(context))
                            }
                        }
                    }
                },

                // Istifada request submitted
                new If
                {
                    Condition = new(context => requestType.Get(context) == "istifada" && action.Get(context) == "submitted"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Processing Istifada program request"),
                            new SendNotificationActivity
                            {
                                RoleName = new("Admin"),
                                Type = new("info"),
                                Title = new("New Istifada Request"),
                                Message = new("A new Istifada program request has been submitted."),
                                EntityType = new("IstifadaRequest"),
                                EntityId = new(context => requestId.Get(context))
                            }
                        }
                    }
                },

                // Istifada approved
                new If
                {
                    Condition = new(context => requestType.Get(context) == "istifada" && action.Get(context) == "approved"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Istifada program request approved"),
                            new SendNotificationActivity
                            {
                                UserId = new(context => investorId.Get(context)),
                                Type = new("success"),
                                Title = new("Istifada Program Approved"),
                                Message = new("Your Istifada program request has been approved. You can now proceed with the program."),
                                EntityType = new("IstifadaRequest"),
                                EntityId = new(context => requestId.Get(context))
                            }
                        }
                    }
                },

                // Istifada completed
                new If
                {
                    Condition = new(context => requestType.Get(context) == "istifada" && action.Get(context) == "completed"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine("Istifada program completed"),
                            new SendNotificationActivity
                            {
                                UserId = new(context => investorId.Get(context)),
                                Type = new("success"),
                                Title = new("Istifada Program Completed"),
                                Message = new("Congratulations! Your Istifada program has been successfully completed."),
                                EntityType = new("IstifadaRequest"),
                                EntityId = new(context => requestId.Get(context))
                            }
                        }
                    }
                },

                // Favorite added
                new If
                {
                    Condition = new(context => requestType.Get(context) == "favorite" && action.Get(context) == "added"),
                    Then = new WriteLine("Asset added to investor favorites - tracking interest")
                },

                new WriteLine("Portal Workflow Completed")
            }
        };
    }
}
