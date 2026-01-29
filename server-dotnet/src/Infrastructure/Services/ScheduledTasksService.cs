using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;
using UserManager.Domain.Events;

namespace UserManager.Infrastructure.Services;

public class ScheduledTasksService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ScheduledTasksService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(1); // Run hourly

    public ScheduledTasksService(IServiceProvider serviceProvider, ILogger<ScheduledTasksService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Scheduled Tasks Service started");

        // Wait for app to fully start
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunScheduledTasksAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running scheduled tasks");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task RunScheduledTasksAsync(CancellationToken ct)
    {
        _logger.LogInformation("Running scheduled tasks at {Time}", DateTime.UtcNow);

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        await CheckExpiringContractsAsync(dbContext, notificationService, ct);
        await CheckOverdueInstallmentsAsync(dbContext, notificationService, emailService, ct);
        await CheckIsnadSlaDeadlinesAsync(dbContext, notificationService, ct);
    }

    private async Task CheckExpiringContractsAsync(
        IAppDbContext dbContext,
        INotificationService notificationService,
        CancellationToken ct)
    {
        var thirtyDaysFromNow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Mark contracts as Expiring (30 days before end)
        var expiring = await dbContext.Contracts
            .Where(c => c.Status == ContractStatus.Active && c.EndDate <= thirtyDaysFromNow && c.EndDate > today)
            .ToListAsync(ct);

        foreach (var contract in expiring)
        {
            contract.Status = ContractStatus.Expiring;
            contract.UpdatedAt = DateTimeOffset.UtcNow;

            // Notify Admin
            await notificationService.NotifyRoleAsync(
                "Admin",
                "warning",
                "Contract Expiring Soon",
                $"Contract '{contract.ContractCode}' will expire on {contract.EndDate:d}. Please review for renewal.",
                ct);

            // Note: Investors don't have user accounts, so we can only notify by email if needed
            // For now, admin notification is sufficient

            _logger.LogInformation("Contract {Code} marked as Expiring", contract.ContractCode);
        }

        // Mark contracts as Expired
        var expired = await dbContext.Contracts
            .Where(c => (c.Status == ContractStatus.Active || c.Status == ContractStatus.Expiring) && c.EndDate <= today)
            .ToListAsync(ct);

        foreach (var contract in expired)
        {
            contract.Status = ContractStatus.Expired;
            contract.UpdatedAt = DateTimeOffset.UtcNow;

            await notificationService.NotifyRoleAsync(
                "Admin",
                "info",
                "Contract Expired",
                $"Contract '{contract.ContractCode}' has expired.",
                ct);

            _logger.LogInformation("Contract {Code} marked as Expired", contract.ContractCode);
        }

        if (expiring.Count > 0 || expired.Count > 0)
        {
            await dbContext.SaveChangesAsync(ct);
        }
    }

    private async Task CheckOverdueInstallmentsAsync(
        IAppDbContext dbContext,
        INotificationService notificationService,
        IEmailService emailService,
        CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var overdue = await dbContext.Installments
            .Include(i => i.Contract)
            .Where(i => i.Status == InstallmentStatus.Pending && i.DueDate < today)
            .ToListAsync(ct);

        foreach (var installment in overdue)
        {
            installment.Status = InstallmentStatus.Overdue;
            installment.UpdatedAt = DateTimeOffset.UtcNow;

            installment.AddDomainEvent(new InstallmentOverdueEvent(
                installment.Id,
                installment.ContractId,
                installment.InstallmentNumber,
                installment.AmountDue));

            var title = "Installment Payment Overdue";
            var message = $"Installment #{installment.InstallmentNumber} for contract '{installment.Contract?.ContractCode}' " +
                         $"(Amount: {installment.AmountDue:C}) is overdue.";

            // Notify Admin
            await notificationService.NotifyRoleAsync("Admin", "warning", title, message, ct);

            // Send email to investor if available
            if (installment.Contract != null)
            {
                var investor = await dbContext.Investors.FirstOrDefaultAsync(i => i.Id == installment.Contract.InvestorId, ct);
                if (investor != null && !string.IsNullOrEmpty(investor.Email))
                {
                    try
                    {
                        await emailService.SendAsync(
                            investor.Email,
                            title,
                            $"<h2>Payment Reminder</h2><p>{message}</p><p>Please make your payment as soon as possible.</p>",
                            ct);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to send overdue email");
                    }
                }
            }

            _logger.LogWarning("Installment {Id} for contract {Code} is overdue",
                installment.Id, installment.Contract?.ContractCode);
        }

        if (overdue.Count() > 0)
        {
            await dbContext.SaveChangesAsync(ct);
        }
    }

    private async Task CheckIsnadSlaDeadlinesAsync(
        IAppDbContext dbContext,
        INotificationService notificationService,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var breached = await dbContext.IsnadForms
            .Where(f => f.SlaDeadline != null && f.SlaDeadline < now &&
                       f.SlaStatus != "breached" &&
                       f.Status != IsnadStatus.Approved &&
                       f.Status != IsnadStatus.Rejected &&
                       f.Status != IsnadStatus.Cancelled)
            .ToListAsync(ct);

        foreach (var form in breached)
        {
            form.SlaStatus = "breached";
            form.UpdatedAt = DateTimeOffset.UtcNow;

            var title = "ISNAD SLA Breached";
            var message = $"ISNAD form '{form.ReferenceNumber}' has breached its SLA deadline. " +
                         $"Current stage: {form.CurrentStage}. Deadline was: {form.SlaDeadline:g}.";

            // Notify Admin for escalation
            await notificationService.NotifyRoleAsync("Admin", "error", title, message, ct);

            // Notify current stage assignee role
            var roleToNotify = form.Status switch
            {
                IsnadStatus.PendingVerification or IsnadStatus.VerificationDue => "SchoolPlanning",
                IsnadStatus.InvestmentAgencyReview => "AssetManager",
                IsnadStatus.PendingCeo => "CEO",
                IsnadStatus.PendingMinister => "Minister",
                _ => null
            };

            if (!string.IsNullOrEmpty(roleToNotify))
            {
                await notificationService.NotifyRoleAsync(roleToNotify, "error", title, message, ct);
            }

            _logger.LogWarning("ISNAD form {Ref} has breached SLA deadline", form.ReferenceNumber);
        }

        if (breached.Count() > 0)
        {
            await dbContext.SaveChangesAsync(ct);
        }
    }
}
