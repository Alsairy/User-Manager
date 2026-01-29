using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;

namespace UserManager.Workflows.Workflows;

public class AssetRegistrationWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        var assetId = builder.WithVariable<Guid>();
        var assetCode = builder.WithVariable<string>();
        var action = builder.WithVariable<string>();

        builder.Root = new Sequence
        {
            Activities =
            {
                new WriteLine("Asset Registration Workflow Started"),
                new SetVariable<Guid>(assetId, context => context.GetInput<Guid>("AssetId")),
                new SetVariable<string>(assetCode, context => context.GetInput<string>("AssetCode") ?? ""),
                new WriteLine(context => $"Processing asset: {assetCode.Get(context)}"),

                // Wait for review action
                new WriteLine("Asset submitted for review - awaiting reviewer action"),
                new SetVariable<string>(action, context => context.GetInput<string>("Action") ?? "pending"),

                // Handle approve action
                new If
                {
                    Condition = new(context => action.Get(context) == "approve"),
                    Then = new Sequence
                    {
                        Activities =
                        {
                            new WriteLine(context => $"Asset {assetCode.Get(context)} APPROVED"),
                            new WriteLine("Setting status to Completed, notifying creator"),
                            new WriteLine("Asset is now visible to investors")
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
                            new WriteLine(context => $"Asset {assetCode.Get(context)} REJECTED"),
                            new WriteLine("Setting status to Rejected, notifying creator with reason")
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
                            new WriteLine(context => $"Asset {assetCode.Get(context)} returned for changes"),
                            new WriteLine("Returning to Draft, incrementing return count"),
                            new WriteLine("Notifying creator to make changes")
                        }
                    }
                },

                // Handle pending (default) action
                new If
                {
                    Condition = new(context => action.Get(context) == "pending" || string.IsNullOrEmpty(action.Get(context))),
                    Then = new WriteLine("Asset is pending review")
                },

                new WriteLine("Asset Registration Workflow Completed")
            }
        };
    }
}
