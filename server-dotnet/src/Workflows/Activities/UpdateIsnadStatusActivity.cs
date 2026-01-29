using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;

namespace UserManager.Workflows.Activities;

public class UpdateIsnadStatusActivity : CodeActivity<bool>
{
    private static readonly Dictionary<IsnadStatus, string> StageAssignees = new()
    {
        { IsnadStatus.Draft, "submitter" },
        { IsnadStatus.PendingVerification, "school_planning" },
        { IsnadStatus.VerificationDue, "school_planning" },
        { IsnadStatus.ChangesRequested, "submitter" },
        { IsnadStatus.VerifiedFilled, "investment_agency" },
        { IsnadStatus.InvestmentAgencyReview, "asset_manager" },
        { IsnadStatus.InPackage, "package_manager" },
        { IsnadStatus.PendingCeo, "ceo" },
        { IsnadStatus.PendingMinister, "minister" },
        { IsnadStatus.Approved, "completed" }
    };

    private static readonly Dictionary<IsnadStatus, int> SlaDays = new()
    {
        { IsnadStatus.PendingVerification, 5 },
        { IsnadStatus.VerificationDue, 2 },
        { IsnadStatus.VerifiedFilled, 3 },
        { IsnadStatus.InvestmentAgencyReview, 5 },
        { IsnadStatus.PendingCeo, 7 },
        { IsnadStatus.PendingMinister, 10 }
    };

    public Input<Guid> FormId { get; set; } = default!;
    public Input<IsnadStatus> NewStatus { get; set; } = default!;
    public Input<string?> Reason { get; set; } = default!;
    public Input<string?> PerformedBy { get; set; } = default!;

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        var formId = FormId.Get(context);
        var newStatus = NewStatus.Get(context);
        var reason = Reason.Get(context);
        var performedBy = PerformedBy.Get(context) ?? "workflow";

        var dbContext = context.GetRequiredService<IAppDbContext>();
        var notificationService = context.GetRequiredService<INotificationService>();

        var form = await dbContext.IsnadForms
            .Include(f => f.Asset)
            .FirstOrDefaultAsync(f => f.Id == formId);

        if (form == null)
        {
            context.SetResult(false);
            return;
        }

        var previousStatus = form.Status;
        form.Status = newStatus;
        form.UpdatedAt = DateTime.UtcNow;

        // Set stage assignment
        if (StageAssignees.TryGetValue(newStatus, out var assignee))
        {
            form.CurrentStage = assignee;
        }

        // Set SLA deadline
        if (SlaDays.TryGetValue(newStatus, out var days))
        {
            form.SlaDeadline = DateTime.UtcNow.AddDays(days);
            form.SlaStatus = "on_track";
        }

        // Handle specific status transitions
        if (newStatus == IsnadStatus.ChangesRequested)
        {
            form.ReturnCount++;
            form.ReturnedByStage = previousStatus.ToString();
            form.ReturnReason = reason;
        }
        else if (newStatus == IsnadStatus.Approved)
        {
            form.CompletedAt = DateTime.UtcNow;
            form.SlaStatus = "completed";
        }
        else if (newStatus == IsnadStatus.Rejected || newStatus == IsnadStatus.Cancelled)
        {
            form.CancellationReason = reason;
            form.CancelledAt = DateTime.UtcNow;
            form.CancelledBy = performedBy;
        }

        await dbContext.SaveChangesAsync(CancellationToken.None);

        // Notify the next assignee
        var notifyTitle = newStatus switch
        {
            IsnadStatus.PendingVerification => "ISNAD Form Awaiting Verification",
            IsnadStatus.VerifiedFilled => "ISNAD Form Ready for Review",
            IsnadStatus.InvestmentAgencyReview => "ISNAD Form Ready for Agency Review",
            IsnadStatus.PendingCeo => "ISNAD Package Awaiting CEO Approval",
            IsnadStatus.PendingMinister => "ISNAD Package Awaiting Minister Approval",
            IsnadStatus.Approved => "ISNAD Form Approved",
            IsnadStatus.ChangesRequested => "ISNAD Form Returned for Changes",
            IsnadStatus.Rejected => "ISNAD Form Rejected",
            _ => $"ISNAD Form Status: {newStatus}"
        };

        var notifyMessage = $"ISNAD form '{form.ReferenceNumber}' has been moved to {newStatus}. " +
                           (string.IsNullOrEmpty(reason) ? "" : $"Reason: {reason}");

        // Notify role-based on stage
        var roleToNotify = newStatus switch
        {
            IsnadStatus.PendingVerification => "SchoolPlanning",
            IsnadStatus.InvestmentAgencyReview => "AssetManager",
            IsnadStatus.PendingCeo => "CEO",
            IsnadStatus.PendingMinister => "Minister",
            _ => null
        };

        if (!string.IsNullOrEmpty(roleToNotify))
        {
            await notificationService.NotifyRoleAsync(
                roleToNotify,
                "info",
                notifyTitle,
                notifyMessage,
                CancellationToken.None);
        }

        // Also notify the submitter for changes/rejection/approval
        if (newStatus == IsnadStatus.ChangesRequested ||
            newStatus == IsnadStatus.Rejected ||
            newStatus == IsnadStatus.Approved)
        {
            if (Guid.TryParse(form.CreatedBy, out var submitterId))
            {
                await notificationService.NotifyUserAsync(
                    submitterId,
                    newStatus == IsnadStatus.Approved ? "success" : "warning",
                    notifyTitle,
                    notifyMessage,
                    $"/isnad-forms/{formId}",
                    "IsnadForm",
                    formId,
                    CancellationToken.None);
            }
        }

        context.SetResult(true);
    }
}
