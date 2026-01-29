using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;

namespace UserManager.Workflows.Activities;

public class UpdateUserStatusActivity : CodeActivity<bool>
{
    public Input<Guid> UserId { get; set; } = default!;
    public Input<UserStatus> NewStatus { get; set; } = default!;
    public Input<bool> SendEmail { get; set; } = default!;

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        var userId = UserId.Get(context);
        var newStatus = NewStatus.Get(context);
        var sendEmail = SendEmail.Get(context);

        var dbContext = context.GetRequiredService<IAppDbContext>();
        var emailService = context.GetRequiredService<IEmailService>();
        var notificationService = context.GetRequiredService<INotificationService>();

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            context.SetResult(false);
            return;
        }

        var previousStatus = user.Status;
        user.Status = newStatus;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(CancellationToken.None);

        // Send notification
        var title = newStatus switch
        {
            UserStatus.Active when previousStatus == UserStatus.Pending => "Welcome! Your Account is Active",
            UserStatus.Active => "Account Reactivated",
            UserStatus.Inactive => "Account Deactivated",
            _ => "Account Status Updated"
        };

        var message = newStatus switch
        {
            UserStatus.Active when previousStatus == UserStatus.Pending =>
                "Your account has been activated. You can now access all features.",
            UserStatus.Active =>
                "Your account has been reactivated. You can now access the system.",
            UserStatus.Inactive =>
                "Your account has been deactivated. Please contact an administrator for assistance.",
            _ => $"Your account status has been updated to {newStatus}."
        };

        await notificationService.NotifyUserAsync(
            userId,
            newStatus == UserStatus.Inactive ? "warning" : "success",
            title,
            message,
            CancellationToken.None);

        // Send email if requested
        if (sendEmail && !string.IsNullOrEmpty(user.Email))
        {
            var emailSubject = title;
            var emailBody = $@"
                <h2>{title}</h2>
                <p>Dear {user.FullName ?? user.Email},</p>
                <p>{message}</p>
                <p>If you have any questions, please contact support.</p>
                <br/>
                <p>Best regards,<br/>Madares Business Platform</p>
            ";

            try
            {
                await emailService.SendAsync(user.Email, emailSubject, emailBody, CancellationToken.None);
            }
            catch
            {
                // Log but don't fail the workflow for email errors
            }
        }

        context.SetResult(true);
    }
}
