using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;
using UserManager.Domain.Enums;
using UserManager.Workflows.Activities;

namespace UserManager.Workflows.Workflows;

public class AssetRegistrationWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        var assetId = builder.WithVariable<Guid>();
        var assetCode = builder.WithVariable<string>();
        var action = builder.WithVariable<string>();
        var reason = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("Asset Registration Workflow Started"),
                new SetVariable<Guid>(assetId, context => context.GetInput<Guid>("AssetId")),
                new SetVariable<string>(assetCode, context => context.GetInput<string>("AssetCode") ?? ""),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? "pending"),
                new SetVariable<string>(reason, context => context.GetInput<string>("Reason") ?? ""),

                new WriteLine(context => $"Processing asset: {assetCode.Get(context)}, Action: {action.Get(context)}"),

                // Handle approve action
                new If
                {
                    Condition = new(context => action.Get(context) == "approve"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Approving asset {assetCode.Get(context)}"),
                            new UpdateAssetStatusActivity
                            {
                                AssetId = new(context => assetId.Get(context)),
                                NewStatus = new(AssetStatus.Completed),
                                Reason = new(context => reason.Get(context)),
                                SetVisibleToInvestors = new(true)
                            },
                            new WriteLine("Asset approved and visible to investors")
                        }
                    }
                },

                // Handle reject action
                new If
                {
                    Condition = new(context => action.Get(context) == "reject"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Rejecting asset {assetCode.Get(context)}"),
                            new UpdateAssetStatusActivity
                            {
                                AssetId = new(context => assetId.Get(context)),
                                NewStatus = new(AssetStatus.Rejected),
                                Reason = new(context => reason.Get(context)),
                                SetVisibleToInvestors = new(false)
                            },
                            new WriteLine("Asset rejected")
                        }
                    }
                },

                // Handle request_changes action
                new If
                {
                    Condition = new(context => action.Get(context) == "request_changes"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Returning asset {assetCode.Get(context)} for changes"),
                            new UpdateAssetStatusActivity
                            {
                                AssetId = new(context => assetId.Get(context)),
                                NewStatus = new(AssetStatus.Draft),
                                Reason = new(context => reason.Get(context)),
                                SetVisibleToInvestors = new(false)
                            },
                            new WriteLine("Asset returned to draft for changes")
                        }
                    }
                },

                // Handle submit action (move to InReview)
                new If
                {
                    Condition = new(context => action.Get(context) == "submit"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Submitting asset {assetCode.Get(context)} for review"),
                            new UpdateAssetStatusActivity
                            {
                                AssetId = new(context => assetId.Get(context)),
                                NewStatus = new(AssetStatus.InReview),
                                Reason = new(context => null as string),
                                SetVisibleToInvestors = new(false)
                            },
                            new SendNotificationActivity
                            {
                                RoleName = new("AssetManager"),
                                Type = new("info"),
                                Title = new("New Asset for Review"),
                                Message = new(context => $"Asset '{assetCode.Get(context)}' has been submitted for review."),
                                EntityType = new("Asset"),
                                EntityId = new(context => assetId.Get(context))
                            },
                            new WriteLine("Asset submitted for review")
                        }
                    }
                },

                // Handle pending (no action yet)
                new If
                {
                    Condition = new(context => action.Get(context) == "pending" || string.IsNullOrEmpty(action.Get(context))),
                    Then = new WriteLine("Asset is pending review - no action taken")
                },

                new WriteLine("Asset Registration Workflow Completed")
            }
        };
    }
}
