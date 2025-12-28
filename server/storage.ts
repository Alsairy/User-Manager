import { randomUUID } from "crypto";
import type {
  User,
  InsertUser,
  Role,
  InsertRole,
  Permission,
  Organization,
  InsertOrganization,
  WorkUnit,
  InsertWorkUnit,
  AuditLog,
  UserCustomPermission,
  RolePermission,
  UserWithDetails,
  DashboardStats,
  UserFilters,
  AccessLevel,
  PermissionGroup,
  Asset,
  AssetWithDetails,
  InsertAsset,
  AssetFilters,
  AssetBankFilters,
  AssetWorkflowHistory,
  AssetVisibilityHistory,
  AssetComment,
  Region,
  City,
  District,
  WorkflowStage,
  WorkflowAction,
  AssetDashboardStats,
  ReviewQueueItem,
  IsnadForm,
  IsnadFormWithDetails,
  InsertIsnadForm,
  IsnadApproval,
  IsnadFilters,
  IsnadStage,
  IsnadAction,
  IsnadReviewAction,
  IsnadDashboardStats,
  IsnadReviewQueueItem,
  IsnadPackage,
  IsnadPackageWithDetails,
  InsertPackage,
  PackageAsset,
  PackageFilters,
  PackageReview,
  PackageDashboardStats,
  Notification,
  NotificationFilters,
  NotificationType,
  SlaStatus,
} from "@shared/schema";
import { permissionGroups, workflowStageEnum, isnadStageEnum, slaDaysConfig } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<UserWithDetails | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(filters: UserFilters): Promise<{ users: UserWithDetails[]; total: number }>;
  createUser(user: InsertUser, createdBy: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  validateEmail(email: string): Promise<boolean>;

  getRole(id: string): Promise<Role | undefined>;
  getRoles(): Promise<(Role & { userCount: number })[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, updates: Partial<Role>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;

  getPermissions(): Promise<Permission[]>;
  getPermissionsByGroup(group: PermissionGroup): Promise<Permission[]>;

  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;

  getWorkUnits(organizationId?: string): Promise<WorkUnit[]>;
  getWorkUnit(id: string): Promise<WorkUnit | undefined>;
  createWorkUnit(unit: InsertWorkUnit): Promise<WorkUnit>;

  getUserCustomPermissions(userId: string): Promise<UserCustomPermission[]>;
  setUserCustomPermissions(
    userId: string,
    permissions: { permissionId: string; accessLevel: AccessLevel }[],
    grantedBy: string
  ): Promise<void>;

  getRolePermissions(roleId: string): Promise<RolePermission[]>;
  setRolePermissions(
    roleId: string,
    permissions: { permissionId: string; accessLevel: AccessLevel }[]
  ): Promise<void>;

  getAuditLogs(filters: {
    search?: string;
    actionType?: string;
    entityType?: string;
    page: number;
    limit: number;
  }): Promise<{ logs: AuditLog[]; total: number }>;
  createAuditLog(log: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;

  getDashboardStats(): Promise<DashboardStats>;

  getRegions(): Promise<Region[]>;
  getCities(regionId?: string): Promise<City[]>;
  getDistricts(cityId?: string): Promise<District[]>;
  getRegion(id: string): Promise<Region | undefined>;
  getCity(id: string): Promise<City | undefined>;
  getDistrict(id: string): Promise<District | undefined>;

  getAsset(id: string): Promise<AssetWithDetails | undefined>;
  getAssets(filters: AssetFilters): Promise<{ assets: AssetWithDetails[]; total: number }>;
  getAssetBank(filters: AssetBankFilters): Promise<{ assets: AssetWithDetails[]; total: number }>;
  createAsset(asset: InsertAsset, createdBy: string): Promise<Asset>;
  updateAsset(id: string, updates: Partial<Asset>, updatedBy: string): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;
  submitAsset(id: string, mode: "direct" | "approval_cycle"): Promise<Asset | undefined>;
  approveAsset(id: string, reviewerId: string, comments?: string): Promise<Asset | undefined>;
  rejectAsset(id: string, reviewerId: string, reason: string, justification: string): Promise<Asset | undefined>;
  toggleAssetVisibility(id: string, visible: boolean, userId: string, reason?: string): Promise<Asset | undefined>;
  getAssetDashboardStats(): Promise<AssetDashboardStats>;
  getReviewQueue(department: WorkflowStage): Promise<ReviewQueueItem[]>;

  getAssetWorkflowHistory(assetId: string): Promise<AssetWorkflowHistory[]>;
  createWorkflowHistoryEntry(entry: Omit<AssetWorkflowHistory, "id" | "createdAt">): Promise<AssetWorkflowHistory>;
  
  getAssetVisibilityHistory(assetId: string): Promise<AssetVisibilityHistory[]>;
  
  getAssetComments(assetId: string): Promise<AssetComment[]>;
  createAssetComment(comment: Omit<AssetComment, "id" | "createdAt">): Promise<AssetComment>;

  generateAssetCode(): Promise<string>;
  checkDuplicateAssetName(nameAr: string, nameEn: string, districtId: string, excludeId?: string): Promise<boolean>;

  // ISNAD Form Methods
  getIsnadForm(id: string): Promise<IsnadFormWithDetails | undefined>;
  getIsnadForms(filters: IsnadFilters): Promise<{ forms: IsnadFormWithDetails[]; total: number }>;
  createIsnadForm(form: InsertIsnadForm, createdBy: string): Promise<IsnadForm>;
  updateIsnadForm(id: string, updates: Partial<IsnadForm>): Promise<IsnadForm | undefined>;
  submitIsnadForm(id: string): Promise<IsnadForm | undefined>;
  processIsnadAction(id: string, reviewerId: string, action: IsnadReviewAction): Promise<IsnadForm | undefined>;
  cancelIsnadForm(id: string, userId: string, reason: string): Promise<IsnadForm | undefined>;
  getIsnadReviewQueue(stage: IsnadStage): Promise<IsnadReviewQueueItem[]>;
  getIsnadDashboardStats(userId?: string): Promise<IsnadDashboardStats>;
  getIsnadApprovals(formId: string): Promise<IsnadApproval[]>;
  generateIsnadCode(): Promise<string>;

  // ISNAD Package Methods
  getPackage(id: string): Promise<IsnadPackageWithDetails | undefined>;
  getPackages(filters: PackageFilters): Promise<{ packages: IsnadPackageWithDetails[]; total: number }>;
  createPackage(pkg: InsertPackage, createdBy: string): Promise<IsnadPackage>;
  updatePackage(id: string, updates: Partial<IsnadPackage>): Promise<IsnadPackage | undefined>;
  submitPackageToCeo(id: string): Promise<IsnadPackage | undefined>;
  processPackageReview(id: string, reviewerId: string, reviewerRole: "ceo" | "minister", action: PackageReview): Promise<IsnadPackage | undefined>;
  getPackageDashboardStats(): Promise<PackageDashboardStats>;
  getApprovedFormsForPackaging(): Promise<IsnadFormWithDetails[]>;
  generatePackageCode(): Promise<string>;

  // Notification Methods
  getNotifications(userId: string, filters: NotificationFilters): Promise<{ notifications: Notification[]; total: number; unreadCount: number }>;
  createNotification(notification: Omit<Notification, "id" | "createdAt" | "read" | "readAt" | "emailSent" | "emailSentAt">): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private roles: Map<string, Role>;
  private permissions: Map<string, Permission>;
  private organizations: Map<string, Organization>;
  private workUnits: Map<string, WorkUnit>;
  private auditLogs: Map<string, AuditLog>;
  private userCustomPermissions: Map<string, UserCustomPermission>;
  private rolePermissions: Map<string, RolePermission>;
  private regions: Map<string, Region>;
  private cities: Map<string, City>;
  private districts: Map<string, District>;
  private assets: Map<string, Asset>;
  private assetWorkflowHistory: Map<string, AssetWorkflowHistory>;
  private assetVisibilityHistory: Map<string, AssetVisibilityHistory>;
  private assetComments: Map<string, AssetComment>;
  private assetCodeCounter: number;
  private isnadForms: Map<string, IsnadForm>;
  private isnadApprovals: Map<string, IsnadApproval>;
  private isnadPackages: Map<string, IsnadPackage>;
  private packageAssets: Map<string, PackageAsset>;
  private notifications: Map<string, Notification>;
  private isnadCodeCounter: number;
  private packageCodeCounter: number;

  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.organizations = new Map();
    this.workUnits = new Map();
    this.auditLogs = new Map();
    this.userCustomPermissions = new Map();
    this.rolePermissions = new Map();
    this.regions = new Map();
    this.cities = new Map();
    this.districts = new Map();
    this.assets = new Map();
    this.assetWorkflowHistory = new Map();
    this.assetVisibilityHistory = new Map();
    this.assetComments = new Map();
    this.assetCodeCounter = 1000;
    this.isnadForms = new Map();
    this.isnadApprovals = new Map();
    this.isnadPackages = new Map();
    this.packageAssets = new Map();
    this.notifications = new Map();
    this.isnadCodeCounter = 1000;
    this.packageCodeCounter = 100;

    this.seedData();
  }

  private seedData() {
    const tbcOrgId = randomUUID();
    const moeOrgId = randomUUID();
    this.organizations.set(tbcOrgId, {
      id: tbcOrgId,
      name: "Tatweer Building Company",
      code: "TBC",
      type: "Government",
      createdAt: new Date().toISOString(),
    });
    this.organizations.set(moeOrgId, {
      id: moeOrgId,
      name: "Ministry of Education",
      code: "MOE",
      type: "Government",
      createdAt: new Date().toISOString(),
    });

    const tbcUnit1Id = randomUUID();
    const tbcUnit2Id = randomUUID();
    const moeUnit1Id = randomUUID();
    this.workUnits.set(tbcUnit1Id, {
      id: tbcUnit1Id,
      organizationId: tbcOrgId,
      name: "Executive Management",
      code: "TBC-EM",
      createdAt: new Date().toISOString(),
    });
    this.workUnits.set(tbcUnit2Id, {
      id: tbcUnit2Id,
      organizationId: tbcOrgId,
      name: "Contracts Department",
      code: "TBC-CD",
      createdAt: new Date().toISOString(),
    });
    this.workUnits.set(moeUnit1Id, {
      id: moeUnit1Id,
      organizationId: moeOrgId,
      name: "Education Department",
      code: "MOE-ED",
      createdAt: new Date().toISOString(),
    });

    const role1Id = randomUUID();
    const role2Id = randomUUID();
    const role3Id = randomUUID();
    const role4Id = randomUUID();
    const role5Id = randomUUID();
    this.roles.set(role1Id, {
      id: role1Id,
      name: "TBC Executive Management",
      description: "Approves/reviews final submissions with executive authority",
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.roles.set(role2Id, {
      id: role2Id,
      name: "TBC Contracts Manager",
      description: "Manages contract workflows and related processes",
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.roles.set(role3Id, {
      id: role3Id,
      name: "TBC Asset Management",
      description: "Handles asset-related processes and management",
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.roles.set(role4Id, {
      id: role4Id,
      name: "TBC Dashboard Viewer",
      description: "Read-only access to dashboards and reports",
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.roles.set(role5Id, {
      id: role5Id,
      name: "Platform Admin (TBC)",
      description: "Full system administration access",
      isSystemRole: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const permissionAreas: Record<PermissionGroup, string[]> = {
      new_asset_management: [
        "Initiate new asset",
        "Edit new asset request",
        "Cancel new asset request",
        "Submit new asset for review",
      ],
      new_asset_reviewing: [
        "Review new asset submissions",
        "Approve/reject new asset",
        "Request modifications",
        "View new asset history",
      ],
      isnad_management: [
        "Create ISNAD records",
        "Edit ISNAD data",
        "Submit ISNAD for approval",
        "Archive ISNAD records",
      ],
      isnad_reviewing: [
        "Review ISNAD submissions",
        "Approve/reject ISNAD",
        "Request changes",
        "View ISNAD audit trail",
      ],
      tbc_final_approval_management: [
        "Prepare final approval package",
        "Edit final submission",
        "Submit to executive management",
      ],
      tbc_final_approval_reviewing: [
        "Review final submissions",
        "Provide executive approval/rejection",
        "Add executive comments",
      ],
      admin_role_management: [
        "Create/edit/delete roles",
        "Define role permissions",
        "View role catalog",
        "Assign roles to users",
      ],
      admin_user_management: [
        "Create/edit/delete users",
        "Assign/revoke roles",
        "Activate/deactivate accounts",
        "View user activity",
      ],
    };

    for (const group of permissionGroups) {
      const areas = permissionAreas[group];
      for (const area of areas) {
        const permId = randomUUID();
        this.permissions.set(permId, {
          id: permId,
          processGroup: group,
          permissionArea: area,
          code: `${group}_${area.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          description: `Permission to ${area.toLowerCase()}`,
          requiresSpecialPermission: group.includes("tbc_final_approval"),
        });
      }
    }

    const adminUserId = randomUUID();
    this.users.set(adminUserId, {
      id: adminUserId,
      email: "admin@madares.sa",
      organizationId: tbcOrgId,
      workUnitId: tbcUnit1Id,
      roleId: role5Id,
      hasCustomPermissions: false,
      status: "active",
      invitationToken: null,
      invitationExpiresAt: null,
      firstLoginAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const sampleUserId = randomUUID();
    this.users.set(sampleUserId, {
      id: sampleUserId,
      email: "john.doe@tbc.sa",
      organizationId: tbcOrgId,
      workUnitId: tbcUnit2Id,
      roleId: role2Id,
      hasCustomPermissions: false,
      status: "active",
      invitationToken: null,
      invitationExpiresAt: null,
      firstLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: adminUserId,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      deletedAt: null,
    });

    const pendingUserId = randomUUID();
    this.users.set(pendingUserId, {
      id: pendingUserId,
      email: "pending.user@moe.sa",
      organizationId: moeOrgId,
      workUnitId: moeUnit1Id,
      roleId: role4Id,
      hasCustomPermissions: false,
      status: "pending",
      invitationToken: randomUUID(),
      invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      firstLoginAt: null,
      lastLoginAt: null,
      createdBy: adminUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    this.createAuditLog({
      userId: adminUserId,
      actionType: "user_create",
      entityType: "user",
      entityId: sampleUserId,
      changes: { email: "john.doe@tbc.sa" },
      ipAddress: "192.168.1.1",
      sessionId: randomUUID(),
    });
    this.createAuditLog({
      userId: adminUserId,
      actionType: "user_create",
      entityType: "user",
      entityId: pendingUserId,
      changes: { email: "pending.user@moe.sa" },
      ipAddress: "192.168.1.1",
      sessionId: randomUUID(),
    });
    this.createAuditLog({
      userId: adminUserId,
      actionType: "login_success",
      entityType: "session",
      entityId: null,
      changes: null,
      ipAddress: "192.168.1.1",
      sessionId: randomUUID(),
    });

    const riyadhRegionId = randomUUID();
    const jeddahRegionId = randomUUID();
    const dammamRegionId = randomUUID();
    this.regions.set(riyadhRegionId, { id: riyadhRegionId, nameAr: "منطقة الرياض", nameEn: "Riyadh Region", code: "RIY" });
    this.regions.set(jeddahRegionId, { id: jeddahRegionId, nameAr: "منطقة مكة المكرمة", nameEn: "Makkah Region", code: "MAK" });
    this.regions.set(dammamRegionId, { id: dammamRegionId, nameAr: "المنطقة الشرقية", nameEn: "Eastern Province", code: "EST" });

    const riyadhCityId = randomUUID();
    const jeddahCityId = randomUUID();
    const dammamCityId = randomUUID();
    this.cities.set(riyadhCityId, { id: riyadhCityId, regionId: riyadhRegionId, nameAr: "الرياض", nameEn: "Riyadh", code: "RIY-C" });
    this.cities.set(jeddahCityId, { id: jeddahCityId, regionId: jeddahRegionId, nameAr: "جدة", nameEn: "Jeddah", code: "JED-C" });
    this.cities.set(dammamCityId, { id: dammamCityId, regionId: dammamRegionId, nameAr: "الدمام", nameEn: "Dammam", code: "DAM-C" });

    const alOlayaDistrictId = randomUUID();
    const alMalazDistrictId = randomUUID();
    const alSulaimaniyahDistrictId = randomUUID();
    this.districts.set(alOlayaDistrictId, { id: alOlayaDistrictId, cityId: riyadhCityId, nameAr: "العليا", nameEn: "Al Olaya", code: "OLY" });
    this.districts.set(alMalazDistrictId, { id: alMalazDistrictId, cityId: riyadhCityId, nameAr: "الملز", nameEn: "Al Malaz", code: "MLZ" });
    this.districts.set(alSulaimaniyahDistrictId, { id: alSulaimaniyahDistrictId, cityId: riyadhCityId, nameAr: "السليمانية", nameEn: "Al Sulaimaniyah", code: "SLM" });

    const assetId1 = randomUUID();
    const now = new Date().toISOString();
    this.assets.set(assetId1, {
      id: assetId1,
      assetCode: "AST-001001",
      assetNameAr: "مدرسة الملك فهد",
      assetNameEn: "King Fahd School",
      assetType: "building",
      regionId: riyadhRegionId,
      cityId: riyadhCityId,
      districtId: alOlayaDistrictId,
      neighborhood: "Al Olaya",
      streetAddress: "King Fahd Road",
      latitude: 24.7136,
      longitude: 46.6753,
      locationValidated: true,
      nearbyAssetsJustification: null,
      totalArea: 5000,
      builtUpArea: 3500,
      landUseType: "educational",
      zoningClassification: "Educational Zone",
      currentStatus: "occupied",
      ownershipType: "moe_owned",
      deedNumber: "1234567890",
      deedDate: "2020-01-15",
      ownershipDocuments: [],
      features: ["utilities_water", "utilities_electricity", "road_access"],
      customFeatures: null,
      financialDues: 0,
      custodyDetails: null,
      administrativeNotes: null,
      relatedReferences: null,
      description: "Primary school with modern facilities",
      specialConditions: null,
      investmentPotential: "High potential for educational investment",
      restrictions: null,
      attachments: [],
      status: "completed",
      registrationMode: "direct",
      currentStage: null,
      verifiedBy: [],
      rejectionReason: null,
      rejectionJustification: null,
      visibleToInvestors: true,
      visibilityCount: 1,
      totalExposureDays: 30,
      hasActiveIsnad: false,
      hasActiveContract: false,
      createdBy: adminUserId,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedBy: null,
      updatedAt: now,
    });

    const assetId2 = randomUUID();
    this.assets.set(assetId2, {
      id: assetId2,
      assetCode: "AST-001002",
      assetNameAr: "ارض تعليمية",
      assetNameEn: "Educational Land",
      assetType: "land",
      regionId: riyadhRegionId,
      cityId: riyadhCityId,
      districtId: alMalazDistrictId,
      neighborhood: null,
      streetAddress: null,
      latitude: 24.6748,
      longitude: 46.7219,
      locationValidated: false,
      nearbyAssetsJustification: null,
      totalArea: 10000,
      builtUpArea: null,
      landUseType: "vacant_land",
      zoningClassification: null,
      currentStatus: "available",
      ownershipType: "moe_owned",
      deedNumber: null,
      deedDate: null,
      ownershipDocuments: [],
      features: ["road_access"],
      customFeatures: null,
      financialDues: null,
      custodyDetails: null,
      administrativeNotes: null,
      relatedReferences: null,
      description: null,
      specialConditions: null,
      investmentPotential: null,
      restrictions: null,
      attachments: [],
      status: "draft",
      registrationMode: null,
      currentStage: null,
      verifiedBy: [],
      rejectionReason: null,
      rejectionJustification: null,
      visibleToInvestors: false,
      visibilityCount: 0,
      totalExposureDays: 0,
      hasActiveIsnad: false,
      hasActiveContract: false,
      createdBy: adminUserId,
      createdAt: now,
      submittedAt: null,
      completedAt: null,
      updatedBy: null,
      updatedAt: now,
    });

    const assetId3 = randomUUID();
    this.assets.set(assetId3, {
      id: assetId3,
      assetCode: "AST-001003",
      assetNameAr: "مبنى اداري",
      assetNameEn: "Administrative Building",
      assetType: "building",
      regionId: riyadhRegionId,
      cityId: riyadhCityId,
      districtId: alSulaimaniyahDistrictId,
      neighborhood: "Al Sulaimaniyah",
      streetAddress: "Sulaimaniyah Street",
      latitude: 24.7005,
      longitude: 46.6882,
      locationValidated: true,
      nearbyAssetsJustification: null,
      totalArea: 8000,
      builtUpArea: 6000,
      landUseType: "commercial",
      zoningClassification: "Commercial Zone",
      currentStatus: "available",
      ownershipType: "moe_owned",
      deedNumber: "9876543210",
      deedDate: "2019-06-20",
      ownershipDocuments: [],
      features: ["utilities_water", "utilities_electricity", "utilities_sewage", "road_access", "fenced_secured"],
      customFeatures: null,
      financialDues: 0,
      custodyDetails: null,
      administrativeNotes: null,
      relatedReferences: null,
      description: "Modern administrative building suitable for offices",
      specialConditions: null,
      investmentPotential: "Excellent potential for commercial lease",
      restrictions: null,
      attachments: [],
      status: "in_review",
      registrationMode: "approval_cycle",
      currentStage: "investment_partnerships",
      verifiedBy: [
        { department: "school_planning", userId: adminUserId, userName: "Admin", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { department: "facilities_security", userId: adminUserId, userName: "Admin", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      ],
      rejectionReason: null,
      rejectionJustification: null,
      visibleToInvestors: false,
      visibilityCount: 0,
      totalExposureDays: 0,
      hasActiveIsnad: false,
      hasActiveContract: false,
      createdBy: sampleUserId,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      updatedBy: null,
      updatedAt: now,
    });

    this.assetCodeCounter = 1004;
  }

  async getUser(id: string): Promise<UserWithDetails | undefined> {
    const user = this.users.get(id);
    if (!user || user.deletedAt) return undefined;

    return {
      ...user,
      organization: this.organizations.get(user.organizationId),
      workUnit: this.workUnits.get(user.workUnitId),
      role: user.roleId ? this.roles.get(user.roleId) : undefined,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && !user.deletedAt
    );
  }

  async getUsers(filters: UserFilters): Promise<{ users: UserWithDetails[]; total: number }> {
    let users = Array.from(this.users.values()).filter((u) => !u.deletedAt);

    if (filters.search) {
      const search = filters.search.toLowerCase();
      users = users.filter((u) => u.email.toLowerCase().includes(search));
    }

    if (filters.status && filters.status !== "all") {
      users = users.filter((u) => u.status === filters.status);
    }

    if (filters.organizationId && filters.organizationId !== "all") {
      users = users.filter((u) => u.organizationId === filters.organizationId);
    }

    if (filters.roleId && filters.roleId !== "all") {
      users = users.filter((u) => u.roleId === filters.roleId);
    }

    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = users.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedUsers = users.slice(start, start + filters.limit);

    const usersWithDetails: UserWithDetails[] = paginatedUsers.map((user) => ({
      ...user,
      organization: this.organizations.get(user.organizationId),
      workUnit: this.workUnits.get(user.workUnitId),
      role: user.roleId ? this.roles.get(user.roleId) : undefined,
    }));

    return { users: usersWithDetails, total };
  }

  async createUser(insertUser: InsertUser, createdBy: string): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const invitationToken = randomUUID();
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const user: User = {
      id,
      email: insertUser.email,
      organizationId: insertUser.organizationId,
      workUnitId: insertUser.workUnitId,
      roleId: insertUser.roleId ?? null,
      hasCustomPermissions: insertUser.hasCustomPermissions ?? false,
      status: insertUser.status ?? "active",
      invitationToken,
      invitationExpiresAt,
      firstLoginAt: null,
      lastLoginAt: null,
      createdBy,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user || user.deletedAt) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      id: user.id,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user || user.deletedAt) return false;

    user.deletedAt = new Date().toISOString();
    user.status = "inactive";
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    return true;
  }

  async validateEmail(email: string): Promise<boolean> {
    const existing = await this.getUserByEmail(email);
    return !existing;
  }

  async getRole(id: string): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async getRoles(): Promise<(Role & { userCount: number })[]> {
    const roles = Array.from(this.roles.values());
    return roles.map((role) => ({
      ...role,
      userCount: Array.from(this.users.values()).filter(
        (u) => u.roleId === role.id && !u.deletedAt
      ).length,
    }));
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const role: Role = {
      id,
      name: insertRole.name,
      description: insertRole.description ?? "",
      isSystemRole: insertRole.isSystemRole ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.roles.set(id, role);
    return role;
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role | undefined> {
    const role = this.roles.get(id);
    if (!role) return undefined;

    const updatedRole: Role = {
      ...role,
      ...updates,
      id: role.id,
      updatedAt: new Date().toISOString(),
    };

    this.roles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteRole(id: string): Promise<boolean> {
    const role = this.roles.get(id);
    if (!role || role.isSystemRole) return false;

    const usersWithRole = Array.from(this.users.values()).filter(
      (u) => u.roleId === id && !u.deletedAt
    );
    if (usersWithRole.length > 0) return false;

    this.roles.delete(id);
    return true;
  }

  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async getPermissionsByGroup(group: PermissionGroup): Promise<Permission[]> {
    return Array.from(this.permissions.values()).filter((p) => p.processGroup === group);
  }

  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const organization: Organization = {
      id,
      name: org.name,
      code: org.code,
      type: org.type ?? "",
      createdAt: new Date().toISOString(),
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async getWorkUnits(organizationId?: string): Promise<WorkUnit[]> {
    const units = Array.from(this.workUnits.values());
    if (organizationId) {
      return units.filter((u) => u.organizationId === organizationId);
    }
    return units;
  }

  async getWorkUnit(id: string): Promise<WorkUnit | undefined> {
    return this.workUnits.get(id);
  }

  async createWorkUnit(unit: InsertWorkUnit): Promise<WorkUnit> {
    const id = randomUUID();
    const workUnit: WorkUnit = {
      id,
      organizationId: unit.organizationId,
      name: unit.name,
      code: unit.code ?? "",
      createdAt: new Date().toISOString(),
    };
    this.workUnits.set(id, workUnit);
    return workUnit;
  }

  async getUserCustomPermissions(userId: string): Promise<UserCustomPermission[]> {
    return Array.from(this.userCustomPermissions.values()).filter(
      (p) => p.userId === userId
    );
  }

  async setUserCustomPermissions(
    userId: string,
    permissions: { permissionId: string; accessLevel: AccessLevel }[],
    grantedBy: string
  ): Promise<void> {
    for (const [key, perm] of this.userCustomPermissions.entries()) {
      if (perm.userId === userId) {
        this.userCustomPermissions.delete(key);
      }
    }

    const now = new Date().toISOString();
    for (const p of permissions) {
      const id = randomUUID();
      this.userCustomPermissions.set(id, {
        id,
        userId,
        permissionId: p.permissionId,
        accessLevel: p.accessLevel,
        grantedBy,
        grantedAt: now,
      });
    }
  }

  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return Array.from(this.rolePermissions.values()).filter(
      (p) => p.roleId === roleId
    );
  }

  async setRolePermissions(
    roleId: string,
    permissions: { permissionId: string; accessLevel: AccessLevel }[]
  ): Promise<void> {
    for (const [key, perm] of this.rolePermissions.entries()) {
      if (perm.roleId === roleId) {
        this.rolePermissions.delete(key);
      }
    }

    for (const p of permissions) {
      const id = randomUUID();
      this.rolePermissions.set(id, {
        id,
        roleId,
        permissionId: p.permissionId,
        accessLevel: p.accessLevel,
      });
    }
  }

  async getAuditLogs(filters: {
    search?: string;
    actionType?: string;
    entityType?: string;
    page: number;
    limit: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    let logs = Array.from(this.auditLogs.values());

    if (filters.search) {
      const search = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.actionType.toLowerCase().includes(search) ||
          l.entityType.toLowerCase().includes(search)
      );
    }

    if (filters.actionType && filters.actionType !== "all") {
      logs = logs.filter((l) => l.actionType === filters.actionType);
    }

    if (filters.entityType && filters.entityType !== "all") {
      logs = logs.filter((l) => l.entityType === filters.entityType);
    }

    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = logs.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedLogs = logs.slice(start, start + filters.limit);

    return { logs: paginatedLogs, total };
  }

  async createAuditLog(log: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    const id = randomUUID();
    const auditLog: AuditLog = {
      id,
      ...log,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.set(id, auditLog);
    return auditLog;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const users = Array.from(this.users.values()).filter((u) => !u.deletedAt);
    const roles = Array.from(this.roles.values());
    const recentLogs = Array.from(this.auditLogs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      pendingUsers: users.filter((u) => u.status === "pending").length,
      totalRoles: roles.length,
      recentActivity: recentLogs,
    };
  }

  async getRegions(): Promise<Region[]> {
    return Array.from(this.regions.values());
  }

  async getCities(regionId?: string): Promise<City[]> {
    const cities = Array.from(this.cities.values());
    if (regionId) {
      return cities.filter((c) => c.regionId === regionId);
    }
    return cities;
  }

  async getDistricts(cityId?: string): Promise<District[]> {
    const districts = Array.from(this.districts.values());
    if (cityId) {
      return districts.filter((d) => d.cityId === cityId);
    }
    return districts;
  }

  async getRegion(id: string): Promise<Region | undefined> {
    return this.regions.get(id);
  }

  async getCity(id: string): Promise<City | undefined> {
    return this.cities.get(id);
  }

  async getDistrict(id: string): Promise<District | undefined> {
    return this.districts.get(id);
  }

  private enrichAsset(asset: Asset): AssetWithDetails {
    return {
      ...asset,
      region: this.regions.get(asset.regionId),
      city: this.cities.get(asset.cityId),
      district: this.districts.get(asset.districtId),
      createdByUser: this.users.get(asset.createdBy),
    };
  }

  async getAsset(id: string): Promise<AssetWithDetails | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;
    return this.enrichAsset(asset);
  }

  async getAssets(filters: AssetFilters): Promise<{ assets: AssetWithDetails[]; total: number }> {
    let assets = Array.from(this.assets.values());

    if (filters.search) {
      const search = filters.search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.assetCode.toLowerCase().includes(search) ||
          a.assetNameAr.includes(search) ||
          a.assetNameEn.toLowerCase().includes(search)
      );
    }

    if (filters.status && filters.status !== "all") {
      assets = assets.filter((a) => a.status === filters.status);
    }

    if (filters.assetType && filters.assetType !== "all") {
      assets = assets.filter((a) => a.assetType === filters.assetType);
    }

    if (filters.regionId) {
      assets = assets.filter((a) => a.regionId === filters.regionId);
    }

    if (filters.cityId) {
      assets = assets.filter((a) => a.cityId === filters.cityId);
    }

    if (filters.districtId) {
      assets = assets.filter((a) => a.districtId === filters.districtId);
    }

    if (filters.createdBy) {
      assets = assets.filter((a) => a.createdBy === filters.createdBy);
    }

    assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = assets.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedAssets = assets.slice(start, start + filters.limit);

    return { assets: paginatedAssets.map((a) => this.enrichAsset(a)), total };
  }

  async getAssetBank(filters: AssetBankFilters): Promise<{ assets: AssetWithDetails[]; total: number }> {
    let assets = Array.from(this.assets.values()).filter((a) => a.status === "completed");

    if (filters.search) {
      const search = filters.search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.assetCode.toLowerCase().includes(search) ||
          a.assetNameAr.includes(search) ||
          a.assetNameEn.toLowerCase().includes(search)
      );
    }

    if (filters.assetType && filters.assetType !== "all") {
      assets = assets.filter((a) => a.assetType === filters.assetType);
    }

    if (filters.regionId) {
      assets = assets.filter((a) => a.regionId === filters.regionId);
    }

    if (filters.cityId) {
      assets = assets.filter((a) => a.cityId === filters.cityId);
    }

    if (filters.districtId) {
      assets = assets.filter((a) => a.districtId === filters.districtId);
    }

    if (filters.ownershipType && filters.ownershipType !== "all") {
      assets = assets.filter((a) => a.ownershipType === filters.ownershipType);
    }

    if (filters.visibilityStatus && filters.visibilityStatus !== "all") {
      const isVisible = filters.visibilityStatus === "visible";
      assets = assets.filter((a) => a.visibleToInvestors === isVisible);
    }

    if (filters.areaMin !== undefined) {
      assets = assets.filter((a) => a.totalArea >= filters.areaMin!);
    }

    if (filters.areaMax !== undefined) {
      assets = assets.filter((a) => a.totalArea <= filters.areaMax!);
    }

    assets.sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

    const total = assets.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedAssets = assets.slice(start, start + filters.limit);

    return { assets: paginatedAssets.map((a) => this.enrichAsset(a)), total };
  }

  async createAsset(insertAsset: InsertAsset, createdBy: string): Promise<Asset> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const assetCode = await this.generateAssetCode();

    const asset: Asset = {
      id,
      assetCode,
      assetNameAr: insertAsset.assetNameAr,
      assetNameEn: insertAsset.assetNameEn,
      assetType: insertAsset.assetType,
      regionId: insertAsset.regionId,
      cityId: insertAsset.cityId,
      districtId: insertAsset.districtId,
      neighborhood: insertAsset.neighborhood ?? null,
      streetAddress: insertAsset.streetAddress ?? null,
      latitude: insertAsset.latitude ?? null,
      longitude: insertAsset.longitude ?? null,
      locationValidated: false,
      nearbyAssetsJustification: null,
      totalArea: insertAsset.totalArea,
      builtUpArea: insertAsset.builtUpArea ?? null,
      landUseType: insertAsset.landUseType ?? null,
      zoningClassification: insertAsset.zoningClassification ?? null,
      currentStatus: insertAsset.currentStatus ?? null,
      ownershipType: insertAsset.ownershipType ?? null,
      deedNumber: insertAsset.deedNumber ?? null,
      deedDate: insertAsset.deedDate ?? null,
      ownershipDocuments: [],
      features: insertAsset.features ?? [],
      customFeatures: insertAsset.customFeatures ?? null,
      financialDues: insertAsset.financialDues ?? null,
      custodyDetails: insertAsset.custodyDetails ?? null,
      administrativeNotes: insertAsset.administrativeNotes ?? null,
      relatedReferences: insertAsset.relatedReferences ?? null,
      description: insertAsset.description ?? null,
      specialConditions: insertAsset.specialConditions ?? null,
      investmentPotential: insertAsset.investmentPotential ?? null,
      restrictions: insertAsset.restrictions ?? null,
      attachments: [],
      status: "draft",
      registrationMode: insertAsset.registrationMode ?? null,
      currentStage: null,
      verifiedBy: [],
      rejectionReason: null,
      rejectionJustification: null,
      visibleToInvestors: false,
      visibilityCount: 0,
      totalExposureDays: 0,
      hasActiveIsnad: false,
      hasActiveContract: false,
      createdBy,
      createdAt: now,
      submittedAt: null,
      completedAt: null,
      updatedBy: null,
      updatedAt: now,
    };

    this.assets.set(id, asset);
    return asset;
  }

  async updateAsset(id: string, updates: Partial<Asset>, updatedBy: string): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;

    const updatedAsset: Asset = {
      ...asset,
      ...updates,
      id: asset.id,
      assetCode: asset.assetCode,
      createdBy: asset.createdBy,
      createdAt: asset.createdAt,
      updatedBy,
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const asset = this.assets.get(id);
    if (!asset || asset.status !== "draft") return false;
    this.assets.delete(id);
    return true;
  }

  async submitAsset(id: string, mode: "direct" | "approval_cycle"): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset || asset.status !== "draft") return undefined;

    const now = new Date().toISOString();

    if (mode === "direct") {
      asset.status = "completed";
      asset.registrationMode = "direct";
      asset.submittedAt = now;
      asset.completedAt = now;
    } else {
      asset.status = "in_review";
      asset.registrationMode = "approval_cycle";
      asset.currentStage = "school_planning";
      asset.submittedAt = now;
    }

    asset.updatedAt = now;
    this.assets.set(id, asset);

    await this.createWorkflowHistoryEntry({
      assetId: id,
      stage: asset.currentStage || "school_planning",
      action: "submitted",
      reviewerId: null,
      reviewerDepartment: null,
      comments: null,
      rejectionReason: null,
      rejectionJustification: null,
      documentsAdded: [],
      actionDate: now,
    });

    return asset;
  }

  async approveAsset(id: string, reviewerId: string, comments?: string): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset || asset.status !== "in_review" || !asset.currentStage) return undefined;

    const reviewer = this.users.get(reviewerId);
    const now = new Date().toISOString();
    const stageIndex = workflowStageEnum.indexOf(asset.currentStage);

    asset.verifiedBy.push({
      department: asset.currentStage,
      userId: reviewerId,
      userName: reviewer?.email || "Unknown",
      date: now,
    });

    await this.createWorkflowHistoryEntry({
      assetId: id,
      stage: asset.currentStage,
      action: "approved",
      reviewerId,
      reviewerDepartment: asset.currentStage,
      comments: comments || null,
      rejectionReason: null,
      rejectionJustification: null,
      documentsAdded: [],
      actionDate: now,
    });

    if (stageIndex < workflowStageEnum.length - 1) {
      asset.currentStage = workflowStageEnum[stageIndex + 1];
    } else {
      asset.status = "completed";
      asset.currentStage = null;
      asset.completedAt = now;
    }

    asset.updatedAt = now;
    this.assets.set(id, asset);
    return asset;
  }

  async rejectAsset(id: string, reviewerId: string, reason: string, justification: string): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset || asset.status !== "in_review" || !asset.currentStage) return undefined;

    const now = new Date().toISOString();

    await this.createWorkflowHistoryEntry({
      assetId: id,
      stage: asset.currentStage,
      action: "rejected",
      reviewerId,
      reviewerDepartment: asset.currentStage,
      comments: null,
      rejectionReason: reason,
      rejectionJustification: justification,
      documentsAdded: [],
      actionDate: now,
    });

    asset.status = "rejected";
    asset.rejectionReason = reason;
    asset.rejectionJustification = justification;
    asset.updatedAt = now;
    this.assets.set(id, asset);
    return asset;
  }

  async toggleAssetVisibility(id: string, visible: boolean, userId: string, reason?: string): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset || asset.status !== "completed") return undefined;

    const now = new Date().toISOString();

    if (asset.visibleToInvestors && !visible) {
      const currentVisibility = Array.from(this.assetVisibilityHistory.values()).find(
        (v) => v.assetId === id && v.endDate === null
      );
      if (currentVisibility) {
        const startDate = new Date(currentVisibility.startDate);
        const endDate = new Date(now);
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        currentVisibility.endDate = now;
        currentVisibility.durationDays = durationDays;
        asset.totalExposureDays += durationDays;
      }
    }

    if (!asset.visibleToInvestors && visible) {
      const historyId = randomUUID();
      this.assetVisibilityHistory.set(historyId, {
        id: historyId,
        assetId: id,
        visibilityStatus: "visible",
        startDate: now,
        endDate: null,
        durationDays: null,
        changedBy: userId,
        reason: reason || null,
        createdAt: now,
      });
      asset.visibilityCount += 1;
    }

    asset.visibleToInvestors = visible;
    asset.updatedAt = now;
    this.assets.set(id, asset);
    return asset;
  }

  async getAssetDashboardStats(): Promise<AssetDashboardStats> {
    const assets = Array.from(this.assets.values());

    return {
      totalAssets: assets.length,
      draftAssets: assets.filter((a) => a.status === "draft").length,
      inReviewAssets: assets.filter((a) => a.status === "in_review").length,
      completedAssets: assets.filter((a) => a.status === "completed").length,
      rejectedAssets: assets.filter((a) => a.status === "rejected").length,
      visibleToInvestors: assets.filter((a) => a.visibleToInvestors).length,
      byAssetType: {
        land: assets.filter((a) => a.assetType === "land").length,
        building: assets.filter((a) => a.assetType === "building").length,
      },
      recentRegistrations: assets
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    };
  }

  async getReviewQueue(department: WorkflowStage): Promise<ReviewQueueItem[]> {
    const assets = Array.from(this.assets.values()).filter(
      (a) => a.status === "in_review" && a.currentStage === department
    );

    const now = new Date();
    const SLA_DAYS = 5;

    return assets.map((asset) => {
      const submittedDate = asset.submittedAt || asset.createdAt;
      const daysPending = Math.ceil((now.getTime() - new Date(submittedDate).getTime()) / (1000 * 60 * 60 * 24));
      const slaPercent = (daysPending / SLA_DAYS) * 100;

      let slaStatus: "on_time" | "warning" | "urgent" | "overdue";
      if (slaPercent > 100) slaStatus = "overdue";
      else if (slaPercent > 80) slaStatus = "urgent";
      else if (slaPercent > 50) slaStatus = "warning";
      else slaStatus = "on_time";

      return {
        asset: this.enrichAsset(asset),
        daysPending,
        slaStatus,
        submittedDate,
      };
    });
  }

  async getAssetWorkflowHistory(assetId: string): Promise<AssetWorkflowHistory[]> {
    return Array.from(this.assetWorkflowHistory.values())
      .filter((h) => h.assetId === assetId)
      .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
  }

  async createWorkflowHistoryEntry(entry: Omit<AssetWorkflowHistory, "id" | "createdAt">): Promise<AssetWorkflowHistory> {
    const id = randomUUID();
    const historyEntry: AssetWorkflowHistory = {
      id,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.assetWorkflowHistory.set(id, historyEntry);
    return historyEntry;
  }

  async getAssetVisibilityHistory(assetId: string): Promise<AssetVisibilityHistory[]> {
    return Array.from(this.assetVisibilityHistory.values())
      .filter((h) => h.assetId === assetId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async getAssetComments(assetId: string): Promise<AssetComment[]> {
    return Array.from(this.assetComments.values())
      .filter((c) => c.assetId === assetId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAssetComment(comment: Omit<AssetComment, "id" | "createdAt">): Promise<AssetComment> {
    const id = randomUUID();
    const assetComment: AssetComment = {
      id,
      ...comment,
      createdAt: new Date().toISOString(),
    };
    this.assetComments.set(id, assetComment);
    return assetComment;
  }

  async generateAssetCode(): Promise<string> {
    const code = `AST-${String(this.assetCodeCounter).padStart(6, "0")}`;
    this.assetCodeCounter++;
    return code;
  }

  async checkDuplicateAssetName(nameAr: string, nameEn: string, districtId: string, excludeId?: string): Promise<boolean> {
    const assets = Array.from(this.assets.values());
    return assets.some(
      (a) =>
        a.id !== excludeId &&
        a.districtId === districtId &&
        (a.assetNameAr === nameAr || a.assetNameEn.toLowerCase() === nameEn.toLowerCase())
    );
  }

  // ISNAD Form Methods
  private enrichIsnadForm(form: IsnadForm): IsnadFormWithDetails {
    const asset = this.assets.get(form.assetId);
    const createdByUser = this.users.get(form.createdBy);
    const currentAssignee = form.currentAssigneeId ? this.users.get(form.currentAssigneeId) : undefined;
    const approvalHistory = Array.from(this.isnadApprovals.values())
      .filter((a) => a.formId === form.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      ...form,
      asset: asset ? this.enrichAsset(asset) : undefined,
      createdByUser,
      currentAssignee,
      approvalHistory,
    };
  }

  async getIsnadForm(id: string): Promise<IsnadFormWithDetails | undefined> {
    const form = this.isnadForms.get(id);
    if (!form) return undefined;
    return this.enrichIsnadForm(form);
  }

  async getIsnadForms(filters: IsnadFilters): Promise<{ forms: IsnadFormWithDetails[]; total: number }> {
    let forms = Array.from(this.isnadForms.values());

    if (filters.search) {
      const search = filters.search.toLowerCase();
      forms = forms.filter((f) => {
        const asset = this.assets.get(f.assetId);
        return (
          f.formCode.toLowerCase().includes(search) ||
          (asset && (asset.assetNameEn.toLowerCase().includes(search) || asset.assetNameAr.includes(search)))
        );
      });
    }

    if (filters.status && filters.status !== "all") {
      forms = forms.filter((f) => f.status === filters.status);
    }

    if (filters.stage && filters.stage !== "all") {
      forms = forms.filter((f) => f.currentStage === filters.stage);
    }

    if (filters.assetId) {
      forms = forms.filter((f) => f.assetId === filters.assetId);
    }

    if (filters.createdBy) {
      forms = forms.filter((f) => f.createdBy === filters.createdBy);
    }

    if (filters.assigneeId) {
      forms = forms.filter((f) => f.currentAssigneeId === filters.assigneeId);
    }

    forms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = forms.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedForms = forms.slice(start, start + filters.limit);

    return { forms: paginatedForms.map((f) => this.enrichIsnadForm(f)), total };
  }

  async createIsnadForm(insertForm: InsertIsnadForm, createdBy: string): Promise<IsnadForm> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const formCode = await this.generateIsnadCode();

    const form: IsnadForm = {
      id,
      formCode,
      assetId: insertForm.assetId,
      status: "draft",
      currentStage: "ip_initiation",
      currentAssigneeId: createdBy,
      investmentCriteria: insertForm.investmentCriteria || null,
      technicalAssessment: insertForm.technicalAssessment || null,
      financialAnalysis: insertForm.financialAnalysis || null,
      attachments: [],
      submittedAt: null,
      completedAt: null,
      returnCount: 0,
      slaDeadline: null,
      slaStatus: null,
      packageId: null,
      cancellationReason: null,
      cancelledAt: null,
      cancelledBy: null,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    this.isnadForms.set(id, form);

    const asset = this.assets.get(insertForm.assetId);
    if (asset) {
      asset.hasActiveIsnad = true;
      this.assets.set(asset.id, asset);
    }

    return form;
  }

  async updateIsnadForm(id: string, updates: Partial<IsnadForm>): Promise<IsnadForm | undefined> {
    const form = this.isnadForms.get(id);
    if (!form) return undefined;

    const updatedForm: IsnadForm = {
      ...form,
      ...updates,
      id: form.id,
      formCode: form.formCode,
      createdBy: form.createdBy,
      createdAt: form.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.isnadForms.set(id, updatedForm);
    return updatedForm;
  }

  async submitIsnadForm(id: string): Promise<IsnadForm | undefined> {
    const form = this.isnadForms.get(id);
    if (!form || form.status !== "draft") return undefined;

    const now = new Date().toISOString();
    const slaDays = slaDaysConfig.school_planning;
    const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();

    form.status = "submitted";
    form.currentStage = "school_planning";
    form.submittedAt = now;
    form.slaDeadline = slaDeadline;
    form.slaStatus = "on_time";
    form.updatedAt = now;

    this.isnadForms.set(id, form);

    const approvalId = randomUUID();
    this.isnadApprovals.set(approvalId, {
      id: approvalId,
      formId: id,
      stage: "ip_initiation",
      approverId: form.createdBy,
      approverRole: "I&P",
      action: "submitted",
      comments: null,
      rejectionReason: null,
      rejectionJustification: null,
      attachments: [],
      assignedAt: now,
      actionTakenAt: now,
      durationHours: 0,
      slaCompliant: true,
      createdAt: now,
    });

    return form;
  }

  private getNextIsnadStage(currentStage: IsnadStage): IsnadStage | null {
    const stageOrder: IsnadStage[] = [
      "ip_initiation",
      "school_planning",
      "asset_management",
      "shared_services",
      "education_dept",
      "investment_agency",
    ];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < 0 || currentIndex >= stageOrder.length - 1) return null;
    return stageOrder[currentIndex + 1];
  }

  async processIsnadAction(id: string, reviewerId: string, action: IsnadReviewAction): Promise<IsnadForm | undefined> {
    const form = this.isnadForms.get(id);
    if (!form || form.status === "draft" || form.status === "approved" || form.status === "rejected" || form.status === "cancelled") {
      return undefined;
    }

    const now = new Date().toISOString();
    const reviewer = this.users.get(reviewerId);

    const approvalId = randomUUID();
    const approval: IsnadApproval = {
      id: approvalId,
      formId: id,
      stage: form.currentStage,
      approverId: reviewerId,
      approverRole: reviewer?.email || null,
      action: action.action as IsnadAction,
      comments: action.comments || null,
      rejectionReason: action.rejectionReason || null,
      rejectionJustification: action.rejectionJustification || null,
      attachments: [],
      assignedAt: form.updatedAt,
      actionTakenAt: now,
      durationHours: (new Date(now).getTime() - new Date(form.updatedAt).getTime()) / (1000 * 60 * 60),
      slaCompliant: form.slaStatus !== "overdue",
      createdAt: now,
    };
    this.isnadApprovals.set(approvalId, approval);

    if (action.action === "approve") {
      const nextStage = this.getNextIsnadStage(form.currentStage);
      if (nextStage) {
        form.currentStage = nextStage;
        form.status = nextStage === "investment_agency" ? "investment_agency_review" : "in_department_review";
        const slaDays = slaDaysConfig[nextStage];
        form.slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();
        form.slaStatus = "on_time";
      } else {
        form.status = "approved";
        form.currentStage = "investment_agency";
        form.completedAt = now;
        form.slaDeadline = null;
        form.slaStatus = null;
      }
    } else if (action.action === "reject") {
      form.status = "rejected";
      form.completedAt = now;
      form.slaDeadline = null;
      form.slaStatus = null;

      const asset = this.assets.get(form.assetId);
      if (asset) {
        asset.hasActiveIsnad = false;
        this.assets.set(asset.id, asset);
      }
    } else if (action.action === "return") {
      form.status = "returned";
      form.currentStage = "ip_initiation";
      form.returnCount += 1;
      form.slaDeadline = null;
      form.slaStatus = null;
    } else if (action.action === "request_info") {
      form.slaDeadline = null;
      form.slaStatus = null;
    } else if (action.action === "info_provided") {
      const slaDays = slaDaysConfig[form.currentStage];
      form.slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();
      form.slaStatus = "on_time";
    }

    form.updatedAt = now;
    this.isnadForms.set(id, form);
    return form;
  }

  async cancelIsnadForm(id: string, userId: string, reason: string): Promise<IsnadForm | undefined> {
    const form = this.isnadForms.get(id);
    if (!form || form.status === "approved" || form.status === "cancelled") return undefined;

    const now = new Date().toISOString();
    form.status = "cancelled";
    form.cancellationReason = reason;
    form.cancelledAt = now;
    form.cancelledBy = userId;
    form.updatedAt = now;

    this.isnadForms.set(id, form);

    const asset = this.assets.get(form.assetId);
    if (asset) {
      asset.hasActiveIsnad = false;
      this.assets.set(asset.id, asset);
    }

    return form;
  }

  async getIsnadReviewQueue(stage: IsnadStage): Promise<IsnadReviewQueueItem[]> {
    const forms = Array.from(this.isnadForms.values()).filter(
      (f) => (f.status === "submitted" || f.status === "in_department_review" || f.status === "investment_agency_review") && f.currentStage === stage
    );

    const now = new Date();
    const slaDays = slaDaysConfig[stage] || 5;

    return forms.map((form) => {
      const submittedDate = form.submittedAt || form.createdAt;
      const daysPending = Math.ceil((now.getTime() - new Date(submittedDate).getTime()) / (1000 * 60 * 60 * 24));
      const slaPercent = (daysPending / slaDays) * 100;

      let slaStatus: SlaStatus;
      if (slaPercent > 100) slaStatus = "overdue";
      else if (slaPercent > 80) slaStatus = "urgent";
      else if (slaPercent > 50) slaStatus = "warning";
      else slaStatus = "on_time";

      return {
        form: this.enrichIsnadForm(form),
        daysPending,
        slaStatus,
        submittedDate,
      };
    });
  }

  async getIsnadDashboardStats(userId?: string): Promise<IsnadDashboardStats> {
    let forms = Array.from(this.isnadForms.values());

    if (userId) {
      forms = forms.filter((f) => f.createdBy === userId);
    }

    const byStage: Record<IsnadStage, number> = {} as Record<IsnadStage, number>;
    for (const stage of isnadStageEnum) {
      byStage[stage] = forms.filter((f) => f.currentStage === stage).length;
    }

    const slaCompliance = {
      onTime: forms.filter((f) => f.slaStatus === "on_time").length,
      warning: forms.filter((f) => f.slaStatus === "warning").length,
      urgent: forms.filter((f) => f.slaStatus === "urgent").length,
      overdue: forms.filter((f) => f.slaStatus === "overdue").length,
    };

    return {
      totalForms: forms.length,
      draftForms: forms.filter((f) => f.status === "draft").length,
      inReviewForms: forms.filter((f) => ["submitted", "in_department_review", "investment_agency_review"].includes(f.status)).length,
      approvedForms: forms.filter((f) => f.status === "approved").length,
      rejectedForms: forms.filter((f) => f.status === "rejected").length,
      returnedForms: forms.filter((f) => f.status === "returned").length,
      pendingMyAction: 0,
      byStage,
      slaCompliance,
      recentForms: forms.slice(0, 5).map((f) => this.enrichIsnadForm(f)),
    };
  }

  async getIsnadApprovals(formId: string): Promise<IsnadApproval[]> {
    return Array.from(this.isnadApprovals.values())
      .filter((a) => a.formId === formId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async generateIsnadCode(): Promise<string> {
    const year = new Date().getFullYear();
    const code = `ISNAD-${year}-${String(this.isnadCodeCounter).padStart(4, "0")}`;
    this.isnadCodeCounter++;
    return code;
  }

  // ISNAD Package Methods
  private enrichPackage(pkg: IsnadPackage): IsnadPackageWithDetails {
    const createdByUser = this.users.get(pkg.createdBy);
    const packageAssetsRecs = Array.from(this.packageAssets.values()).filter((pa) => pa.packageId === pkg.id);
    const assets = packageAssetsRecs.map((pa) => this.assets.get(pa.assetId)).filter(Boolean) as Asset[];
    const forms = packageAssetsRecs.map((pa) => this.isnadForms.get(pa.formId)).filter(Boolean) as IsnadForm[];

    return {
      ...pkg,
      createdByUser,
      assets: assets.map((a) => this.enrichAsset(a)),
      forms: forms.map((f) => this.enrichIsnadForm(f)),
    };
  }

  async getPackage(id: string): Promise<IsnadPackageWithDetails | undefined> {
    const pkg = this.isnadPackages.get(id);
    if (!pkg) return undefined;
    return this.enrichPackage(pkg);
  }

  async getPackages(filters: PackageFilters): Promise<{ packages: IsnadPackageWithDetails[]; total: number }> {
    let packages = Array.from(this.isnadPackages.values());

    if (filters.search) {
      const search = filters.search.toLowerCase();
      packages = packages.filter((p) => p.packageCode.toLowerCase().includes(search) || p.packageName.toLowerCase().includes(search));
    }

    if (filters.status && filters.status !== "all") {
      packages = packages.filter((p) => p.status === filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      packages = packages.filter((p) => p.priority === filters.priority);
    }

    if (filters.createdBy) {
      packages = packages.filter((p) => p.createdBy === filters.createdBy);
    }

    packages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = packages.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedPackages = packages.slice(start, start + filters.limit);

    return { packages: paginatedPackages.map((p) => this.enrichPackage(p)), total };
  }

  async createPackage(insertPkg: InsertPackage, createdBy: string): Promise<IsnadPackage> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const packageCode = await this.generatePackageCode();

    let totalValuation = 0;
    let expectedRevenue = 0;

    for (const formId of insertPkg.formIds) {
      const form = this.isnadForms.get(formId);
      if (form && form.financialAnalysis) {
        totalValuation += form.financialAnalysis.currentValuation || 0;
        expectedRevenue += form.financialAnalysis.expectedReturns || 0;
      }
    }

    const pkg: IsnadPackage = {
      id,
      packageCode,
      packageName: insertPkg.packageName,
      description: insertPkg.description || null,
      investmentStrategy: insertPkg.investmentStrategy || null,
      priority: insertPkg.priority,
      status: "draft",
      expectedRevenue,
      totalValuation,
      totalAssets: insertPkg.formIds.length,
      ceoApprovedAt: null,
      ceoComments: null,
      ministerApprovedAt: null,
      ministerComments: null,
      rejectionReason: null,
      packageDocumentUrl: null,
      createdBy,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    this.isnadPackages.set(id, pkg);

    for (const formId of insertPkg.formIds) {
      const form = this.isnadForms.get(formId);
      if (form) {
        const paId = randomUUID();
        this.packageAssets.set(paId, {
          id: paId,
          packageId: id,
          assetId: form.assetId,
          formId,
          addedAt: now,
        });
        form.packageId = id;
        form.status = "in_package";
        this.isnadForms.set(formId, form);
      }
    }

    return pkg;
  }

  async updatePackage(id: string, updates: Partial<IsnadPackage>): Promise<IsnadPackage | undefined> {
    const pkg = this.isnadPackages.get(id);
    if (!pkg) return undefined;

    const updatedPkg: IsnadPackage = {
      ...pkg,
      ...updates,
      id: pkg.id,
      packageCode: pkg.packageCode,
      createdBy: pkg.createdBy,
      createdAt: pkg.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.isnadPackages.set(id, updatedPkg);
    return updatedPkg;
  }

  async submitPackageToCeo(id: string): Promise<IsnadPackage | undefined> {
    const pkg = this.isnadPackages.get(id);
    if (!pkg || pkg.status !== "draft") return undefined;

    pkg.status = "pending_ceo";
    pkg.updatedAt = new Date().toISOString();
    this.isnadPackages.set(id, pkg);

    const packageAssetRecs = Array.from(this.packageAssets.values()).filter((pa) => pa.packageId === id);
    for (const pa of packageAssetRecs) {
      const form = this.isnadForms.get(pa.formId);
      if (form) {
        form.currentStage = "ceo_approval";
        form.status = "pending_ceo";
        this.isnadForms.set(form.id, form);
      }
    }

    return pkg;
  }

  async processPackageReview(id: string, reviewerId: string, reviewerRole: "ceo" | "minister", action: PackageReview): Promise<IsnadPackage | undefined> {
    const pkg = this.isnadPackages.get(id);
    if (!pkg) return undefined;

    const now = new Date().toISOString();

    if (reviewerRole === "ceo") {
      if (pkg.status !== "pending_ceo") return undefined;

      if (action.action === "approve") {
        pkg.status = "ceo_approved";
        pkg.ceoApprovedAt = now;
        pkg.ceoComments = action.comments || null;

        const packageAssetRecs = Array.from(this.packageAssets.values()).filter((pa) => pa.packageId === id);
        for (const pa of packageAssetRecs) {
          const form = this.isnadForms.get(pa.formId);
          if (form) {
            form.currentStage = "minister_approval";
            form.status = "pending_minister";
            this.isnadForms.set(form.id, form);
          }
        }
      } else {
        pkg.status = "rejected_ceo";
        pkg.rejectionReason = action.rejectionReason || null;
        pkg.completedAt = now;

        const packageAssetRecs = Array.from(this.packageAssets.values()).filter((pa) => pa.packageId === id);
        for (const pa of packageAssetRecs) {
          const form = this.isnadForms.get(pa.formId);
          if (form) {
            form.status = "rejected";
            form.completedAt = now;
            this.isnadForms.set(form.id, form);
          }
        }
      }
    } else if (reviewerRole === "minister") {
      if (pkg.status !== "ceo_approved" && pkg.status !== "pending_minister") return undefined;

      pkg.status = "pending_minister";

      if (action.action === "approve") {
        pkg.status = "minister_approved";
        pkg.ministerApprovedAt = now;
        pkg.ministerComments = action.comments || null;
        pkg.completedAt = now;

        const packageAssetRecs = Array.from(this.packageAssets.values()).filter((pa) => pa.packageId === id);
        for (const pa of packageAssetRecs) {
          const form = this.isnadForms.get(pa.formId);
          const asset = this.assets.get(pa.assetId);
          if (form) {
            form.status = "approved";
            form.completedAt = now;
            this.isnadForms.set(form.id, form);
          }
          if (asset) {
            asset.status = "completed";
            asset.visibleToInvestors = true;
            this.assets.set(asset.id, asset);
          }
        }
      } else {
        pkg.status = "rejected_minister";
        pkg.rejectionReason = action.rejectionReason || null;
        pkg.completedAt = now;

        const packageAssetRecs = Array.from(this.packageAssets.values()).filter((pa) => pa.packageId === id);
        for (const pa of packageAssetRecs) {
          const form = this.isnadForms.get(pa.formId);
          if (form) {
            form.status = "rejected";
            form.completedAt = now;
            this.isnadForms.set(form.id, form);
          }
        }
      }
    }

    pkg.updatedAt = now;
    this.isnadPackages.set(id, pkg);
    return pkg;
  }

  async getPackageDashboardStats(): Promise<PackageDashboardStats> {
    const packages = Array.from(this.isnadPackages.values());

    const approved = packages.filter((p) => p.status === "minister_approved");

    return {
      totalPackages: packages.length,
      draftPackages: packages.filter((p) => p.status === "draft").length,
      pendingCeo: packages.filter((p) => p.status === "pending_ceo").length,
      pendingMinister: packages.filter((p) => p.status === "ceo_approved" || p.status === "pending_minister").length,
      approved: approved.length,
      rejected: packages.filter((p) => p.status === "rejected_ceo" || p.status === "rejected_minister").length,
      totalValueApproved: approved.reduce((sum, p) => sum + p.totalValuation, 0),
      recentPackages: packages.slice(0, 5).map((p) => this.enrichPackage(p)),
    };
  }

  async getApprovedFormsForPackaging(): Promise<IsnadFormWithDetails[]> {
    const forms = Array.from(this.isnadForms.values()).filter(
      (f) => f.status === "approved" && !f.packageId && f.currentStage === "investment_agency"
    );
    return forms.map((f) => this.enrichIsnadForm(f));
  }

  async generatePackageCode(): Promise<string> {
    const year = new Date().getFullYear();
    const code = `PKG-${year}-${String(this.packageCodeCounter).padStart(3, "0")}`;
    this.packageCodeCounter++;
    return code;
  }

  // Notification Methods
  async getNotifications(userId: string, filters: NotificationFilters): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    let notifications = Array.from(this.notifications.values()).filter((n) => n.userId === userId);

    if (filters.type && filters.type !== "all") {
      notifications = notifications.filter((n) => n.type === filters.type);
    }

    if (filters.read !== undefined) {
      notifications = notifications.filter((n) => n.read === filters.read);
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifications.filter((n) => !n.read).length;
    const total = notifications.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedNotifications = notifications.slice(start, start + filters.limit);

    return { notifications: paginatedNotifications, total, unreadCount };
  }

  async createNotification(notif: Omit<Notification, "id" | "createdAt" | "read" | "readAt" | "emailSent" | "emailSentAt">): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      id,
      ...notif,
      read: false,
      readAt: null,
      emailSent: false,
      emailSentAt: null,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    notification.read = true;
    notification.readAt = new Date().toISOString();
    this.notifications.set(id, notification);
    return notification;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const now = new Date().toISOString();
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        notification.readAt = now;
        this.notifications.set(notification.id, notification);
      }
    }
  }
}

export const storage = new MemStorage();
