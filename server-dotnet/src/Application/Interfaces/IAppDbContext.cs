using Microsoft.EntityFrameworkCore;
using UserManager.Domain.Entities;

namespace UserManager.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<AssetWorkflowHistory> AssetWorkflowHistory { get; }
    DbSet<AssetVisibilityHistory> AssetVisibilityHistory { get; }
    DbSet<Asset> Assets { get; }
    DbSet<IsnadForm> IsnadForms { get; }
    DbSet<Contract> Contracts { get; }
    DbSet<Installment> Installments { get; }
    DbSet<Investor> Investors { get; }
    DbSet<PortalInterest> PortalInterests { get; }
    DbSet<InvestorFavorite> InvestorFavorites { get; }
    DbSet<InvestorInterest> InvestorInterests { get; }
    DbSet<IstifadaRequest> IstifadaRequests { get; }
    DbSet<IsnadPackage> IsnadPackages { get; }
    DbSet<IsnadPackageForm> IsnadPackageForms { get; }
    DbSet<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
