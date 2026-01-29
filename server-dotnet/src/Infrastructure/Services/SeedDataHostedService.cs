using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using UserManager.Application.Interfaces;
using UserManager.Domain.Constants;
using UserManager.Domain.Entities;
using UserManager.Domain.Enums;
using UserManager.Infrastructure.Options;

namespace UserManager.Infrastructure.Services;

public class SeedDataHostedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly SeedOptions _options;
    private readonly ILogger<SeedDataHostedService> _logger;

    public SeedDataHostedService(
        IServiceProvider serviceProvider,
        IOptions<SeedOptions> options,
        ILogger<SeedDataHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _options = options.Value;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
        {
            return;
        }

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        await SeedPermissionsAsync(dbContext, cancellationToken);
        await SeedRolesAsync(dbContext, cancellationToken);
        await SeedAdminUserAsync(dbContext, passwordHasher, cancellationToken);
        await SeedDemoDataAsync(dbContext, cancellationToken);
    }

    private async Task SeedPermissionsAsync(IAppDbContext dbContext, CancellationToken ct)
    {
        var existingKeys = await dbContext.Permissions.Select(p => p.Key).ToListAsync(ct);
        var existingKeySet = existingKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var toAdd = Permissions.All
            .Where(key => !existingKeySet.Contains(key))
            .Select(key => new Permission { Key = key, Description = key })
            .ToList();

        if (toAdd.Count > 0)
        {
            await dbContext.Permissions.AddRangeAsync(toAdd, ct);
            await dbContext.SaveChangesAsync(ct);
            _logger.LogInformation("Seeded {Count} permissions", toAdd.Count);
        }
    }

    private async Task SeedRolesAsync(IAppDbContext dbContext, CancellationToken ct)
    {
        var allPermissions = await dbContext.Permissions.ToListAsync(ct);
        var permissionByKey = allPermissions.ToDictionary(p => p.Key, StringComparer.OrdinalIgnoreCase);

        foreach (var (roleName, (description, permissionKeys)) in Permissions.DefaultRoles.Definitions)
        {
            var role = await dbContext.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Name == roleName, ct);

            if (role == null)
            {
                role = new Role { Name = roleName, Description = description };
                await dbContext.Roles.AddAsync(role, ct);
                await dbContext.SaveChangesAsync(ct);
                _logger.LogInformation("Seeded role: {Role}", roleName);
            }

            var existingPermIds = role.RolePermissions.Select(rp => rp.PermissionId).ToHashSet();
            var toAssign = permissionKeys
                .Where(k => permissionByKey.ContainsKey(k) && !existingPermIds.Contains(permissionByKey[k].Id))
                .Select(k => new RolePermission { RoleId = role.Id, PermissionId = permissionByKey[k].Id })
                .ToList();

            if (toAssign.Count > 0)
            {
                await dbContext.RolePermissions.AddRangeAsync(toAssign, ct);
                await dbContext.SaveChangesAsync(ct);
                _logger.LogInformation("Assigned {Count} permissions to role {Role}", toAssign.Count, roleName);
            }
        }
    }

    private async Task SeedAdminUserAsync(IAppDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken ct)
    {
        if (await dbContext.Users.AnyAsync(ct))
        {
            return;
        }

        var adminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == Permissions.DefaultRoles.Admin, ct);
        if (adminRole == null)
        {
            return;
        }

        var adminUser = new User
        {
            Email = _options.AdminEmail,
            FullName = _options.AdminName,
            Status = UserStatus.Active,
            PasswordHash = passwordHasher.Hash(_options.AdminPassword)
        };
        adminUser.UserRoles.Add(new UserRole { User = adminUser, Role = adminRole });

        await dbContext.Users.AddAsync(adminUser, ct);
        await dbContext.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded admin user: {Email}", _options.AdminEmail);
    }

    private async Task SeedDemoDataAsync(IAppDbContext dbContext, CancellationToken ct)
    {
        if (await dbContext.Assets.AnyAsync(ct))
        {
            return;
        }

        var assets = new[]
        {
            new Asset
            {
                Name = "Riyadh Education Campus",
                NameAr = "مجمع الرياض التعليمي",
                Code = "RYD-001",
                AssetType = "building",
                RegionId = "riyadh",
                CityId = "riyadh-city",
                DistrictId = "riyadh-d1",
                TotalArea = 12500,
                BuiltUpArea = 9200,
                LandUseType = "commercial",
                CurrentStatus = "vacant",
                OwnershipType = "government",
                DeedNumber = "RYD-DEED-001",
                DeedDate = DateTime.UtcNow.AddYears(-8),
                Features = new List<string> { "high_demand", "accessible_transport" },
                CustomFeatures = "Kindergarten Building, Education Department in Riyadh, For Lease",
                AdministrativeNotes = "Seeded asset for demo",
                RegistrationMode = "direct",
                Status = AssetStatus.Completed,
                CompletedAt = DateTime.UtcNow.AddDays(-2),
                VisibleToInvestors = true,
                VisibilityCount = 3,
                TotalExposureDays = 42,
                HasActiveContract = true,
                HasActiveIsnad = true
            },
            new Asset
            {
                Name = "Jeddah Community Land",
                NameAr = "أرض جدة المجتمعية",
                Code = "JDH-045",
                AssetType = "land",
                RegionId = "makkah",
                CityId = "jeddah-city",
                DistrictId = "jeddah-d1",
                TotalArea = 9800,
                LandUseType = "mixed_use",
                CurrentStatus = "vacant",
                OwnershipType = "leasehold",
                RegistrationMode = "approval_cycle",
                CurrentStage = "school_planning",
                SubmittedAt = DateTime.UtcNow.AddDays(-5),
                VisibleToInvestors = true,
                Status = AssetStatus.InReview
            },
            new Asset
            {
                Name = "Dammam Sports Complex",
                NameAr = "مجمع الدمام الرياضي",
                Code = "DMM-210",
                AssetType = "building",
                RegionId = "eastern",
                CityId = "dammam-city",
                DistrictId = "dammam-d1",
                TotalArea = 15400,
                VisibleToInvestors = false,
                Status = AssetStatus.Draft
            }
        };

        await dbContext.Assets.AddRangeAsync(assets, ct);
        await dbContext.SaveChangesAsync(ct);

        var investors = new[]
        {
            new Investor
            {
                InvestorCode = "INV-001",
                NameEn = "Al Majd Holdings",
                NameAr = "شركة المجد القابضة",
                Email = "info@almajd.com",
                Phone = "+966500000001",
                City = "Riyadh",
                Status = InvestorStatus.Active
            },
            new Investor
            {
                InvestorCode = "INV-002",
                NameEn = "Vision Capital",
                NameAr = "رأس مال الرؤية",
                Email = "contact@vision.sa",
                Phone = "+966500000002",
                City = "Jeddah",
                Status = InvestorStatus.Active
            }
        };

        await dbContext.Investors.AddRangeAsync(investors, ct);
        await dbContext.SaveChangesAsync(ct);

        var contract = new Contract
        {
            ContractCode = "CTR-202501-001",
            LandCode = assets[0].Code,
            AssetId = assets[0].Id,
            InvestorId = investors[0].Id,
            AssetNameEn = assets[0].Name,
            AssetNameAr = assets[0].NameAr ?? string.Empty,
            InvestorNameEn = investors[0].NameEn,
            InvestorNameAr = investors[0].NameAr,
            AnnualRentalAmount = 250000,
            VatRate = 15,
            TotalAnnualAmount = 287500,
            ContractDuration = 5,
            TotalContractAmount = 1437500,
            SigningDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(5)),
            Status = ContractStatus.Active
        };

        await dbContext.Contracts.AddAsync(contract, ct);
        await dbContext.SaveChangesAsync(ct);

        var installments = Enumerable.Range(1, 6).Select(i =>
            new Installment
            {
                ContractId = contract.Id,
                InstallmentNumber = i,
                AmountDue = 239583.33m,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(i)),
                Status = i <= 2 ? InstallmentStatus.Paid : InstallmentStatus.Pending,
                PaymentDate = i <= 2 ? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(i).AddDays(-2)) : null
            }).ToList();

        await dbContext.Installments.AddRangeAsync(installments, ct);

        var isnadForms = new[]
        {
            new IsnadForm
            {
                Title = "Riyadh Campus ISNAD",
                ReferenceNumber = "ISN-2025-001",
                Notes = "Approved for packaging",
                Status = IsnadStatus.Approved,
                CurrentStage = "investment_agency",
                SubmittedAt = DateTime.UtcNow.AddDays(-20),
                CompletedAt = DateTime.UtcNow.AddDays(-2),
                CreatedBy = "system",
                AssetId = assets[0].Id
            },
            new IsnadForm
            {
                Title = "Jeddah Land ISNAD",
                ReferenceNumber = "ISN-2025-002",
                Notes = "Pending review",
                Status = IsnadStatus.PendingVerification,
                CurrentStage = "school_planning",
                SubmittedAt = DateTime.UtcNow.AddDays(-3),
                CreatedBy = "system",
                AssetId = assets[1].Id
            },
            new IsnadForm
            {
                Title = "Dammam Sports ISNAD",
                ReferenceNumber = "ISN-2025-003",
                Notes = "Approved and ready for packaging",
                Status = IsnadStatus.Approved,
                CurrentStage = "investment_agency",
                SubmittedAt = DateTime.UtcNow.AddDays(-15),
                CompletedAt = DateTime.UtcNow.AddDays(-1),
                CreatedBy = "system",
                AssetId = assets[2].Id
            }
        };

        await dbContext.IsnadForms.AddRangeAsync(isnadForms, ct);

        var package = new IsnadPackage
        {
            PackageCode = "PKG-2025-001",
            PackageName = "Q1 2025 Strategic Package",
            Description = "Approved ISNAD forms for executive review",
            Priority = PackagePriority.High,
            DurationYears = 5,
            DurationMonths = 0,
            Status = PackageStatus.PendingCeo,
            TotalAssets = 1,
            TotalValuation = 0
        };

        package.Forms.Add(new IsnadPackageForm
        {
            FormId = isnadForms[0].Id,
            AssetId = assets[0].Id
        });

        await dbContext.IsnadPackages.AddAsync(package, ct);

        var interest = new InvestorInterest
        {
            ReferenceNumber = "INT-2025-001",
            InvestorAccountId = "demo-investor-001",
            AssetId = assets[0].Id,
            InvestmentPurpose = InvestmentPurpose.EducationalFacility,
            ProposedUseDescription = "Expand the campus with new STEM labs.",
            InvestmentAmountRange = InvestmentAmountRange.FiveTo10m,
            ExpectedTimeline = InvestmentTimeline.MidTerm,
            Status = InterestStatus.UnderReview
        };

        await dbContext.InvestorInterests.AddAsync(interest, ct);

        await dbContext.InvestorFavorites.AddAsync(new InvestorFavorite
        {
            InvestorAccountId = "demo-investor-001",
            AssetId = assets[0].Id
        }, ct);

        await dbContext.IstifadaRequests.AddAsync(new IstifadaRequest
        {
            ReferenceNumber = "IST-2025-001",
            InvestorAccountId = "demo-investor-001",
            AssetId = assets[0].Id,
            ProgramType = IstifadaProgramType.EducationalServices,
            ProgramTitle = "After School STEM Program",
            ProgramDescription = "STEM enrichment for middle school students.",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(7)),
            Status = IstifadaStatus.UnderReview
        }, ct);

        await dbContext.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded demo data");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
