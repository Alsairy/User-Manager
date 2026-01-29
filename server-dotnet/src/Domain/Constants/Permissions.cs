namespace UserManager.Domain.Constants;

public static class Permissions
{
    public const string UsersRead = "users:read";
    public const string UsersCreate = "users:create";
    public const string UsersUpdate = "users:update";
    public const string UsersDelete = "users:delete";

    public const string RolesRead = "roles:read";
    public const string RolesCreate = "roles:create";
    public const string RolesUpdate = "roles:update";
    public const string RolesDelete = "roles:delete";

    public const string PermissionsManage = "permissions:manage";

    public const string AssetsRead = "assets:read";
    public const string AssetsCreate = "assets:create";
    public const string AssetsUpdate = "assets:update";
    public const string AssetsDelete = "assets:delete";
    public const string AssetsReview = "assets:review";

    public const string ContractsRead = "contracts:read";
    public const string ContractsCreate = "contracts:create";
    public const string ContractsUpdate = "contracts:update";
    public const string ContractsDelete = "contracts:delete";

    public const string InvestorsRead = "investors:read";
    public const string InvestorsCreate = "investors:create";
    public const string InvestorsUpdate = "investors:update";
    public const string InvestorsDelete = "investors:delete";

    public const string IsnadRead = "isnad:read";
    public const string IsnadCreate = "isnad:create";
    public const string IsnadUpdate = "isnad:update";
    public const string IsnadApprove = "isnad:approve";

    public const string PortalRead = "portal:read";
    public const string PortalCreate = "portal:create";

    public const string AuditRead = "audit:read";
    public const string WorkflowsStart = "workflows:start";
    public const string DashboardRead = "dashboard:read";

    public static IReadOnlyList<string> All { get; } = new[]
    {
        UsersRead, UsersCreate, UsersUpdate, UsersDelete,
        RolesRead, RolesCreate, RolesUpdate, RolesDelete,
        PermissionsManage,
        AssetsRead, AssetsCreate, AssetsUpdate, AssetsDelete, AssetsReview,
        ContractsRead, ContractsCreate, ContractsUpdate, ContractsDelete,
        InvestorsRead, InvestorsCreate, InvestorsUpdate, InvestorsDelete,
        IsnadRead, IsnadCreate, IsnadUpdate, IsnadApprove,
        PortalRead, PortalCreate,
        AuditRead, WorkflowsStart, DashboardRead
    };

    public static class DefaultRoles
    {
        public const string Admin = "Admin";
        public const string AssetManager = "AssetManager";
        public const string ContractManager = "ContractManager";
        public const string Reviewer = "Reviewer";
        public const string InvestorPortalUser = "InvestorPortalUser";
        public const string ReadOnly = "ReadOnly";

        public static IReadOnlyDictionary<string, (string Description, string[] Permissions)> Definitions { get; } =
            new Dictionary<string, (string, string[])>
            {
                [Admin] = ("System Administrator — full access", All.ToArray()),
                [AssetManager] = ("Manages asset lifecycle", new[]
                {
                    AssetsRead, AssetsCreate, AssetsUpdate, AssetsDelete,
                    ContractsRead, ContractsCreate,
                    IsnadRead, IsnadCreate, IsnadUpdate,
                    InvestorsRead, DashboardRead
                }),
                [ContractManager] = ("Manages contracts and installments", new[]
                {
                    ContractsRead, ContractsCreate, ContractsUpdate, ContractsDelete,
                    AssetsRead, InvestorsRead, DashboardRead
                }),
                [Reviewer] = ("Reviews assets and ISNAD forms", new[]
                {
                    AssetsRead, AssetsReview,
                    IsnadRead, IsnadApprove,
                    DashboardRead
                }),
                [InvestorPortalUser] = ("Investor portal access", new[]
                {
                    PortalRead, PortalCreate,
                    AssetsRead
                }),
                [ReadOnly] = ("Read-only access across system", new[]
                {
                    UsersRead, RolesRead,
                    AssetsRead, ContractsRead, InvestorsRead,
                    IsnadRead, PortalRead, AuditRead, DashboardRead
                })
            };
    }
}
