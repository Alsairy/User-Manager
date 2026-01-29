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
    private readonly TimeSpan _interval = TimeSpan.FromHours(24); // Run daily

    public ScheduledTasksService(IServiceProvider serviceProvider, ILogger<ScheduledTasksService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Scheduled Tasks Service started");

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
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        await CheckExpiringContractsAsync(dbContext, ct);
        await CheckOverdueInstallmentsAsync(dbContext, ct);
        await CheckIsnadSlaDeadlinesAsync(dbContext, ct);
    }

    private async Task CheckExpiringContractsAsync(IAppDbContext dbContext, CancellationToken ct)
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
            _logger.LogInformation("Contract {Code} marked as Expired", contract.ContractCode);
        }

        if (expiring.Count > 0 || expired.Count > 0)
        {
            await dbContext.SaveChangesAsync(ct);
        }
    }

    private async Task CheckOverdueInstallmentsAsync(IAppDbContext dbContext, CancellationToken ct)
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

            _logger.LogWarning("Installment {Id} for contract {Code} is overdue",
                installment.Id, installment.Contract.ContractCode);
        }

        if (overdue.Count > 0)
        {
            await dbContext.SaveChangesAsync(ct);
        }
    }

    private async Task CheckIsnadSlaDeadlinesAsync(IAppDbContext dbContext, CancellationToken ct)
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
            _logger.LogWarning("ISNAD form {Ref} has breached SLA deadline", form.ReferenceNumber);
        }

        if (breached.Count > 0)
        {
            await dbContext.SaveChangesAsync(ct);
        }
    }
}
