using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Application.Interfaces;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;

namespace UserManager.Workflows.Activities;

public class UpdateAssetStatusActivity : CodeActivity<bool>
{
    public Input<Guid> AssetId { get; set; } = default!;
    public Input<AssetStatus> NewStatus { get; set; } = default!;
    public Input<string?> Reason { get; set; } = default!;
    public Input<bool> SetVisibleToInvestors { get; set; } = default!;

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        var assetId = AssetId.Get(context);
        var newStatus = NewStatus.Get(context);
        var reason = Reason.Get(context);
        var setVisible = SetVisibleToInvestors.Get(context);

        var dbContext = context.GetRequiredService<IAppDbContext>();
        var notificationService = context.GetRequiredService<INotificationService>();

        var asset = await dbContext.Assets.FirstOrDefaultAsync(a => a.Id == assetId);
        if (asset == null)
        {
            context.SetResult(false);
            return;
        }

        var previousStatus = asset.Status;
        asset.Status = newStatus;
        asset.UpdatedAt = DateTime.UtcNow;

        if (newStatus == AssetStatus.Completed)
        {
            asset.CompletedAt = DateTime.UtcNow;
            asset.VisibleToInvestors = setVisible;
        }
        else if (newStatus == AssetStatus.Rejected)
        {
            asset.RejectionReason = reason;
            asset.VisibleToInvestors = false;
        }
        else if (newStatus == AssetStatus.Draft)
        {
            // Returned for changes
            asset.VisibilityCount++;
        }

        // Log workflow history
        var history = new AssetWorkflowHistory
        {
            Id = Guid.NewGuid(),
            AssetId = assetId,
            Stage = newStatus.ToString(),
            Action = newStatus == AssetStatus.Completed ? "Approved" :
                     newStatus == AssetStatus.Rejected ? "Rejected" :
                     newStatus == AssetStatus.Draft ? "Returned" : "Updated",
            Comments = reason,
            ReviewerId = "workflow",
            ActionDate = DateTime.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };
        dbContext.AssetWorkflowHistory.Add(history);

        await dbContext.SaveChangesAsync(CancellationToken.None);

        // Send notification to asset creator
        if (!string.IsNullOrEmpty(asset.CreatedBy) && Guid.TryParse(asset.CreatedBy, out var creatorId))
        {
            var title = newStatus switch
            {
                AssetStatus.Completed => "Asset Approved",
                AssetStatus.Rejected => "Asset Rejected",
                AssetStatus.Draft => "Asset Returned for Changes",
                _ => "Asset Status Updated"
            };
            var message = newStatus switch
            {
                AssetStatus.Completed => $"Your asset '{asset.Name}' has been approved and is now visible to investors.",
                AssetStatus.Rejected => $"Your asset '{asset.Name}' has been rejected. Reason: {reason}",
                AssetStatus.Draft => $"Your asset '{asset.Name}' has been returned for changes. Please review and resubmit.",
                _ => $"Asset '{asset.Name}' status changed to {newStatus}."
            };

            await notificationService.NotifyUserAsync(
                creatorId,
                newStatus == AssetStatus.Rejected ? "warning" : "success",
                title,
                message,
                $"/assets/{assetId}",
                "Asset",
                assetId,
                CancellationToken.None);
        }

        context.SetResult(true);
    }
}
