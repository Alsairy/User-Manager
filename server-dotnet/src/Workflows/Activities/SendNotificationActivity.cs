using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Models;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Application.Interfaces;

namespace UserManager.Workflows.Activities;

public class SendNotificationActivity : CodeActivity
{
    public Input<Guid?> UserId { get; set; } = default!;
    public Input<string?> RoleName { get; set; } = default!;
    public new Input<string> Type { get; set; } = default!;
    public Input<string> Title { get; set; } = default!;
    public Input<string> Message { get; set; } = default!;
    public Input<string?> ActionUrl { get; set; } = default!;
    public Input<string?> EntityType { get; set; } = default!;
    public Input<Guid?> EntityId { get; set; } = default!;

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        var userId = UserId.Get(context);
        var roleName = RoleName.Get(context);
        var type = Type.Get(context) ?? "info";
        var title = Title.Get(context);
        var message = Message.Get(context);
        var actionUrl = ActionUrl.Get(context);
        var entityType = EntityType.Get(context);
        var entityId = EntityId.Get(context);

        var notificationService = context.GetRequiredService<INotificationService>();

        if (userId.HasValue)
        {
            await notificationService.NotifyUserAsync(
                userId.Value,
                type,
                title,
                message,
                actionUrl,
                entityType,
                entityId,
                CancellationToken.None);
        }
        else if (!string.IsNullOrEmpty(roleName))
        {
            await notificationService.NotifyRoleAsync(
                roleName,
                type,
                title,
                message,
                CancellationToken.None);
        }
    }
}
