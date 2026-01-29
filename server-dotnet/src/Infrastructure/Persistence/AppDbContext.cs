using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Linq;
using System.Text.Json;
using UserManager.Application.Interfaces;
using UserManager.Domain.Common;
using UserManager.Domain.Entities;
using UserManager.Domain.Events;

namespace UserManager.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    private readonly IMediator? _mediator;

    public AppDbContext(DbContextOptions<AppDbContext> options, IMediator? mediator = null) : base(options)
    {
        _mediator = mediator;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AssetWorkflowHistory> AssetWorkflowHistory => Set<AssetWorkflowHistory>();
    public DbSet<AssetVisibilityHistory> AssetVisibilityHistory => Set<AssetVisibilityHistory>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<IsnadForm> IsnadForms => Set<IsnadForm>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Installment> Installments => Set<Installment>();
    public DbSet<Investor> Investors => Set<Investor>();
    public DbSet<PortalInterest> PortalInterests => Set<PortalInterest>();
    public DbSet<InvestorFavorite> InvestorFavorites => Set<InvestorFavorite>();
    public DbSet<InvestorInterest> InvestorInterests => Set<InvestorInterest>();
    public DbSet<IstifadaRequest> IstifadaRequests => Set<IstifadaRequest>();
    public DbSet<IsnadPackage> IsnadPackages => Set<IsnadPackage>();
    public DbSet<IsnadPackageForm> IsnadPackageForms => Set<IsnadPackageForm>();
    public DbSet<Notification> Notifications => Set<Notification>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var result = await base.SaveChangesAsync(cancellationToken);
        await DispatchDomainEventsAsync(cancellationToken);
        return result;
    }

    private async Task DispatchDomainEventsAsync(CancellationToken ct)
    {
        if (_mediator is null) return;

        var entities = ChangeTracker.Entries<EntityBase>()
            .Where(e => e.Entity.DomainEvents.Any())
            .Select(e => e.Entity)
            .ToList();

        var events = entities.SelectMany(e => e.DomainEvents).ToList();
        entities.ForEach(e => e.ClearDomainEvents());

        foreach (var domainEvent in events)
        {
            await _mediator.Publish(domainEvent, ct);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var stringListConverter = new ValueConverter<List<string>, string>(
            value => SerializeStringList(value),
            value => DeserializeStringList(value));
        var stringListComparer = new ValueComparer<List<string>>(
            (left, right) => (left ?? new List<string>()).SequenceEqual(right ?? new List<string>()),
            collection => (collection ?? new List<string>()).Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
            collection => (collection ?? new List<string>()).ToList());
        var assetVerifierConverter = new ValueConverter<List<AssetVerifier>, string>(
            value => SerializeAssetVerifiers(value),
            value => DeserializeAssetVerifiers(value));
        var assetVerifierComparer = new ValueComparer<List<AssetVerifier>>(
            (left, right) => SerializeAssetVerifiers(left ?? new List<AssetVerifier>())
                == SerializeAssetVerifiers(right ?? new List<AssetVerifier>()),
            collection => SerializeAssetVerifiers(collection ?? new List<AssetVerifier>()).GetHashCode(),
            collection => collection == null
                ? new List<AssetVerifier>()
                : collection.Select(v => new AssetVerifier
                {
                    Department = v.Department,
                    UserId = v.UserId,
                    UserName = v.UserName,
                    Date = v.Date
                }).ToList());

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).HasMaxLength(256);
            entity.Property(u => u.FullName).HasMaxLength(256);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(r => r.Name).IsUnique();
            entity.Property(r => r.Name).HasMaxLength(128);
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasIndex(p => p.Key).IsUnique();
            entity.Property(p => p.Key).HasMaxLength(256);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });
            entity.HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
            entity.HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId);
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });
            entity.HasOne(rp => rp.Role).WithMany(r => r.RolePermissions).HasForeignKey(rp => rp.RoleId);
            entity.HasOne(rp => rp.Permission).WithMany(p => p.RolePermissions).HasForeignKey(rp => rp.PermissionId);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(rt => rt.Token).IsUnique();
            entity.HasOne(rt => rt.User).WithMany(u => u.RefreshTokens).HasForeignKey(rt => rt.UserId);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(a => a.ActionType).HasMaxLength(128);
            entity.Property(a => a.EntityType).HasMaxLength(128);
            entity.Property(a => a.EntityId).HasMaxLength(128);
        });

        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasIndex(a => a.Code).IsUnique();
            entity.Property(a => a.Name).HasMaxLength(256);
            entity.Property(a => a.NameAr).HasMaxLength(256);
            entity.Property(a => a.Code).HasMaxLength(64);
            entity.Property(a => a.AssetType).HasMaxLength(64);
            entity.Property(a => a.RegionId).HasMaxLength(64);
            entity.Property(a => a.CityId).HasMaxLength(64);
            entity.Property(a => a.DistrictId).HasMaxLength(64);
            entity.Property(a => a.Neighborhood).HasMaxLength(256);
            entity.Property(a => a.StreetAddress).HasMaxLength(256);
            entity.Property(a => a.NearbyAssetsJustification).HasMaxLength(2000);
            entity.Property(a => a.LandUseType).HasMaxLength(64);
            entity.Property(a => a.ZoningClassification).HasMaxLength(128);
            entity.Property(a => a.CurrentStatus).HasMaxLength(64);
            entity.Property(a => a.OwnershipType).HasMaxLength(64);
            entity.Property(a => a.DeedNumber).HasMaxLength(128);
            entity.Property(a => a.CustomFeatures).HasMaxLength(2000);
            entity.Property(a => a.CustodyDetails).HasMaxLength(2000);
            entity.Property(a => a.AdministrativeNotes).HasMaxLength(4000);
            entity.Property(a => a.RelatedReferences).HasMaxLength(2000);
            entity.Property(a => a.SpecialConditions).HasMaxLength(2000);
            entity.Property(a => a.InvestmentPotential).HasMaxLength(2000);
            entity.Property(a => a.Restrictions).HasMaxLength(2000);
            entity.Property(a => a.Description).HasMaxLength(4000);
            entity.Property(a => a.RegistrationMode).HasMaxLength(64);
            entity.Property(a => a.CurrentStage).HasMaxLength(64);
            entity.Property(a => a.RejectionReason).HasMaxLength(128);
            entity.Property(a => a.RejectionJustification).HasMaxLength(2000);
            entity.Property(a => a.CreatedBy).HasMaxLength(128);
            entity.Property(a => a.UpdatedBy).HasMaxLength(128);
            entity.Property(a => a.OwnershipDocuments).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(a => a.Features).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(a => a.Attachments).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(a => a.VerifiedBy).HasConversion(assetVerifierConverter).Metadata.SetValueComparer(assetVerifierComparer);
            entity.Property(a => a.FinancialDues).HasPrecision(18, 2);
        });

        modelBuilder.Entity<AssetWorkflowHistory>(entity =>
        {
            entity.Property(h => h.Stage).HasMaxLength(64);
            entity.Property(h => h.Action).HasMaxLength(64);
            entity.Property(h => h.ReviewerId).HasMaxLength(128);
            entity.Property(h => h.ReviewerDepartment).HasMaxLength(128);
            entity.Property(h => h.Comments).HasMaxLength(2000);
            entity.Property(h => h.RejectionReason).HasMaxLength(128);
            entity.Property(h => h.RejectionJustification).HasMaxLength(2000);
            entity.Property(h => h.DocumentsAdded).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
        });

        modelBuilder.Entity<AssetVisibilityHistory>(entity =>
        {
            entity.Property(h => h.VisibilityStatus).HasMaxLength(32);
            entity.Property(h => h.ChangedBy).HasMaxLength(128);
            entity.Property(h => h.Reason).HasMaxLength(512);
        });

        modelBuilder.Entity<IsnadForm>(entity =>
        {
            entity.HasIndex(f => f.ReferenceNumber).IsUnique();
            entity.Property(f => f.Title).HasMaxLength(256);
            entity.Property(f => f.ReferenceNumber).HasMaxLength(64);
            entity.Property(f => f.Notes).HasMaxLength(2000);
            entity.Property(f => f.CurrentStage).HasMaxLength(64);
            entity.Property(f => f.CurrentAssigneeId).HasMaxLength(128);
            entity.Property(f => f.ReturnedByStage).HasMaxLength(64);
            entity.Property(f => f.ReturnReason).HasMaxLength(512);
            entity.Property(f => f.SlaStatus).HasMaxLength(64);
            entity.Property(f => f.CancellationReason).HasMaxLength(256);
            entity.Property(f => f.CancelledBy).HasMaxLength(128);
            entity.Property(f => f.CreatedBy).HasMaxLength(128);
            entity.Property(f => f.Attachments).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.HasOne(f => f.Asset).WithMany().HasForeignKey(f => f.AssetId);
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasIndex(c => c.ContractCode).IsUnique();
            entity.Property(c => c.ContractCode).HasMaxLength(64);
            entity.Property(c => c.LandCode).HasMaxLength(64);
            entity.Property(c => c.AssetNameEn).HasMaxLength(256);
            entity.Property(c => c.AssetNameAr).HasMaxLength(256);
            entity.Property(c => c.InvestorNameEn).HasMaxLength(256);
            entity.Property(c => c.InvestorNameAr).HasMaxLength(256);
            entity.Property(c => c.AnnualRentalAmount).HasPrecision(18, 2);
            entity.Property(c => c.TotalAnnualAmount).HasPrecision(18, 2);
            entity.Property(c => c.TotalContractAmount).HasPrecision(18, 2);
            entity.Property(c => c.Currency).HasMaxLength(16);
            entity.Property(c => c.CancellationDocuments).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(c => c.CancellationJustification).HasMaxLength(2000);
            entity.Property(c => c.Notes).HasMaxLength(2000);
            entity.Property(c => c.SpecialConditions).HasMaxLength(2000);
            entity.Property(c => c.LegalTermsReference).HasMaxLength(2000);
            entity.Property(c => c.ApprovalAuthority).HasMaxLength(256);
            entity.Property(c => c.CreatedBy).HasMaxLength(128);
            entity.Property(c => c.UpdatedBy).HasMaxLength(128);
            entity.Property(c => c.ArchivedBy).HasMaxLength(128);
            entity.Property(c => c.CancelledBy).HasMaxLength(128);
            entity.Property(c => c.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(c => c.InstallmentPlanType).HasConversion<string>().HasMaxLength(32);
            entity.Property(c => c.InstallmentFrequency).HasConversion<string>().HasMaxLength(32);
            entity.Property(c => c.CancellationReason).HasConversion<string>().HasMaxLength(32);
        });

        modelBuilder.Entity<Installment>(entity =>
        {
            entity.Property(i => i.AmountDue).HasPrecision(18, 2);
            entity.Property(i => i.PartialAmountPaid).HasPrecision(18, 2);
            entity.Property(i => i.RemainingBalance).HasPrecision(18, 2);
            entity.Property(i => i.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(i => i.ReceiptFileUrl).HasMaxLength(1024);
            entity.Property(i => i.ReceiptFileName).HasMaxLength(256);
            entity.Property(i => i.ReceiptUploadedBy).HasMaxLength(128);
            entity.Property(i => i.Notes).HasMaxLength(2000);
            entity.Property(i => i.Description).HasMaxLength(512);
            entity.Property(i => i.UpdatedBy).HasMaxLength(128);
            entity.HasOne(i => i.Contract).WithMany(c => c.Installments).HasForeignKey(i => i.ContractId);
        });

        modelBuilder.Entity<Investor>(entity =>
        {
            entity.HasIndex(i => i.InvestorCode).IsUnique();
            entity.Property(i => i.InvestorCode).HasMaxLength(64);
            entity.Property(i => i.NameAr).HasMaxLength(256);
            entity.Property(i => i.NameEn).HasMaxLength(256);
            entity.Property(i => i.ContactPerson).HasMaxLength(256);
            entity.Property(i => i.Email).HasMaxLength(256);
            entity.Property(i => i.Phone).HasMaxLength(64);
            entity.Property(i => i.CompanyRegistration).HasMaxLength(128);
            entity.Property(i => i.TaxId).HasMaxLength(128);
            entity.Property(i => i.Address).HasMaxLength(512);
            entity.Property(i => i.City).HasMaxLength(128);
            entity.Property(i => i.Country).HasMaxLength(128);
            entity.Property(i => i.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(i => i.Notes).HasMaxLength(2000);
        });

        modelBuilder.Entity<PortalInterest>(entity =>
        {
            entity.Property(p => p.InvestorName).HasMaxLength(256);
        });

        modelBuilder.Entity<InvestorFavorite>(entity =>
        {
            entity.HasIndex(f => new { f.InvestorAccountId, f.AssetId }).IsUnique();
            entity.Property(f => f.InvestorAccountId).HasMaxLength(128);
            entity.HasOne(f => f.Asset).WithMany().HasForeignKey(f => f.AssetId);
        });

        modelBuilder.Entity<InvestorInterest>(entity =>
        {
            entity.HasIndex(i => i.ReferenceNumber).IsUnique();
            entity.Property(i => i.ReferenceNumber).HasMaxLength(64);
            entity.Property(i => i.InvestorAccountId).HasMaxLength(128);
            entity.Property(i => i.ProposedUseDescription).HasMaxLength(2000);
            entity.Property(i => i.AdditionalComments).HasMaxLength(2000);
            entity.Property(i => i.Attachments).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(i => i.InvestmentPurpose).HasConversion<string>().HasMaxLength(64);
            entity.Property(i => i.InvestmentAmountRange).HasConversion<string>().HasMaxLength(64);
            entity.Property(i => i.ExpectedTimeline).HasConversion<string>().HasMaxLength(64);
            entity.Property(i => i.Status).HasConversion<string>().HasMaxLength(64);
            entity.HasOne(i => i.Asset).WithMany().HasForeignKey(i => i.AssetId);
        });

        modelBuilder.Entity<IstifadaRequest>(entity =>
        {
            entity.HasIndex(r => r.ReferenceNumber).IsUnique();
            entity.Property(r => r.ReferenceNumber).HasMaxLength(64);
            entity.Property(r => r.InvestorAccountId).HasMaxLength(128);
            entity.Property(r => r.ProgramTitle).HasMaxLength(256);
            entity.Property(r => r.ProgramDescription).HasMaxLength(4000);
            entity.Property(r => r.BudgetEstimate).HasMaxLength(128);
            entity.Property(r => r.TargetBeneficiaries).HasMaxLength(512);
            entity.Property(r => r.ProposalDocuments).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(r => r.FinancialPlanDocuments).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(r => r.OrganizationCredentials).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(r => r.AdditionalDocuments).HasConversion(stringListConverter).Metadata.SetValueComparer(stringListComparer);
            entity.Property(r => r.ProgramType).HasConversion<string>().HasMaxLength(64);
            entity.Property(r => r.Status).HasConversion<string>().HasMaxLength(64);
            entity.HasOne(r => r.Asset).WithMany().HasForeignKey(r => r.AssetId);
        });

        modelBuilder.Entity<IsnadPackage>(entity =>
        {
            entity.HasIndex(p => p.PackageCode).IsUnique();
            entity.Property(p => p.PackageCode).HasMaxLength(64);
            entity.Property(p => p.PackageName).HasMaxLength(256);
            entity.Property(p => p.Description).HasMaxLength(2000);
            entity.Property(p => p.InvestmentStrategy).HasMaxLength(2000);
            entity.Property(p => p.CreatedBy).HasMaxLength(128);
            entity.Property(p => p.CeoComments).HasMaxLength(2000);
            entity.Property(p => p.MinisterComments).HasMaxLength(2000);
            entity.Property(p => p.RejectionReason).HasMaxLength(2000);
            entity.Property(p => p.PackageDocumentUrl).HasMaxLength(1024);
            entity.Property(p => p.Priority).HasConversion<string>().HasMaxLength(32);
            entity.Property(p => p.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(p => p.ExpectedRevenue).HasPrecision(18, 2);
            entity.Property(p => p.TotalValuation).HasPrecision(18, 2);
        });

        modelBuilder.Entity<IsnadPackageForm>(entity =>
        {
            entity.HasIndex(f => new { f.PackageId, f.FormId }).IsUnique();
            entity.HasOne(f => f.Package).WithMany(p => p.Forms).HasForeignKey(f => f.PackageId);
            entity.HasOne(f => f.Form).WithMany().HasForeignKey(f => f.FormId);
            entity.HasOne(f => f.Asset).WithMany().HasForeignKey(f => f.AssetId);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(n => n.Type).HasMaxLength(32);
            entity.Property(n => n.Title).HasMaxLength(256);
            entity.Property(n => n.Message).HasMaxLength(2000);
            entity.Property(n => n.ActionUrl).HasMaxLength(512);
            entity.Property(n => n.RelatedEntityType).HasMaxLength(128);
            entity.HasIndex(n => new { n.UserId, n.IsRead });
        });
    }

    private static string SerializeStringList(List<string> value)
    {
        return JsonSerializer.Serialize(value);
    }

    private static List<string> DeserializeStringList(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return new List<string>();
        }

        return JsonSerializer.Deserialize<List<string>>(value) ?? new List<string>();
    }

    private static string SerializeAssetVerifiers(List<AssetVerifier> value)
    {
        return JsonSerializer.Serialize(value);
    }

    private static List<AssetVerifier> DeserializeAssetVerifiers(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return new List<AssetVerifier>();
        }

        return JsonSerializer.Deserialize<List<AssetVerifier>>(value) ?? new List<AssetVerifier>();
    }
}
