using MediatR;

namespace UserManager.Application.Queries;

public record GetDashboardStatsQuery : IRequest<DashboardStatsResult>;

public record DashboardStatsResult(
    int TotalUsers,
    int ActiveUsers,
    int TotalAssets,
    int AssetsInReview,
    int TotalContracts,
    int ActiveContracts,
    int TotalInvestors,
    int TotalIsnadForms,
    int PendingIsnadForms,
    decimal TotalContractValue);
