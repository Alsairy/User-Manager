using MediatR;
using Microsoft.EntityFrameworkCore;
using UserManager.Application.Interfaces;
using UserManager.Domain.Enums;

namespace UserManager.Application.Queries;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsResult>
{
    private readonly IAppDbContext _dbContext;
    private readonly ICacheService _cacheService;

    public GetDashboardStatsQueryHandler(IAppDbContext dbContext, ICacheService cacheService)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
    }

    public async Task<DashboardStatsResult> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        return await _cacheService.GetOrSetAsync(
            CacheKeys.DashboardStats,
            async () => await FetchStatsFromDatabase(cancellationToken),
            CacheDurations.Short,
            cancellationToken);
    }

    private async Task<DashboardStatsResult> FetchStatsFromDatabase(CancellationToken cancellationToken)
    {
        var totalUsers = await _dbContext.Users.CountAsync(cancellationToken);
        var activeUsers = await _dbContext.Users.CountAsync(u => u.Status == UserStatus.Active, cancellationToken);
        var totalAssets = await _dbContext.Assets.CountAsync(cancellationToken);
        var assetsInReview = await _dbContext.Assets.CountAsync(a => a.Status == AssetStatus.InReview, cancellationToken);
        var totalContracts = await _dbContext.Contracts.CountAsync(cancellationToken);
        var activeContracts = await _dbContext.Contracts.CountAsync(c => c.Status == ContractStatus.Active, cancellationToken);
        var totalInvestors = await _dbContext.Investors.CountAsync(cancellationToken);
        var totalIsnadForms = await _dbContext.IsnadForms.CountAsync(cancellationToken);
        var pendingIsnadForms = await _dbContext.IsnadForms.CountAsync(f =>
            f.Status == IsnadStatus.PendingVerification || f.Status == IsnadStatus.VerificationDue, cancellationToken);
        var totalContractValue = await _dbContext.Contracts
            .Where(c => c.Status == ContractStatus.Active)
            .SumAsync(c => c.TotalContractAmount, cancellationToken);

        return new DashboardStatsResult(
            totalUsers, activeUsers, totalAssets, assetsInReview,
            totalContracts, activeContracts, totalInvestors,
            totalIsnadForms, pendingIsnadForms, totalContractValue);
    }
}
