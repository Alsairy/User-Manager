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
  Investor,
  InsertInvestor,
  Contract,
  ContractWithDetails,
  InsertContract,
  UpdateContract,
  ContractFilters,
  CancelContract,
  Installment,
  InsertInstallment,
  UpdateInstallmentStatus,
  InstallmentPlan,
  ContractDashboardStats,
  ContractStatus,
  InstallmentStatus,
  InvestorAccount,
  InsertInvestorAccount,
  InvestorFavorite,
  InvestorFavoriteWithAsset,
  InvestorInterest,
  InvestorInterestWithDetails,
  InsertInvestorInterest,
  IstifadaRequest,
  IstifadaRequestWithDetails,
  InsertIstifadaRequest,
  InvestorNote,
  InvestorNoteWithUser,
  PortalAssetFilters,
  CrmInvestorFilters,
  InterestFilters,
  IstifadaFilters,
  PortalDashboardStats,
  CrmDashboardStats,
  InterestReviewAction,
  IstifadaReviewAction,
} from "@shared/schema";
import { permissionGroups, workflowStageEnum, isnadStageEnum, slaDaysConfig, workflowStepsOrder, type WorkflowStep } from "@shared/schema";
import { db, schema } from "./db";
import { eq, and, or, ilike, desc, count, sql } from "drizzle-orm";

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
  processStepApproval(
    formId: string,
    reviewerId: string,
    action: "approved" | "rejected" | "returned",
    comments: string | null,
    rejectionReason: string | null
  ): Promise<IsnadForm | undefined>;
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

  // Investor Methods
  getInvestor(id: string): Promise<Investor | undefined>;
  getInvestors(): Promise<Investor[]>;
  createInvestor(investor: InsertInvestor): Promise<Investor>;
  updateInvestor(id: string, updates: Partial<Investor>): Promise<Investor | undefined>;

  // Contract Methods
  getContract(id: string): Promise<ContractWithDetails | undefined>;
  getContracts(filters: ContractFilters): Promise<{ contracts: ContractWithDetails[]; total: number; statusCounts: Record<ContractStatus, number> }>;
  getDraftContracts(createdBy?: string): Promise<ContractWithDetails[]>;
  createContract(contract: InsertContract, createdBy: string): Promise<Contract>;
  updateContract(id: string, updates: UpdateContract, updatedBy: string): Promise<Contract | undefined>;
  activateContract(id: string): Promise<Contract | undefined>;
  archiveContract(id: string, archivedBy: string): Promise<Contract | undefined>;
  unarchiveContract(id: string): Promise<Contract | undefined>;
  cancelContract(id: string, cancelledBy: string, cancellation: CancelContract): Promise<Contract | undefined>;
  checkAssetHasActiveContract(assetId: string, excludeContractId?: string): Promise<boolean>;
  generateContractCode(): Promise<string>;
  getContractDashboardStats(): Promise<ContractDashboardStats>;

  // Installment Methods
  getInstallment(id: string): Promise<Installment | undefined>;
  getInstallments(contractId: string, year?: number): Promise<Installment[]>;
  createInstallmentPlan(contractId: string, plan: InstallmentPlan, totalAmount: number, startDate: string): Promise<Installment[]>;
  updateInstallmentStatus(id: string, status: UpdateInstallmentStatus, updatedBy: string): Promise<Installment | undefined>;
  deleteInstallmentPlan(contractId: string): Promise<void>;
  updateOverdueInstallments(): Promise<number>;

  // Investor Portal Methods (PostgreSQL)
  getInvestorAccount(id: string): Promise<InvestorAccount | undefined>;
  getInvestorAccountBySsoId(ssoUserId: string): Promise<InvestorAccount | undefined>;
  getInvestorAccounts(filters: CrmInvestorFilters): Promise<{ accounts: InvestorAccount[]; total: number }>;
  createInvestorAccount(account: InsertInvestorAccount): Promise<InvestorAccount>;
  updateInvestorAccount(id: string, updates: Partial<InvestorAccount>): Promise<InvestorAccount | undefined>;
  blockInvestorAccount(id: string): Promise<InvestorAccount | undefined>;
  
  // Portal Asset Methods
  getExposedAssets(filters: PortalAssetFilters): Promise<{ assets: AssetWithDetails[]; total: number }>;
  getExposedAsset(id: string): Promise<AssetWithDetails | undefined>;

  // Favorites Methods
  getFavorites(investorAccountId: string): Promise<InvestorFavoriteWithAsset[]>;
  addFavorite(investorAccountId: string, assetId: string): Promise<InvestorFavorite>;
  removeFavorite(investorAccountId: string, assetId: string): Promise<boolean>;
  isFavorited(investorAccountId: string, assetId: string): Promise<boolean>;
  getFavoriteCount(assetId: string): Promise<number>;
  getMostFavoritedAssets(limit?: number): Promise<{ assetId: string; assetName: string; count: number }[]>;

  // Investor Interest Methods
  getInvestorInterest(id: string): Promise<InvestorInterestWithDetails | undefined>;
  getInvestorInterests(filters: InterestFilters): Promise<{ interests: InvestorInterestWithDetails[]; total: number }>;
  getMyInterests(investorAccountId: string): Promise<InvestorInterestWithDetails[]>;
  createInvestorInterest(interest: InsertInvestorInterest, investorAccountId: string): Promise<InvestorInterest>;
  processInterestReview(id: string, reviewerId: string, action: InterestReviewAction): Promise<InvestorInterest | undefined>;
  generateInterestRefNumber(): Promise<string>;

  // Istifada Request Methods
  getIstifadaRequest(id: string): Promise<IstifadaRequestWithDetails | undefined>;
  getIstifadaRequests(filters: IstifadaFilters): Promise<{ requests: IstifadaRequestWithDetails[]; total: number }>;
  getMyIstifadaRequests(investorAccountId: string): Promise<IstifadaRequestWithDetails[]>;
  createIstifadaRequest(request: InsertIstifadaRequest, investorAccountId: string): Promise<IstifadaRequest>;
  processIstifadaReview(id: string, reviewerId: string, action: IstifadaReviewAction): Promise<IstifadaRequest | undefined>;
  generateIstifadaRefNumber(): Promise<string>;

  // CRM Notes
  getInvestorNotes(investorAccountId: string): Promise<InvestorNoteWithUser[]>;
  createInvestorNote(investorAccountId: string, noteType: string, content: string, createdBy: string): Promise<InvestorNote>;

  // Portal/CRM Dashboard Stats
  getPortalDashboardStats(investorAccountId: string): Promise<PortalDashboardStats>;
  getCrmDashboardStats(): Promise<CrmDashboardStats>;
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
  private investors: Map<string, Investor>;
  private contracts: Map<string, Contract>;
  private installments: Map<string, Installment>;
  private contractCodeCounter: number;
  private interestRefCounter: number;
  private istifadaRefCounter: number;

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
    this.investors = new Map();
    this.contracts = new Map();
    this.installments = new Map();
    this.contractCodeCounter = 1000;
    this.interestRefCounter = 1000;
    this.istifadaRefCounter = 1000;

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

    // Saudi Arabia - All 13 Administrative Regions
    const riyadhRegionId = randomUUID();
    const makkahRegionId = randomUUID();
    const madinahRegionId = randomUUID();
    const easternRegionId = randomUUID();
    const qassimRegionId = randomUUID();
    const hailRegionId = randomUUID();
    const tabukRegionId = randomUUID();
    const northernBordersRegionId = randomUUID();
    const joufRegionId = randomUUID();
    const asirRegionId = randomUUID();
    const najranRegionId = randomUUID();
    const jazanRegionId = randomUUID();
    const bahaRegionId = randomUUID();

    this.regions.set(riyadhRegionId, { id: riyadhRegionId, nameAr: "منطقة الرياض", nameEn: "Riyadh Region", code: "RIY" });
    this.regions.set(makkahRegionId, { id: makkahRegionId, nameAr: "منطقة مكة المكرمة", nameEn: "Makkah Region", code: "MAK" });
    this.regions.set(madinahRegionId, { id: madinahRegionId, nameAr: "منطقة المدينة المنورة", nameEn: "Madinah Region", code: "MED" });
    this.regions.set(easternRegionId, { id: easternRegionId, nameAr: "المنطقة الشرقية", nameEn: "Eastern Province", code: "EST" });
    this.regions.set(qassimRegionId, { id: qassimRegionId, nameAr: "منطقة القصيم", nameEn: "Qassim Region", code: "QAS" });
    this.regions.set(hailRegionId, { id: hailRegionId, nameAr: "منطقة حائل", nameEn: "Ha'il Region", code: "HAI" });
    this.regions.set(tabukRegionId, { id: tabukRegionId, nameAr: "منطقة تبوك", nameEn: "Tabuk Region", code: "TAB" });
    this.regions.set(northernBordersRegionId, { id: northernBordersRegionId, nameAr: "منطقة الحدود الشمالية", nameEn: "Northern Borders Region", code: "NOR" });
    this.regions.set(joufRegionId, { id: joufRegionId, nameAr: "منطقة الجوف", nameEn: "Al-Jouf Region", code: "JOF" });
    this.regions.set(asirRegionId, { id: asirRegionId, nameAr: "منطقة عسير", nameEn: "Asir Region", code: "ASR" });
    this.regions.set(najranRegionId, { id: najranRegionId, nameAr: "منطقة نجران", nameEn: "Najran Region", code: "NAJ" });
    this.regions.set(jazanRegionId, { id: jazanRegionId, nameAr: "منطقة جازان", nameEn: "Jazan Region", code: "JAZ" });
    this.regions.set(bahaRegionId, { id: bahaRegionId, nameAr: "منطقة الباحة", nameEn: "Al-Baha Region", code: "BAH" });

    // Riyadh Region Cities
    const riyadhCityId = randomUUID();
    const kharjCityId = randomUUID();
    const dawadmiCityId = randomUUID();
    const majmaahCityId = randomUUID();
    const afifCityId = randomUUID();
    const zulfiCityId = randomUUID();
    const diriyahCityId = randomUUID();
    this.cities.set(riyadhCityId, { id: riyadhCityId, regionId: riyadhRegionId, nameAr: "الرياض", nameEn: "Riyadh", code: "RIY-C" });
    this.cities.set(kharjCityId, { id: kharjCityId, regionId: riyadhRegionId, nameAr: "الخرج", nameEn: "Al-Kharj", code: "KHR-C" });
    this.cities.set(dawadmiCityId, { id: dawadmiCityId, regionId: riyadhRegionId, nameAr: "الدوادمي", nameEn: "Ad-Dawadmi", code: "DAW-C" });
    this.cities.set(majmaahCityId, { id: majmaahCityId, regionId: riyadhRegionId, nameAr: "المجمعة", nameEn: "Al-Majma'ah", code: "MAJ-C" });
    this.cities.set(afifCityId, { id: afifCityId, regionId: riyadhRegionId, nameAr: "عفيف", nameEn: "Afif", code: "AFF-C" });
    this.cities.set(zulfiCityId, { id: zulfiCityId, regionId: riyadhRegionId, nameAr: "الزلفي", nameEn: "Az-Zulfi", code: "ZUL-C" });
    this.cities.set(diriyahCityId, { id: diriyahCityId, regionId: riyadhRegionId, nameAr: "الدرعية", nameEn: "Diriyah", code: "DIR-C" });

    // Makkah Region Cities
    const makkahCityId = randomUUID();
    const jeddahCityId = randomUUID();
    const taifCityId = randomUUID();
    const qunfudhahCityId = randomUUID();
    const rabighCityId = randomUUID();
    this.cities.set(makkahCityId, { id: makkahCityId, regionId: makkahRegionId, nameAr: "مكة المكرمة", nameEn: "Makkah", code: "MAK-C" });
    this.cities.set(jeddahCityId, { id: jeddahCityId, regionId: makkahRegionId, nameAr: "جدة", nameEn: "Jeddah", code: "JED-C" });
    this.cities.set(taifCityId, { id: taifCityId, regionId: makkahRegionId, nameAr: "الطائف", nameEn: "Taif", code: "TAI-C" });
    this.cities.set(qunfudhahCityId, { id: qunfudhahCityId, regionId: makkahRegionId, nameAr: "القنفذة", nameEn: "Al-Qunfudhah", code: "QUN-C" });
    this.cities.set(rabighCityId, { id: rabighCityId, regionId: makkahRegionId, nameAr: "رابغ", nameEn: "Rabigh", code: "RAB-C" });

    // Madinah Region Cities
    const madinahCityId = randomUUID();
    const yanbuCityId = randomUUID();
    const ulaCityId = randomUUID();
    const baderCityId = randomUUID();
    this.cities.set(madinahCityId, { id: madinahCityId, regionId: madinahRegionId, nameAr: "المدينة المنورة", nameEn: "Madinah", code: "MED-C" });
    this.cities.set(yanbuCityId, { id: yanbuCityId, regionId: madinahRegionId, nameAr: "ينبع", nameEn: "Yanbu", code: "YAN-C" });
    this.cities.set(ulaCityId, { id: ulaCityId, regionId: madinahRegionId, nameAr: "العلا", nameEn: "Al-Ula", code: "ULA-C" });
    this.cities.set(baderCityId, { id: baderCityId, regionId: madinahRegionId, nameAr: "بدر", nameEn: "Badr", code: "BAD-C" });

    // Eastern Province Cities
    const dammamCityId = randomUUID();
    const khobarCityId = randomUUID();
    const dhahranCityId = randomUUID();
    const jubailCityId = randomUUID();
    const qatifCityId = randomUUID();
    const hasaCityId = randomUUID();
    const hofufCityId = randomUUID();
    const hafarAlBatinCityId = randomUUID();
    this.cities.set(dammamCityId, { id: dammamCityId, regionId: easternRegionId, nameAr: "الدمام", nameEn: "Dammam", code: "DAM-C" });
    this.cities.set(khobarCityId, { id: khobarCityId, regionId: easternRegionId, nameAr: "الخبر", nameEn: "Al-Khobar", code: "KHO-C" });
    this.cities.set(dhahranCityId, { id: dhahranCityId, regionId: easternRegionId, nameAr: "الظهران", nameEn: "Dhahran", code: "DHA-C" });
    this.cities.set(jubailCityId, { id: jubailCityId, regionId: easternRegionId, nameAr: "الجبيل", nameEn: "Jubail", code: "JUB-C" });
    this.cities.set(qatifCityId, { id: qatifCityId, regionId: easternRegionId, nameAr: "القطيف", nameEn: "Qatif", code: "QAT-C" });
    this.cities.set(hasaCityId, { id: hasaCityId, regionId: easternRegionId, nameAr: "الأحساء", nameEn: "Al-Hasa", code: "HAS-C" });
    this.cities.set(hofufCityId, { id: hofufCityId, regionId: easternRegionId, nameAr: "الهفوف", nameEn: "Al-Hofuf", code: "HOF-C" });
    this.cities.set(hafarAlBatinCityId, { id: hafarAlBatinCityId, regionId: easternRegionId, nameAr: "حفر الباطن", nameEn: "Hafar Al-Batin", code: "HAF-C" });

    // Qassim Region Cities
    const buraidahCityId = randomUUID();
    const unaizahCityId = randomUUID();
    const rassCityId = randomUUID();
    this.cities.set(buraidahCityId, { id: buraidahCityId, regionId: qassimRegionId, nameAr: "بريدة", nameEn: "Buraidah", code: "BUR-C" });
    this.cities.set(unaizahCityId, { id: unaizahCityId, regionId: qassimRegionId, nameAr: "عنيزة", nameEn: "Unaizah", code: "UNA-C" });
    this.cities.set(rassCityId, { id: rassCityId, regionId: qassimRegionId, nameAr: "الرس", nameEn: "Ar-Rass", code: "RAS-C" });

    // Ha'il Region Cities
    const hailCityId = randomUUID();
    const buqayyaCityId = randomUUID();
    this.cities.set(hailCityId, { id: hailCityId, regionId: hailRegionId, nameAr: "حائل", nameEn: "Ha'il", code: "HAI-C" });
    this.cities.set(buqayyaCityId, { id: buqayyaCityId, regionId: hailRegionId, nameAr: "بقعاء", nameEn: "Buqayya", code: "BUQ-C" });

    // Tabuk Region Cities
    const tabukCityId = randomUUID();
    const wajhCityId = randomUUID();
    const dhibaCityId = randomUUID();
    const tamaCityId = randomUUID();
    this.cities.set(tabukCityId, { id: tabukCityId, regionId: tabukRegionId, nameAr: "تبوك", nameEn: "Tabuk", code: "TAB-C" });
    this.cities.set(wajhCityId, { id: wajhCityId, regionId: tabukRegionId, nameAr: "الوجه", nameEn: "Al-Wajh", code: "WAJ-C" });
    this.cities.set(dhibaCityId, { id: dhibaCityId, regionId: tabukRegionId, nameAr: "ضبا", nameEn: "Dhiba", code: "DHI-C" });
    this.cities.set(tamaCityId, { id: tamaCityId, regionId: tabukRegionId, nameAr: "تيماء", nameEn: "Tayma", code: "TAY-C" });

    // Northern Borders Region Cities
    const aararCityId = randomUUID();
    const rafhaaCityId = randomUUID();
    const turayifCityId = randomUUID();
    this.cities.set(aararCityId, { id: aararCityId, regionId: northernBordersRegionId, nameAr: "عرعر", nameEn: "Arar", code: "ARA-C" });
    this.cities.set(rafhaaCityId, { id: rafhaaCityId, regionId: northernBordersRegionId, nameAr: "رفحاء", nameEn: "Rafha", code: "RAF-C" });
    this.cities.set(turayifCityId, { id: turayifCityId, regionId: northernBordersRegionId, nameAr: "طريف", nameEn: "Turaif", code: "TUR-C" });

    // Al-Jouf Region Cities
    const sakakaCityId = randomUUID();
    const dumatalJandalCityId = randomUUID();
    const qurayyatCityId = randomUUID();
    this.cities.set(sakakaCityId, { id: sakakaCityId, regionId: joufRegionId, nameAr: "سكاكا", nameEn: "Sakaka", code: "SAK-C" });
    this.cities.set(dumatalJandalCityId, { id: dumatalJandalCityId, regionId: joufRegionId, nameAr: "دومة الجندل", nameEn: "Dumat Al-Jandal", code: "DUM-C" });
    this.cities.set(qurayyatCityId, { id: qurayyatCityId, regionId: joufRegionId, nameAr: "القريات", nameEn: "Al-Qurayyat", code: "QUR-C" });

    // Asir Region Cities
    const abhaCityId = randomUUID();
    const khamisMushaitCityId = randomUUID();
    const bishshaCityId = randomUUID();
    const mahayilCityId = randomUUID();
    this.cities.set(abhaCityId, { id: abhaCityId, regionId: asirRegionId, nameAr: "أبها", nameEn: "Abha", code: "ABH-C" });
    this.cities.set(khamisMushaitCityId, { id: khamisMushaitCityId, regionId: asirRegionId, nameAr: "خميس مشيط", nameEn: "Khamis Mushait", code: "KHA-C" });
    this.cities.set(bishshaCityId, { id: bishshaCityId, regionId: asirRegionId, nameAr: "بيشة", nameEn: "Bisha", code: "BIS-C" });
    this.cities.set(mahayilCityId, { id: mahayilCityId, regionId: asirRegionId, nameAr: "محايل عسير", nameEn: "Mahayil Asir", code: "MAH-C" });

    // Najran Region Cities
    const najranCityId = randomUUID();
    const sharurahCityId = randomUUID();
    this.cities.set(najranCityId, { id: najranCityId, regionId: najranRegionId, nameAr: "نجران", nameEn: "Najran", code: "NAJ-C" });
    this.cities.set(sharurahCityId, { id: sharurahCityId, regionId: najranRegionId, nameAr: "شرورة", nameEn: "Sharurah", code: "SHA-C" });

    // Jazan Region Cities
    const jazanCityId = randomUUID();
    const sabiyaCityId = randomUUID();
    const abuArishCityId = randomUUID();
    const samtaCityId = randomUUID();
    this.cities.set(jazanCityId, { id: jazanCityId, regionId: jazanRegionId, nameAr: "جازان", nameEn: "Jazan", code: "JAZ-C" });
    this.cities.set(sabiyaCityId, { id: sabiyaCityId, regionId: jazanRegionId, nameAr: "صبيا", nameEn: "Sabiya", code: "SAB-C" });
    this.cities.set(abuArishCityId, { id: abuArishCityId, regionId: jazanRegionId, nameAr: "أبو عريش", nameEn: "Abu Arish", code: "ABU-C" });
    this.cities.set(samtaCityId, { id: samtaCityId, regionId: jazanRegionId, nameAr: "صامطة", nameEn: "Samtah", code: "SAM-C" });

    // Al-Baha Region Cities
    const bahaCityId = randomUUID();
    const baljurashiCityId = randomUUID();
    const mandaqCityId = randomUUID();
    this.cities.set(bahaCityId, { id: bahaCityId, regionId: bahaRegionId, nameAr: "الباحة", nameEn: "Al-Baha", code: "BAH-C" });
    this.cities.set(baljurashiCityId, { id: baljurashiCityId, regionId: bahaRegionId, nameAr: "بلجرشي", nameEn: "Baljurashi", code: "BAL-C" });
    this.cities.set(mandaqCityId, { id: mandaqCityId, regionId: bahaRegionId, nameAr: "المندق", nameEn: "Al-Mandaq", code: "MAN-C" });

    // Districts for Riyadh
    const alOlayaDistrictId = randomUUID();
    const alMalazDistrictId = randomUUID();
    const alSulaimaniyahDistrictId = randomUUID();
    const alNasimDistrictId = randomUUID();
    const alYasmamahDistrictId = randomUUID();
    this.districts.set(alOlayaDistrictId, { id: alOlayaDistrictId, cityId: riyadhCityId, nameAr: "العليا", nameEn: "Al Olaya", code: "OLY" });
    this.districts.set(alMalazDistrictId, { id: alMalazDistrictId, cityId: riyadhCityId, nameAr: "الملز", nameEn: "Al Malaz", code: "MLZ" });
    this.districts.set(alSulaimaniyahDistrictId, { id: alSulaimaniyahDistrictId, cityId: riyadhCityId, nameAr: "السليمانية", nameEn: "Al Sulaimaniyah", code: "SLM" });
    this.districts.set(alNasimDistrictId, { id: alNasimDistrictId, cityId: riyadhCityId, nameAr: "النسيم", nameEn: "Al Nasim", code: "NAS" });
    this.districts.set(alYasmamahDistrictId, { id: alYasmamahDistrictId, cityId: riyadhCityId, nameAr: "اليمامة", nameEn: "Al Yamamah", code: "YAM" });

    // Districts for Jeddah
    const alBaladDistrictId = randomUUID();
    const alHamraDistrictId = randomUUID();
    const alRawdahDistrictId = randomUUID();
    this.districts.set(alBaladDistrictId, { id: alBaladDistrictId, cityId: jeddahCityId, nameAr: "البلد", nameEn: "Al Balad", code: "BAL" });
    this.districts.set(alHamraDistrictId, { id: alHamraDistrictId, cityId: jeddahCityId, nameAr: "الحمراء", nameEn: "Al Hamra", code: "HAM" });
    this.districts.set(alRawdahDistrictId, { id: alRawdahDistrictId, cityId: jeddahCityId, nameAr: "الروضة", nameEn: "Al Rawdah", code: "RAW" });

    // Districts for Dammam
    const alFaysaliyyahDistrictId = randomUUID();
    const alShatiDistrictId = randomUUID();
    this.districts.set(alFaysaliyyahDistrictId, { id: alFaysaliyyahDistrictId, cityId: dammamCityId, nameAr: "الفيصلية", nameEn: "Al Faisaliyyah", code: "FAI" });
    this.districts.set(alShatiDistrictId, { id: alShatiDistrictId, cityId: dammamCityId, nameAr: "الشاطئ", nameEn: "Al Shati", code: "SHT" });

    // Districts for Makkah
    const alAziziyyahDistrictId = randomUUID();
    const alShishaDistrictId = randomUUID();
    const alMarwaDistrictId = randomUUID();
    this.districts.set(alAziziyyahDistrictId, { id: alAziziyyahDistrictId, cityId: makkahCityId, nameAr: "العزيزية", nameEn: "Al Aziziyyah", code: "AZZ" });
    this.districts.set(alShishaDistrictId, { id: alShishaDistrictId, cityId: makkahCityId, nameAr: "الششة", nameEn: "Al Shisha", code: "SHI" });
    this.districts.set(alMarwaDistrictId, { id: alMarwaDistrictId, cityId: makkahCityId, nameAr: "المروة", nameEn: "Al Marwa", code: "MRW" });

    // Districts for Madinah
    const alHaramDistrictId = randomUUID();
    const alIskanDistrictId = randomUUID();
    const qiblataynDistrictId = randomUUID();
    this.districts.set(alHaramDistrictId, { id: alHaramDistrictId, cityId: madinahCityId, nameAr: "الحرم", nameEn: "Al Haram", code: "HRM" });
    this.districts.set(alIskanDistrictId, { id: alIskanDistrictId, cityId: madinahCityId, nameAr: "الإسكان", nameEn: "Al Iskan", code: "ISK" });
    this.districts.set(qiblataynDistrictId, { id: qiblataynDistrictId, cityId: madinahCityId, nameAr: "القبلتين", nameEn: "Qiblatain", code: "QIB" });

    // Districts for Taif
    const alHadaDistrictId = randomUUID();
    const alShafaDistrictId = randomUUID();
    this.districts.set(alHadaDistrictId, { id: alHadaDistrictId, cityId: taifCityId, nameAr: "الهدا", nameEn: "Al Hada", code: "HDA" });
    this.districts.set(alShafaDistrictId, { id: alShafaDistrictId, cityId: taifCityId, nameAr: "الشفا", nameEn: "Al Shafa", code: "SHF" });

    // Districts for Al-Khobar
    const alKornishDistrictId = randomUUID();
    const alYarmoukDistrictId = randomUUID();
    this.districts.set(alKornishDistrictId, { id: alKornishDistrictId, cityId: khobarCityId, nameAr: "الكورنيش", nameEn: "Al Kornish", code: "KRN" });
    this.districts.set(alYarmoukDistrictId, { id: alYarmoukDistrictId, cityId: khobarCityId, nameAr: "اليرموك", nameEn: "Al Yarmouk", code: "YRM" });

    // Districts for Al-Kharj
    const alKhaldiyyahDistrictId = randomUUID();
    const alNazimDistrictId = randomUUID();
    this.districts.set(alKhaldiyyahDistrictId, { id: alKhaldiyyahDistrictId, cityId: kharjCityId, nameAr: "الخالدية", nameEn: "Al Khaldiyyah", code: "KHL" });
    this.districts.set(alNazimDistrictId, { id: alNazimDistrictId, cityId: kharjCityId, nameAr: "النظيم", nameEn: "Al Nazim", code: "NZM" });

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

    // Seed sample ISNAD forms that are ready for packaging (at tbc_final_approval stage)
    const sampleIsnadId1 = randomUUID();
    const sampleIsnadId2 = randomUUID();
    const sampleIsnadId3 = randomUUID();

    const createApprovedWorkflowSteps = (): WorkflowStep[] => {
      const lastStepIndex = workflowStepsOrder.length - 1;
      return workflowStepsOrder.map((stage, index) => ({
        stage,
        stepIndex: index,
        status: index < lastStepIndex ? "approved" as const : "current" as const,
        slaDeadline: null,
        slaStatus: index === lastStepIndex ? "on_time" as const : null,
        reviewerId: index < lastStepIndex ? adminUserId : null,
        reviewerName: index < lastStepIndex ? "Admin" : null,
        comments: index < lastStepIndex ? "Approved" : null,
        rejectionReason: null,
        actionTakenAt: index < lastStepIndex ? new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000).toISOString() : null,
      }));
    };

    this.isnadForms.set(sampleIsnadId1, {
      id: sampleIsnadId1,
      formCode: "ISNAD-001001",
      assetId: assetId1,
      status: "approved",
      currentStage: "tbc_final_approval",
      currentStepIndex: 8,
      currentAssigneeId: null,
      investmentCriteria: {
        investmentPurpose: "Educational institution development",
        revenueProjection: "SAR 2.5M annual",
        projectTimeline: "25 years",
        requiredModifications: "Minor upgrades needed",
        complianceRequirements: "Educational regulations",
        riskAssessment: "Low risk",
      },
      technicalAssessment: {
        structuralCondition: "Good condition",
        utilitiesAvailability: "Electricity and water available",
        accessInfrastructure: "Paved road access",
        environmentalConsiderations: "No environmental issues",
        zoningCompliance: "Compliant with zoning regulations",
      },
      financialAnalysis: {
        currentValuation: 25000000,
        outstandingDues: 0,
        maintenanceCosts: 100000,
        expectedReturns: 2500000,
        breakEvenAnalysis: "Expected break-even in 10 years",
      },
      schoolPlanningSection: {
        assetStatus: "vacant_land",
        planningNeed: "no_need",
        hasProgrammingForm: false,
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      investmentPartnershipsSection: {
        cityPreferred: true,
        districtPreferred: true,
        isCriticalArea: false,
        hasInvestmentBlockers: false,
        investmentProposal: "full",
        investmentType: "educational",
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      financeSection: {
        hasFinancialDues: false,
        custodyItemsCleared: true,
        electricityMeterNumbers: "EM-123456",
        waterMeterNumbers: "WM-789012",
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      securityFacilitiesSection: {
        structuralCondition: "operational",
        hasDemolitionDecision: false,
        dimensions: { north: "50m", east: "200m", south: "50m", west: "200m" },
        boundaries: {
          north: "commercial_street",
          east: "internal_street",
          south: "internal_street",
          west: "commercial_street",
        },
        location: { region: "Riyadh", city: "Riyadh", district: "Al Olaya" },
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      landRegistrySection: null,
      workflowSteps: createApprovedWorkflowSteps(),
      attachments: [],
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      returnCount: 0,
      returnedByStage: null,
      returnReason: null,
      slaDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      slaStatus: "on_time",
      cancellationReason: null,
      cancelledAt: null,
      cancelledBy: null,
      packageId: null,
      createdBy: sampleUserId,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now,
    });

    this.isnadForms.set(sampleIsnadId2, {
      id: sampleIsnadId2,
      formCode: "ISNAD-001002",
      assetId: assetId2,
      status: "approved",
      currentStage: "tbc_final_approval",
      currentStepIndex: 8,
      currentAssigneeId: null,
      investmentCriteria: {
        investmentPurpose: "Commercial development",
        revenueProjection: "SAR 1.5M annual",
        projectTimeline: "20 years",
        requiredModifications: "Utility upgrades required",
        complianceRequirements: "Commercial regulations",
        riskAssessment: "Medium risk",
      },
      technicalAssessment: {
        structuralCondition: "Excellent condition",
        utilitiesAvailability: "Electricity, water, and gas available",
        accessInfrastructure: "Highway access",
        environmentalConsiderations: "Environmental assessment completed",
        zoningCompliance: "Fully compliant",
      },
      financialAnalysis: {
        currentValuation: 15000000,
        outstandingDues: 50000,
        maintenanceCosts: 75000,
        expectedReturns: 1500000,
        breakEvenAnalysis: "Break-even in 8 years",
      },
      schoolPlanningSection: {
        assetStatus: "vacated_building",
        planningNeed: "no_need",
        hasProgrammingForm: false,
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      },
      investmentPartnershipsSection: {
        cityPreferred: true,
        districtPreferred: false,
        isCriticalArea: false,
        hasInvestmentBlockers: true,
        blockers: { lackOfDeed: false, financialLiabilities: true },
        investmentProposal: "partial",
        investmentType: "commercial",
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      financeSection: {
        hasFinancialDues: true,
        financialDuesAction: "Payment plan in progress",
        custodyItemsCleared: false,
        electricityMeterNumbers: "EM-654321",
        waterMeterNumbers: "WM-210987",
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      securityFacilitiesSection: {
        structuralCondition: "operational",
        hasDemolitionDecision: false,
        dimensions: { north: "100m", east: "100m", south: "100m", west: "100m" },
        boundaries: {
          north: "commercial_street",
          east: "commercial_street",
          south: "internal_street",
          west: "internal_street",
        },
        location: { region: "Riyadh", city: "Riyadh", district: "Al Malaz" },
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      landRegistrySection: null,
      workflowSteps: createApprovedWorkflowSteps(),
      attachments: [],
      submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      returnCount: 0,
      returnedByStage: null,
      returnReason: null,
      slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      slaStatus: "warning",
      cancellationReason: null,
      cancelledAt: null,
      cancelledBy: null,
      packageId: null,
      createdBy: sampleUserId,
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now,
    });

    this.isnadForms.set(sampleIsnadId3, {
      id: sampleIsnadId3,
      formCode: "ISNAD-001003",
      assetId: assetId3,
      status: "approved",
      currentStage: "tbc_final_approval",
      currentStepIndex: 8,
      currentAssigneeId: null,
      investmentCriteria: {
        investmentPurpose: "Vocational training facility",
        revenueProjection: "SAR 4M annual",
        projectTimeline: "30 years",
        requiredModifications: "None required",
        complianceRequirements: "Educational zone compliance",
        riskAssessment: "Low risk",
      },
      technicalAssessment: {
        structuralCondition: "Good condition",
        utilitiesAvailability: "Electricity, water, internet available",
        accessInfrastructure: "Multiple access points",
        environmentalConsiderations: "Green building certified",
        zoningCompliance: "Educational zone",
      },
      financialAnalysis: {
        currentValuation: 35000000,
        outstandingDues: 0,
        maintenanceCosts: 200000,
        expectedReturns: 4000000,
        breakEvenAnalysis: "Break-even in 9 years",
      },
      schoolPlanningSection: {
        assetStatus: "existing_building",
        planningNeed: "has_need",
        needExpectedPeriod: "5 years",
        hasProgrammingForm: true,
        programmingFormDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      investmentPartnershipsSection: {
        cityPreferred: true,
        districtPreferred: true,
        isCriticalArea: true,
        hasInvestmentBlockers: false,
        investmentProposal: "full",
        investmentType: "educational",
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      financeSection: {
        hasFinancialDues: false,
        custodyItemsCleared: true,
        electricityMeterNumbers: "EM-111222",
        waterMeterNumbers: "WM-333444",
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      securityFacilitiesSection: {
        structuralCondition: "operational",
        hasDemolitionDecision: false,
        dimensions: { north: "80m", east: "100m", south: "80m", west: "100m" },
        boundaries: {
          north: "commercial_street",
          east: "internal_street",
          south: "commercial_street",
          west: "internal_street",
        },
        location: { region: "Riyadh", city: "Riyadh", district: "Al Sulaimaniyah" },
        completedBy: adminUserId,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      landRegistrySection: null,
      workflowSteps: createApprovedWorkflowSteps(),
      attachments: [],
      submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      returnCount: 0,
      returnedByStage: null,
      returnReason: null,
      slaDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      slaStatus: "overdue",
      cancellationReason: null,
      cancelledAt: null,
      cancelledBy: null,
      packageId: null,
      createdBy: adminUserId,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now,
    });

    // Update assets to have active ISNAD
    const asset1 = this.assets.get(assetId1);
    if (asset1) {
      asset1.hasActiveIsnad = true;
      this.assets.set(assetId1, asset1);
    }
    const asset2 = this.assets.get(assetId2);
    if (asset2) {
      asset2.hasActiveIsnad = true;
      this.assets.set(assetId2, asset2);
    }
    const asset3 = this.assets.get(assetId3);
    if (asset3) {
      asset3.hasActiveIsnad = true;
      this.assets.set(assetId3, asset3);
    }

    this.isnadCodeCounter = 1004;
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

    const initialWorkflowSteps: WorkflowStep[] = workflowStepsOrder.map((stage, index) => ({
      stage,
      stepIndex: index,
      status: index === 0 ? "current" as const : "pending" as const,
      reviewerId: null,
      reviewerName: null,
      actionTakenAt: null,
      comments: null,
      rejectionReason: null,
      slaDeadline: null,
      slaStatus: null,
    }));

    const form: IsnadForm = {
      id,
      formCode,
      assetId: insertForm.assetId,
      status: "draft",
      currentStage: "ip_initiation",
      currentStepIndex: 0,
      currentAssigneeId: createdBy,
      investmentCriteria: insertForm.investmentCriteria || null,
      technicalAssessment: insertForm.technicalAssessment || null,
      financialAnalysis: insertForm.financialAnalysis || null,
      schoolPlanningSection: null,
      investmentPartnershipsSection: null,
      financeSection: null,
      landRegistrySection: null,
      securityFacilitiesSection: null,
      workflowSteps: initialWorkflowSteps,
      attachments: [],
      submittedAt: null,
      completedAt: null,
      returnCount: 0,
      returnedByStage: null,
      returnReason: null,
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
    if (!form || (form.status !== "draft" && form.status !== "changes_requested")) return undefined;

    const now = new Date().toISOString();
    const nextStage = workflowStepsOrder[1];
    const slaDays = slaDaysConfig[nextStage];
    const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();

    form.workflowSteps[0].status = "approved";
    form.workflowSteps[0].actionTakenAt = now;
    form.workflowSteps[0].reviewerId = form.createdBy;
    form.workflowSteps[1].status = "current";
    form.workflowSteps[1].slaDeadline = slaDeadline;
    form.workflowSteps[1].slaStatus = "on_time";

    form.status = "pending_verification";
    form.currentStage = nextStage;
    form.currentStepIndex = 1;
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

  private getNextStepIndex(currentIndex: number): number | null {
    if (currentIndex < 0 || currentIndex >= workflowStepsOrder.length - 1) return null;
    return currentIndex + 1;
  }

  async processStepApproval(
    formId: string,
    reviewerId: string,
    action: "approved" | "rejected" | "returned",
    comments: string | null,
    rejectionReason: string | null
  ): Promise<IsnadForm | undefined> {
    const form = this.isnadForms.get(formId);
    if (!form || form.status === "draft" || form.status === "approved" || form.status === "rejected" || form.status === "cancelled") {
      return undefined;
    }

    const now = new Date().toISOString();
    const reviewer = this.users.get(reviewerId);
    const currentStepIndex = form.currentStepIndex;

    form.workflowSteps[currentStepIndex] = {
      ...form.workflowSteps[currentStepIndex],
      status: action === "approved" ? "approved" : action === "rejected" ? "rejected" : "pending",
      reviewerId,
      reviewerName: reviewer?.email || null,
      actionTakenAt: now,
      comments,
      rejectionReason: action === "rejected" ? rejectionReason : null,
    };

    if (action === "rejected") {
      form.status = "rejected";
      form.returnedByStage = form.currentStage;
      form.returnReason = rejectionReason;
      form.updatedAt = now;
      this.isnadForms.set(formId, form);
      return form;
    }

    if (action === "returned") {
      form.status = "changes_requested";
      form.currentStage = "ip_initiation";
      form.currentStepIndex = 0;
      form.workflowSteps[0].status = "current";
      form.returnedByStage = workflowStepsOrder[currentStepIndex];
      form.returnReason = comments;
      form.returnCount = (form.returnCount || 0) + 1;
      form.updatedAt = now;
      this.isnadForms.set(formId, form);
      return form;
    }

    const nextStepIndex = this.getNextStepIndex(currentStepIndex);
    if (nextStepIndex !== null) {
      const nextStage = workflowStepsOrder[nextStepIndex];
      form.currentStepIndex = nextStepIndex;
      form.currentStage = nextStage;
      form.workflowSteps[nextStepIndex].status = "current";
      
      const slaDays = slaDaysConfig[nextStage];
      form.workflowSteps[nextStepIndex].slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();
      form.workflowSteps[nextStepIndex].slaStatus = "on_time";
      form.slaDeadline = form.workflowSteps[nextStepIndex].slaDeadline;
      form.slaStatus = "on_time";
      form.status = "pending_verification";
    } else {
      form.status = "approved";
      form.completedAt = now;
    }

    form.updatedAt = now;
    this.isnadForms.set(formId, form);
    return form;
  }

  async processIsnadAction(id: string, reviewerId: string, action: IsnadReviewAction): Promise<IsnadForm | undefined> {
    const form = this.isnadForms.get(id);
    if (!form || form.status === "draft" || form.status === "approved" || form.status === "rejected" || form.status === "cancelled") {
      return undefined;
    }

    const now = new Date().toISOString();
    const reviewer = this.users.get(reviewerId);
    const currentStepIndex = form.currentStepIndex;

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
      form.workflowSteps[currentStepIndex].status = "approved";
      form.workflowSteps[currentStepIndex].reviewerId = reviewerId;
      form.workflowSteps[currentStepIndex].reviewerName = reviewer?.email || null;
      form.workflowSteps[currentStepIndex].actionTakenAt = now;
      form.workflowSteps[currentStepIndex].comments = action.comments || null;

      const nextStepIndex = this.getNextStepIndex(currentStepIndex);
      if (nextStepIndex !== null) {
        const nextStage = workflowStepsOrder[nextStepIndex];
        form.currentStepIndex = nextStepIndex;
        form.currentStage = nextStage;
        form.workflowSteps[nextStepIndex].status = "current";
        
        const slaDays = slaDaysConfig[nextStage];
        form.workflowSteps[nextStepIndex].slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();
        form.workflowSteps[nextStepIndex].slaStatus = "on_time";
        form.slaDeadline = form.workflowSteps[nextStepIndex].slaDeadline;
        form.slaStatus = "on_time";
        form.status = "pending_verification";
      } else {
        form.status = "approved";
        form.completedAt = now;
        form.slaDeadline = null;
        form.slaStatus = null;
      }
    } else if (action.action === "reject") {
      form.workflowSteps[currentStepIndex].status = "rejected";
      form.workflowSteps[currentStepIndex].reviewerId = reviewerId;
      form.workflowSteps[currentStepIndex].reviewerName = reviewer?.email || null;
      form.workflowSteps[currentStepIndex].actionTakenAt = now;
      form.workflowSteps[currentStepIndex].rejectionReason = action.rejectionReason || null;

      form.status = "rejected";
      form.returnedByStage = form.currentStage;
      form.returnReason = action.rejectionReason || null;
      form.completedAt = now;
      form.slaDeadline = null;
      form.slaStatus = null;

      const asset = this.assets.get(form.assetId);
      if (asset) {
        asset.hasActiveIsnad = false;
        this.assets.set(asset.id, asset);
      }
    } else if (action.action === "return") {
      form.workflowSteps[currentStepIndex].status = "pending";
      form.workflowSteps[0].status = "current";
      
      form.status = "changes_requested";
      form.currentStage = "ip_initiation";
      form.currentStepIndex = 0;
      form.returnedByStage = workflowStepsOrder[currentStepIndex];
      form.returnReason = action.comments || null;
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
      (f) => (f.status === "pending_verification" || f.status === "verification_due" || f.status === "investment_agency_review") && f.currentStage === stage
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
      inReviewForms: forms.filter((f) => ["pending_verification", "verification_due", "verified_filled", "investment_agency_review"].includes(f.status)).length,
      approvedForms: forms.filter((f) => f.status === "approved").length,
      rejectedForms: forms.filter((f) => f.status === "rejected").length,
      changesRequestedForms: forms.filter((f) => f.status === "changes_requested").length,
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
      durationYears: insertPkg.durationYears || null,
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
        form.currentStage = "tbc_final_approval";
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
            form.currentStage = "tbc_final_approval";
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
      (f) => f.status === "approved" && !f.packageId && f.currentStage === "tbc_final_approval"
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

  // Investor Methods
  async getInvestor(id: string): Promise<Investor | undefined> {
    return this.investors.get(id);
  }

  async getInvestors(): Promise<Investor[]> {
    return Array.from(this.investors.values()).sort((a, b) =>
      a.nameEn.localeCompare(b.nameEn)
    );
  }

  async createInvestor(investor: InsertInvestor): Promise<Investor> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newInvestor: Investor = {
      id,
      investorCode: investor.investorCode,
      nameAr: investor.nameAr,
      nameEn: investor.nameEn,
      contactPerson: investor.contactPerson ?? null,
      email: investor.email ?? null,
      phone: investor.phone ?? null,
      companyRegistration: investor.companyRegistration ?? null,
      taxId: investor.taxId ?? null,
      address: investor.address ?? null,
      city: investor.city ?? null,
      country: investor.country ?? "Saudi Arabia",
      status: investor.status ?? "active",
      notes: investor.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.investors.set(id, newInvestor);
    return newInvestor;
  }

  async updateInvestor(id: string, updates: Partial<Investor>): Promise<Investor | undefined> {
    const investor = this.investors.get(id);
    if (!investor) return undefined;
    const updated: Investor = {
      ...investor,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.investors.set(id, updated);
    return updated;
  }

  // Contract Helper Methods
  private enrichContract(contract: Contract): ContractWithDetails {
    const asset = this.assets.get(contract.assetId);
    const investor = this.investors.get(contract.investorId);
    const installments = Array.from(this.installments.values())
      .filter((i) => i.contractId === contract.id)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);

    const today = new Date().toISOString().split("T")[0];
    const nextInstallment = installments.find(
      (i) => i.status === "pending" || i.status === "overdue"
    ) ?? null;

    let paymentStatus: InstallmentStatus = "pending";
    if (installments.length > 0) {
      const hasOverdue = installments.some((i) => i.status === "overdue");
      const hasPartial = installments.some((i) => i.status === "partial");
      const allPaid = installments.every((i) => i.status === "paid");
      if (hasOverdue) paymentStatus = "overdue";
      else if (hasPartial) paymentStatus = "partial";
      else if (allPaid) paymentStatus = "paid";
    }

    return {
      ...contract,
      asset,
      investor,
      installments,
      nextInstallment,
      paymentStatus,
    };
  }

  async getContract(id: string): Promise<ContractWithDetails | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    return this.enrichContract(contract);
  }

  async getContracts(filters: ContractFilters): Promise<{ contracts: ContractWithDetails[]; total: number; statusCounts: Record<ContractStatus, number> }> {
    let contracts = Array.from(this.contracts.values()).filter(
      (c) => c.status !== "draft"
    );

    // Calculate status counts before filtering
    const allContracts = Array.from(this.contracts.values());
    const statusCounts: Record<ContractStatus, number> = {
      draft: allContracts.filter((c) => c.status === "draft").length,
      incomplete: allContracts.filter((c) => c.status === "incomplete").length,
      active: allContracts.filter((c) => c.status === "active").length,
      expiring: allContracts.filter((c) => c.status === "expiring").length,
      expired: allContracts.filter((c) => c.status === "expired").length,
      archived: allContracts.filter((c) => c.status === "archived").length,
      cancelled: allContracts.filter((c) => c.status === "cancelled").length,
    };

    if (filters.search) {
      const search = filters.search.toLowerCase();
      contracts = contracts.filter(
        (c) =>
          c.contractCode.toLowerCase().includes(search) ||
          c.landCode.toLowerCase().includes(search) ||
          c.assetNameEn.toLowerCase().includes(search) ||
          c.assetNameAr.includes(search) ||
          c.investorNameEn.toLowerCase().includes(search) ||
          c.investorNameAr.includes(search)
      );
    }

    if (filters.status && filters.status !== "all") {
      contracts = contracts.filter((c) => c.status === filters.status);
    }

    if (filters.investorId) {
      contracts = contracts.filter((c) => c.investorId === filters.investorId);
    }

    if (filters.assetId) {
      contracts = contracts.filter((c) => c.assetId === filters.assetId);
    }

    if (filters.signingDateFrom) {
      contracts = contracts.filter((c) => c.signingDate >= filters.signingDateFrom!);
    }

    if (filters.signingDateTo) {
      contracts = contracts.filter((c) => c.signingDate <= filters.signingDateTo!);
    }

    if (filters.endDateFrom) {
      contracts = contracts.filter((c) => c.endDate >= filters.endDateFrom!);
    }

    if (filters.endDateTo) {
      contracts = contracts.filter((c) => c.endDate <= filters.endDateTo!);
    }

    // Sort
    const sortBy = filters.sortBy || "contractCode";
    const sortOrder = filters.sortOrder || "desc";
    contracts.sort((a, b) => {
      let aVal = (a as Record<string, unknown>)[sortBy];
      let bVal = (b as Record<string, unknown>)[sortBy];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

    const total = contracts.length;
    const start = (filters.page - 1) * filters.limit;
    const paginatedContracts = contracts.slice(start, start + filters.limit);

    return {
      contracts: paginatedContracts.map((c) => this.enrichContract(c)),
      total,
      statusCounts,
    };
  }

  async getDraftContracts(createdBy?: string): Promise<ContractWithDetails[]> {
    let drafts = Array.from(this.contracts.values()).filter(
      (c) => c.status === "draft"
    );
    if (createdBy) {
      drafts = drafts.filter((c) => c.createdBy === createdBy);
    }
    return drafts.map((c) => this.enrichContract(c));
  }

  async createContract(contract: InsertContract, createdBy: string): Promise<Contract> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const code = await this.generateContractCode();

    const vatMultiplier = 1 + contract.vatRate / 100;
    const totalAnnualAmount = contract.annualRentalAmount * vatMultiplier;
    const totalContractAmount = totalAnnualAmount * contract.contractDuration;

    const newContract: Contract = {
      id,
      contractCode: code,
      landCode: contract.landCode,
      assetId: contract.assetId,
      investorId: contract.investorId,
      assetNameAr: contract.assetNameAr,
      assetNameEn: contract.assetNameEn,
      investorNameAr: contract.investorNameAr,
      investorNameEn: contract.investorNameEn,
      annualRentalAmount: contract.annualRentalAmount,
      vatRate: contract.vatRate as 0 | 5 | 15,
      totalAnnualAmount,
      contractDuration: contract.contractDuration,
      totalContractAmount,
      currency: "SAR",
      signingDate: contract.signingDate,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: "draft",
      installmentPlanType: contract.installmentPlanType ?? null,
      installmentCount: contract.installmentCount ?? null,
      installmentFrequency: contract.installmentFrequency ?? null,
      signedPdfUrl: contract.signedPdfUrl ?? null,
      signedPdfUploadedAt: contract.signedPdfUrl ? now : null,
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      cancellationJustification: null,
      cancellationDocuments: [],
      notes: contract.notes ?? null,
      specialConditions: contract.specialConditions ?? null,
      legalTermsReference: contract.legalTermsReference ?? null,
      approvalAuthority: contract.approvalAuthority ?? null,
      createdBy,
      createdAt: now,
      updatedBy: null,
      updatedAt: now,
      archivedAt: null,
      archivedBy: null,
    };

    this.contracts.set(id, newContract);
    return newContract;
  }

  async updateContract(id: string, updates: UpdateContract, updatedBy: string): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    if (contract.status === "archived" || contract.status === "cancelled") return undefined;

    let totalAnnualAmount = contract.totalAnnualAmount;
    let totalContractAmount = contract.totalContractAmount;

    if (updates.annualRentalAmount !== undefined || updates.vatRate !== undefined || updates.contractDuration !== undefined) {
      const amount = updates.annualRentalAmount ?? contract.annualRentalAmount;
      const vat = updates.vatRate ?? contract.vatRate;
      const duration = updates.contractDuration ?? contract.contractDuration;
      const vatMultiplier = 1 + vat / 100;
      totalAnnualAmount = amount * vatMultiplier;
      totalContractAmount = totalAnnualAmount * duration;
    }

    const updated: Contract = {
      ...contract,
      ...updates,
      totalAnnualAmount,
      totalContractAmount,
      updatedBy,
      updatedAt: new Date().toISOString(),
    };

    this.contracts.set(id, updated);
    return updated;
  }

  async activateContract(id: string): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    if (contract.status !== "draft" && contract.status !== "incomplete") return undefined;

    // Check if has PDF and installment plan
    const installments = Array.from(this.installments.values()).filter(
      (i) => i.contractId === id
    );
    if (!contract.signedPdfUrl || installments.length === 0) {
      return undefined;
    }

    contract.status = "active";
    contract.updatedAt = new Date().toISOString();
    this.contracts.set(id, contract);
    return contract;
  }

  async archiveContract(id: string, archivedBy: string): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    if (contract.status !== "expired" && contract.status !== "active") return undefined;

    const now = new Date().toISOString();
    contract.status = "archived";
    contract.archivedAt = now;
    contract.archivedBy = archivedBy;
    contract.updatedAt = now;
    this.contracts.set(id, contract);
    return contract;
  }

  async unarchiveContract(id: string): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    if (contract.status !== "archived") return undefined;

    const now = new Date().toISOString();
    const endDate = new Date(contract.endDate);
    const today = new Date();

    if (endDate < today) {
      contract.status = "expired";
    } else {
      const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      contract.status = daysUntilEnd <= 90 ? "expiring" : "active";
    }

    contract.archivedAt = null;
    contract.archivedBy = null;
    contract.updatedAt = now;
    this.contracts.set(id, contract);
    return contract;
  }

  async cancelContract(id: string, cancelledBy: string, cancellation: CancelContract): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    if (contract.status !== "active" && contract.status !== "expiring") return undefined;

    const now = new Date().toISOString();
    contract.status = "cancelled";
    contract.cancelledAt = now;
    contract.cancelledBy = cancelledBy;
    contract.cancellationReason = cancellation.reason;
    contract.cancellationJustification = cancellation.justification;
    contract.cancellationDocuments = cancellation.documents ?? [];
    contract.updatedAt = now;
    this.contracts.set(id, contract);
    return contract;
  }

  async checkAssetHasActiveContract(assetId: string, excludeContractId?: string): Promise<boolean> {
    return Array.from(this.contracts.values()).some(
      (c) =>
        c.assetId === assetId &&
        (c.status === "active" || c.status === "expiring") &&
        c.id !== excludeContractId
    );
  }

  async generateContractCode(): Promise<string> {
    const year = new Date().getFullYear();
    const code = `CNT-${year}-${String(this.contractCodeCounter).padStart(4, "0")}`;
    this.contractCodeCounter++;
    return code;
  }

  async getContractDashboardStats(): Promise<ContractDashboardStats> {
    const contracts = Array.from(this.contracts.values());
    const installments = Array.from(this.installments.values());
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.substring(0, 7);

    const activeContracts = contracts.filter((c) => c.status === "active");
    const overdueInstallments = installments.filter((i) => i.status === "overdue");
    const paidThisMonth = installments.filter(
      (i) => i.status === "paid" && i.paymentDate?.startsWith(thisMonth)
    );

    return {
      totalContracts: contracts.length,
      activeContracts: activeContracts.length,
      expiringContracts: contracts.filter((c) => c.status === "expiring").length,
      incompleteContracts: contracts.filter((c) => c.status === "incomplete").length,
      cancelledContracts: contracts.filter((c) => c.status === "cancelled").length,
      archivedContracts: contracts.filter((c) => c.status === "archived").length,
      totalContractValue: activeContracts.reduce((sum, c) => sum + c.totalContractAmount, 0),
      overdueInstallments: overdueInstallments.length,
      overdueAmount: overdueInstallments.reduce((sum, i) => sum + i.amountDue, 0),
      paidThisMonth: paidThisMonth.length,
      paidAmountThisMonth: paidThisMonth.reduce((sum, i) => sum + i.amountDue, 0),
      pendingInstallments: installments.filter((i) => i.status === "pending").length,
      installmentsDueToday: installments.filter((i) => i.dueDate === today && i.status === "pending").length,
    };
  }

  // Installment Methods
  async getInstallment(id: string): Promise<Installment | undefined> {
    return this.installments.get(id);
  }

  async getInstallments(contractId: string, year?: number): Promise<Installment[]> {
    let installments = Array.from(this.installments.values())
      .filter((i) => i.contractId === contractId)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);

    if (year) {
      installments = installments.filter((i) => i.dueDate.startsWith(String(year)));
    }

    return installments;
  }

  async createInstallmentPlan(contractId: string, plan: InstallmentPlan, totalAmount: number, startDate: string): Promise<Installment[]> {
    // Delete existing installments
    await this.deleteInstallmentPlan(contractId);

    const installments: Installment[] = [];
    const now = new Date().toISOString();

    if (plan.type === "equal" && plan.count && plan.frequency) {
      const amountPerInstallment = totalAmount / plan.count;
      const start = new Date(startDate);

      for (let i = 0; i < plan.count; i++) {
        const dueDate = new Date(start);
        switch (plan.frequency) {
          case "monthly":
            dueDate.setMonth(dueDate.getMonth() + i);
            break;
          case "quarterly":
            dueDate.setMonth(dueDate.getMonth() + i * 3);
            break;
          case "semi_annual":
            dueDate.setMonth(dueDate.getMonth() + i * 6);
            break;
          case "annual":
            dueDate.setFullYear(dueDate.getFullYear() + i);
            break;
        }

        const id = randomUUID();
        const installment: Installment = {
          id,
          contractId,
          installmentNumber: i + 1,
          amountDue: Math.round(amountPerInstallment * 100) / 100,
          dueDate: dueDate.toISOString().split("T")[0],
          status: "pending",
          paymentDate: null,
          partialAmountPaid: null,
          remainingBalance: null,
          receiptFileUrl: null,
          receiptFileName: null,
          receiptUploadedAt: null,
          receiptUploadedBy: null,
          notes: null,
          description: null,
          createdAt: now,
          updatedAt: now,
          updatedBy: null,
        };
        this.installments.set(id, installment);
        installments.push(installment);
      }
    } else if (plan.type === "custom" && plan.customInstallments) {
      for (let i = 0; i < plan.customInstallments.length; i++) {
        const custom = plan.customInstallments[i];
        const id = randomUUID();
        const installment: Installment = {
          id,
          contractId,
          installmentNumber: i + 1,
          amountDue: custom.amount,
          dueDate: custom.dueDate,
          status: "pending",
          paymentDate: null,
          partialAmountPaid: null,
          remainingBalance: null,
          receiptFileUrl: null,
          receiptFileName: null,
          receiptUploadedAt: null,
          receiptUploadedBy: null,
          notes: null,
          description: custom.description ?? null,
          createdAt: now,
          updatedAt: now,
          updatedBy: null,
        };
        this.installments.set(id, installment);
        installments.push(installment);
      }
    }

    // Update contract with plan info
    const contract = this.contracts.get(contractId);
    if (contract) {
      contract.installmentPlanType = plan.type;
      contract.installmentCount = installments.length;
      contract.installmentFrequency = plan.frequency ?? null;
      contract.updatedAt = now;
      this.contracts.set(contractId, contract);
    }

    return installments;
  }

  async updateInstallmentStatus(id: string, status: UpdateInstallmentStatus, updatedBy: string): Promise<Installment | undefined> {
    const installment = this.installments.get(id);
    if (!installment) return undefined;

    const now = new Date().toISOString();

    // Validate: cannot mark as paid without receipt
    if (status.status === "paid" && !status.receiptFileUrl && !installment.receiptFileUrl) {
      return undefined;
    }

    installment.status = status.status;
    if (status.paymentDate) installment.paymentDate = status.paymentDate;
    if (status.partialAmountPaid !== undefined) {
      installment.partialAmountPaid = status.partialAmountPaid;
      installment.remainingBalance = installment.amountDue - (status.partialAmountPaid ?? 0);
    }
    if (status.receiptFileUrl) {
      installment.receiptFileUrl = status.receiptFileUrl;
      installment.receiptFileName = status.receiptFileName ?? null;
      installment.receiptUploadedAt = now;
      installment.receiptUploadedBy = updatedBy;
    }
    if (status.notes !== undefined) installment.notes = status.notes;
    installment.updatedAt = now;
    installment.updatedBy = updatedBy;

    this.installments.set(id, installment);
    return installment;
  }

  async deleteInstallmentPlan(contractId: string): Promise<void> {
    for (const [id, installment] of this.installments.entries()) {
      if (installment.contractId === contractId) {
        this.installments.delete(id);
      }
    }
  }

  async updateOverdueInstallments(): Promise<number> {
    const today = new Date().toISOString().split("T")[0];
    let count = 0;

    for (const installment of this.installments.values()) {
      if (installment.status === "pending" && installment.dueDate < today) {
        installment.status = "overdue";
        installment.updatedAt = new Date().toISOString();
        this.installments.set(installment.id, installment);
        count++;
      }
    }

    return count;
  }

  // =============================================================================
  // Investor Portal Methods (PostgreSQL)
  // =============================================================================

  private mapDbToInvestorAccount(row: typeof schema.investorAccounts.$inferSelect): InvestorAccount {
    return {
      id: row.id,
      ssoUserId: row.ssoUserId,
      investorId: row.investorId,
      accountType: row.accountType,
      fullNameAr: row.fullNameAr,
      fullNameEn: row.fullNameEn,
      nationalIdOrCr: row.nationalIdOrCr,
      email: row.email,
      phone: row.phone,
      companyName: row.companyName,
      contactPerson: row.contactPerson,
      verificationStatus: row.verificationStatus,
      status: row.status,
      registrationDate: row.registrationDate.toISOString(),
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      totalInterests: row.totalInterests,
      totalContracts: row.totalContracts,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getInvestorAccount(id: string): Promise<InvestorAccount | undefined> {
    const result = await db.select().from(schema.investorAccounts).where(eq(schema.investorAccounts.id, id)).limit(1);
    return result[0] ? this.mapDbToInvestorAccount(result[0]) : undefined;
  }

  async getInvestorAccountBySsoId(ssoUserId: string): Promise<InvestorAccount | undefined> {
    const result = await db.select().from(schema.investorAccounts).where(eq(schema.investorAccounts.ssoUserId, ssoUserId)).limit(1);
    return result[0] ? this.mapDbToInvestorAccount(result[0]) : undefined;
  }

  async getInvestorAccounts(filters: CrmInvestorFilters): Promise<{ accounts: InvestorAccount[]; total: number }> {
    const conditions: any[] = [];
    if (filters.search) {
      conditions.push(or(
        ilike(schema.investorAccounts.fullNameEn, `%${filters.search}%`),
        ilike(schema.investorAccounts.fullNameAr, `%${filters.search}%`),
        ilike(schema.investorAccounts.email, `%${filters.search}%`),
        ilike(schema.investorAccounts.nationalIdOrCr, `%${filters.search}%`)
      ));
    }
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(schema.investorAccounts.status, filters.status));
    }
    if (filters.accountType && filters.accountType !== "all") {
      conditions.push(eq(schema.investorAccounts.accountType, filters.accountType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult, rows] = await Promise.all([
      db.select({ count: count() }).from(schema.investorAccounts).where(whereClause),
      db.select().from(schema.investorAccounts).where(whereClause).orderBy(desc(schema.investorAccounts.createdAt))
        .limit(filters.limit ?? 25).offset(((filters.page ?? 1) - 1) * (filters.limit ?? 25))
    ]);

    return {
      accounts: rows.map(row => this.mapDbToInvestorAccount(row)),
      total: countResult[0]?.count ?? 0,
    };
  }

  async createInvestorAccount(account: InsertInvestorAccount): Promise<InvestorAccount> {
    const [result] = await db.insert(schema.investorAccounts).values({
      ssoUserId: account.ssoUserId,
      investorId: account.investorId ?? null,
      accountType: account.accountType,
      fullNameAr: account.fullNameAr,
      fullNameEn: account.fullNameEn,
      nationalIdOrCr: account.nationalIdOrCr,
      email: account.email,
      phone: account.phone ?? null,
      companyName: account.companyName ?? null,
      contactPerson: account.contactPerson ?? null,
      verificationStatus: account.verificationStatus ?? "pending",
      status: account.status ?? "active",
    }).returning();
    return this.mapDbToInvestorAccount(result);
  }

  async updateInvestorAccount(id: string, updates: Partial<InvestorAccount>): Promise<InvestorAccount | undefined> {
    const [result] = await db.update(schema.investorAccounts)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(schema.investorAccounts.id, id))
      .returning();
    return result ? this.mapDbToInvestorAccount(result) : undefined;
  }

  async blockInvestorAccount(id: string): Promise<InvestorAccount | undefined> {
    return this.updateInvestorAccount(id, { status: "blocked" });
  }

  // Portal Asset Methods (uses in-memory assets with visibleToInvestors filter)
  async getExposedAssets(filters: PortalAssetFilters): Promise<{ assets: AssetWithDetails[]; total: number }> {
    let assets = Array.from(this.assets.values())
      .filter(a => a.visibleToInvestors && a.status === "completed");

    if (filters.search) {
      const search = filters.search.toLowerCase();
      assets = assets.filter(a => 
        a.assetNameEn.toLowerCase().includes(search) || 
        a.assetNameAr.includes(search)
      );
    }
    if (filters.cityId) {
      assets = assets.filter(a => a.cityId === filters.cityId);
    }
    if (filters.districtId) {
      assets = assets.filter(a => a.districtId === filters.districtId);
    }
    if (filters.assetType && filters.assetType !== "all") {
      assets = assets.filter(a => a.assetType === filters.assetType);
    }
    if (filters.areaMin !== undefined) {
      assets = assets.filter(a => a.totalArea >= filters.areaMin!);
    }
    if (filters.areaMax !== undefined) {
      assets = assets.filter(a => a.totalArea <= filters.areaMax!);
    }

    switch (filters.sortBy) {
      case "name":
        assets.sort((a, b) => a.assetNameEn.localeCompare(b.assetNameEn));
        break;
      case "area_asc":
        assets.sort((a, b) => a.totalArea - b.totalArea);
        break;
      case "area_desc":
        assets.sort((a, b) => b.totalArea - a.totalArea);
        break;
      case "newest":
      default:
        assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = assets.length;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    assets = assets.slice((page - 1) * limit, page * limit);

    const assetsWithDetails = assets.map(asset => ({
      ...asset,
      region: this.regions.get(asset.regionId),
      city: this.cities.get(asset.cityId),
      district: this.districts.get(asset.districtId),
    }));

    return { assets: assetsWithDetails, total };
  }

  async getExposedAsset(id: string): Promise<AssetWithDetails | undefined> {
    const asset = this.assets.get(id);
    if (!asset || !asset.visibleToInvestors || asset.status !== "completed") {
      return undefined;
    }
    return {
      ...asset,
      region: this.regions.get(asset.regionId),
      city: this.cities.get(asset.cityId),
      district: this.districts.get(asset.districtId),
    };
  }

  // Favorites Methods
  async getFavorites(investorAccountId: string): Promise<InvestorFavoriteWithAsset[]> {
    const rows = await db.select().from(schema.investorFavorites)
      .where(eq(schema.investorFavorites.investorAccountId, investorAccountId))
      .orderBy(desc(schema.investorFavorites.createdAt));

    return rows.map(row => ({
      id: row.id,
      investorAccountId: row.investorAccountId,
      assetId: row.assetId,
      createdAt: row.createdAt.toISOString(),
      asset: this.assets.get(row.assetId) ? {
        ...this.assets.get(row.assetId)!,
        region: this.regions.get(this.assets.get(row.assetId)!.regionId),
        city: this.cities.get(this.assets.get(row.assetId)!.cityId),
        district: this.districts.get(this.assets.get(row.assetId)!.districtId),
      } : undefined,
    }));
  }

  async addFavorite(investorAccountId: string, assetId: string): Promise<InvestorFavorite> {
    const existing = await db.select().from(schema.investorFavorites)
      .where(and(
        eq(schema.investorFavorites.investorAccountId, investorAccountId),
        eq(schema.investorFavorites.assetId, assetId)
      )).limit(1);
    
    if (existing.length > 0) {
      return {
        id: existing[0].id,
        investorAccountId: existing[0].investorAccountId,
        assetId: existing[0].assetId,
        createdAt: existing[0].createdAt.toISOString(),
      };
    }

    const [result] = await db.insert(schema.investorFavorites).values({
      investorAccountId,
      assetId,
    }).returning();
    
    return {
      id: result.id,
      investorAccountId: result.investorAccountId,
      assetId: result.assetId,
      createdAt: result.createdAt.toISOString(),
    };
  }

  async removeFavorite(investorAccountId: string, assetId: string): Promise<boolean> {
    const result = await db.delete(schema.investorFavorites)
      .where(and(
        eq(schema.investorFavorites.investorAccountId, investorAccountId),
        eq(schema.investorFavorites.assetId, assetId)
      ));
    return true;
  }

  async isFavorited(investorAccountId: string, assetId: string): Promise<boolean> {
    const result = await db.select().from(schema.investorFavorites)
      .where(and(
        eq(schema.investorFavorites.investorAccountId, investorAccountId),
        eq(schema.investorFavorites.assetId, assetId)
      )).limit(1);
    return result.length > 0;
  }

  async getFavoriteCount(assetId: string): Promise<number> {
    const result = await db.select({ count: count() }).from(schema.investorFavorites)
      .where(eq(schema.investorFavorites.assetId, assetId));
    return result[0]?.count ?? 0;
  }

  async getMostFavoritedAssets(limit = 10): Promise<{ assetId: string; assetName: string; count: number }[]> {
    const result = await db.select({
      assetId: schema.investorFavorites.assetId,
      count: count(),
    }).from(schema.investorFavorites)
      .groupBy(schema.investorFavorites.assetId)
      .orderBy(desc(count()))
      .limit(limit);
    
    return result.map(row => {
      const asset = this.assets.get(row.assetId);
      return {
        assetId: row.assetId,
        assetName: asset?.assetNameEn ?? "Unknown",
        count: row.count,
      };
    });
  }

  // Investor Interest Methods
  private mapDbToInterest(row: typeof schema.investorInterests.$inferSelect): InvestorInterest {
    return {
      id: row.id,
      referenceNumber: row.referenceNumber,
      investorAccountId: row.investorAccountId,
      assetId: row.assetId,
      investmentPurpose: row.investmentPurpose,
      proposedUseDescription: row.proposedUseDescription,
      investmentAmountRange: row.investmentAmountRange,
      expectedTimeline: row.expectedTimeline,
      additionalComments: row.additionalComments,
      attachments: (row.attachments as string[]) ?? [],
      status: row.status,
      assignedToId: row.assignedToId,
      reviewNotes: row.reviewNotes,
      rejectionReason: row.rejectionReason,
      convertedContractId: row.convertedContractId,
      submittedAt: row.submittedAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewedBy: row.reviewedBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getInvestorInterest(id: string): Promise<InvestorInterestWithDetails | undefined> {
    const [row] = await db.select().from(schema.investorInterests)
      .where(eq(schema.investorInterests.id, id)).limit(1);
    if (!row) return undefined;

    const interest = this.mapDbToInterest(row);
    const account = await this.getInvestorAccount(interest.investorAccountId);
    const asset = await this.getExposedAsset(interest.assetId);

    return {
      ...interest,
      investorAccount: account,
      asset,
    };
  }

  async getInvestorInterests(filters: InterestFilters): Promise<{ interests: InvestorInterestWithDetails[]; total: number }> {
    const conditions: any[] = [];
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(schema.investorInterests.status, filters.status));
    }
    if (filters.investorAccountId) {
      conditions.push(eq(schema.investorInterests.investorAccountId, filters.investorAccountId));
    }
    if (filters.assetId) {
      conditions.push(eq(schema.investorInterests.assetId, filters.assetId));
    }
    if (filters.assignedToId) {
      conditions.push(eq(schema.investorInterests.assignedToId, filters.assignedToId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      db.select({ count: count() }).from(schema.investorInterests).where(whereClause),
      db.select().from(schema.investorInterests).where(whereClause)
        .orderBy(desc(schema.investorInterests.submittedAt))
        .limit(filters.limit ?? 25).offset(((filters.page ?? 1) - 1) * (filters.limit ?? 25))
    ]);

    const interests = await Promise.all(rows.map(async row => {
      const interest = this.mapDbToInterest(row);
      const account = await this.getInvestorAccount(interest.investorAccountId);
      const asset = await this.getAsset(interest.assetId);
      return { ...interest, investorAccount: account, asset };
    }));

    return { interests, total: countResult[0]?.count ?? 0 };
  }

  async getMyInterests(investorAccountId: string): Promise<InvestorInterestWithDetails[]> {
    const rows = await db.select().from(schema.investorInterests)
      .where(eq(schema.investorInterests.investorAccountId, investorAccountId))
      .orderBy(desc(schema.investorInterests.submittedAt));

    return Promise.all(rows.map(async row => {
      const interest = this.mapDbToInterest(row);
      const asset = await this.getAsset(interest.assetId);
      return { ...interest, asset };
    }));
  }

  async createInvestorInterest(interest: InsertInvestorInterest, investorAccountId: string): Promise<InvestorInterest> {
    const refNumber = await this.generateInterestRefNumber();
    const [result] = await db.insert(schema.investorInterests).values({
      referenceNumber: refNumber,
      investorAccountId,
      assetId: interest.assetId,
      investmentPurpose: interest.investmentPurpose,
      proposedUseDescription: interest.proposedUseDescription,
      investmentAmountRange: interest.investmentAmountRange,
      expectedTimeline: interest.expectedTimeline,
      additionalComments: interest.additionalComments ?? null,
      attachments: interest.attachments ?? [],
    }).returning();

    await db.update(schema.investorAccounts)
      .set({ totalInterests: sql`total_interests + 1`, updatedAt: new Date() })
      .where(eq(schema.investorAccounts.id, investorAccountId));

    return this.mapDbToInterest(result);
  }

  async processInterestReview(id: string, reviewerId: string, action: InterestReviewAction): Promise<InvestorInterest | undefined> {
    let newStatus: "new" | "under_review" | "approved" | "rejected" | "converted" = "under_review";
    if (action.action === "approve") newStatus = "approved";
    else if (action.action === "reject") newStatus = "rejected";
    else if (action.action === "convert") newStatus = "converted";

    const [result] = await db.update(schema.investorInterests)
      .set({
        status: newStatus,
        reviewNotes: action.reviewNotes ?? null,
        rejectionReason: action.action === "reject" ? action.rejectionReason : null,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        updatedAt: new Date(),
      })
      .where(eq(schema.investorInterests.id, id))
      .returning();

    return result ? this.mapDbToInterest(result) : undefined;
  }

  async generateInterestRefNumber(): Promise<string> {
    this.interestRefCounter++;
    const year = new Date().getFullYear();
    return `INT-${year}-${String(this.interestRefCounter).padStart(4, "0")}`;
  }

  // Istifada Request Methods
  private mapDbToIstifada(row: typeof schema.istifadaRequests.$inferSelect): IstifadaRequest {
    return {
      id: row.id,
      referenceNumber: row.referenceNumber,
      investorAccountId: row.investorAccountId,
      assetId: row.assetId,
      programType: row.programType,
      programTitle: row.programTitle,
      programDescription: row.programDescription,
      targetBeneficiaries: row.targetBeneficiaries,
      startDate: row.startDate,
      endDate: row.endDate,
      budgetEstimate: row.budgetEstimate,
      proposalDocuments: (row.proposalDocuments as string[]) ?? [],
      financialPlanDocuments: (row.financialPlanDocuments as string[]) ?? [],
      organizationCredentials: (row.organizationCredentials as string[]) ?? [],
      additionalDocuments: (row.additionalDocuments as string[]) ?? [],
      status: row.status,
      assignedToId: row.assignedToId,
      reviewNotes: row.reviewNotes,
      rejectionReason: row.rejectionReason,
      additionalInfoRequest: row.additionalInfoRequest,
      submittedAt: row.submittedAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewedBy: row.reviewedBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getIstifadaRequest(id: string): Promise<IstifadaRequestWithDetails | undefined> {
    const [row] = await db.select().from(schema.istifadaRequests)
      .where(eq(schema.istifadaRequests.id, id)).limit(1);
    if (!row) return undefined;

    const request = this.mapDbToIstifada(row);
    const account = await this.getInvestorAccount(request.investorAccountId);
    const asset = request.assetId ? await this.getAsset(request.assetId) : undefined;

    return { ...request, investorAccount: account, asset };
  }

  async getIstifadaRequests(filters: IstifadaFilters): Promise<{ requests: IstifadaRequestWithDetails[]; total: number }> {
    const conditions: any[] = [];
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(schema.istifadaRequests.status, filters.status));
    }
    if (filters.programType && filters.programType !== "all") {
      conditions.push(eq(schema.istifadaRequests.programType, filters.programType));
    }
    if (filters.investorAccountId) {
      conditions.push(eq(schema.istifadaRequests.investorAccountId, filters.investorAccountId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      db.select({ count: count() }).from(schema.istifadaRequests).where(whereClause),
      db.select().from(schema.istifadaRequests).where(whereClause)
        .orderBy(desc(schema.istifadaRequests.submittedAt))
        .limit(filters.limit ?? 25).offset(((filters.page ?? 1) - 1) * (filters.limit ?? 25))
    ]);

    const requests = await Promise.all(rows.map(async row => {
      const request = this.mapDbToIstifada(row);
      const account = await this.getInvestorAccount(request.investorAccountId);
      const asset = request.assetId ? await this.getAsset(request.assetId) : undefined;
      return { ...request, investorAccount: account, asset };
    }));

    return { requests, total: countResult[0]?.count ?? 0 };
  }

  async getMyIstifadaRequests(investorAccountId: string): Promise<IstifadaRequestWithDetails[]> {
    const rows = await db.select().from(schema.istifadaRequests)
      .where(eq(schema.istifadaRequests.investorAccountId, investorAccountId))
      .orderBy(desc(schema.istifadaRequests.submittedAt));

    return Promise.all(rows.map(async row => {
      const request = this.mapDbToIstifada(row);
      const asset = request.assetId ? await this.getAsset(request.assetId) : undefined;
      return { ...request, asset };
    }));
  }

  async createIstifadaRequest(request: InsertIstifadaRequest, investorAccountId: string): Promise<IstifadaRequest> {
    const refNumber = await this.generateIstifadaRefNumber();
    const [result] = await db.insert(schema.istifadaRequests).values({
      referenceNumber: refNumber,
      investorAccountId,
      assetId: request.assetId ?? null,
      programType: request.programType,
      programTitle: request.programTitle,
      programDescription: request.programDescription,
      targetBeneficiaries: request.targetBeneficiaries ?? null,
      startDate: request.startDate,
      endDate: request.endDate,
      budgetEstimate: request.budgetEstimate ?? null,
      proposalDocuments: request.proposalDocuments ?? [],
      financialPlanDocuments: request.financialPlanDocuments ?? [],
      organizationCredentials: request.organizationCredentials ?? [],
      additionalDocuments: request.additionalDocuments ?? [],
    }).returning();

    return this.mapDbToIstifada(result);
  }

  async processIstifadaReview(id: string, reviewerId: string, action: IstifadaReviewAction): Promise<IstifadaRequest | undefined> {
    let newStatus: "new" | "under_review" | "additional_info_requested" | "approved" | "rejected" | "completed" = "under_review";
    if (action.action === "approve") newStatus = "approved";
    else if (action.action === "reject") newStatus = "rejected";
    else if (action.action === "request_info") newStatus = "additional_info_requested";
    else if (action.action === "complete") newStatus = "completed";

    const [result] = await db.update(schema.istifadaRequests)
      .set({
        status: newStatus,
        reviewNotes: action.reviewNotes ?? null,
        rejectionReason: action.action === "reject" ? action.rejectionReason : null,
        additionalInfoRequest: action.action === "request_info" ? action.additionalInfoRequest : null,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        updatedAt: new Date(),
      })
      .where(eq(schema.istifadaRequests.id, id))
      .returning();

    return result ? this.mapDbToIstifada(result) : undefined;
  }

  async generateIstifadaRefNumber(): Promise<string> {
    this.istifadaRefCounter++;
    const year = new Date().getFullYear();
    return `IST-${year}-${String(this.istifadaRefCounter).padStart(4, "0")}`;
  }

  // CRM Notes
  async getInvestorNotes(investorAccountId: string): Promise<InvestorNoteWithUser[]> {
    const rows = await db.select().from(schema.investorNotes)
      .where(eq(schema.investorNotes.investorAccountId, investorAccountId))
      .orderBy(desc(schema.investorNotes.createdAt));

    return Promise.all(rows.map(async row => {
      const user = await this.getUser(row.createdBy);
      return {
        id: row.id,
        investorAccountId: row.investorAccountId,
        noteType: row.noteType,
        content: row.content,
        createdBy: row.createdBy,
        createdAt: row.createdAt.toISOString(),
        createdByUser: user,
      };
    }));
  }

  async createInvestorNote(investorAccountId: string, noteType: string, content: string, createdBy: string): Promise<InvestorNote> {
    const [result] = await db.insert(schema.investorNotes).values({
      investorAccountId,
      noteType,
      content,
      createdBy,
    }).returning();

    return {
      id: result.id,
      investorAccountId: result.investorAccountId,
      noteType: result.noteType,
      content: result.content,
      createdBy: result.createdBy,
      createdAt: result.createdAt.toISOString(),
    };
  }

  // Portal/CRM Dashboard Stats
  async getPortalDashboardStats(investorAccountId: string): Promise<PortalDashboardStats> {
    const exposedAssets = Array.from(this.assets.values())
      .filter(a => a.visibleToInvestors && a.status === "completed").length;
    
    const [favoritesResult] = await db.select({ count: count() }).from(schema.investorFavorites)
      .where(eq(schema.investorFavorites.investorAccountId, investorAccountId));
    
    const [interestsResult] = await db.select({ count: count() }).from(schema.investorInterests)
      .where(eq(schema.investorInterests.investorAccountId, investorAccountId));
    
    const [requestsResult] = await db.select({ count: count() }).from(schema.istifadaRequests)
      .where(eq(schema.istifadaRequests.investorAccountId, investorAccountId));

    const [pendingResult] = await db.select({ count: count() }).from(schema.investorInterests)
      .where(and(
        eq(schema.investorInterests.investorAccountId, investorAccountId),
        or(
          eq(schema.investorInterests.status, "new"),
          eq(schema.investorInterests.status, "under_review")
        )
      ));

    return {
      exposedAssets,
      totalFavorites: favoritesResult?.count ?? 0,
      myInterests: interestsResult?.count ?? 0,
      myRequests: requestsResult?.count ?? 0,
      pendingActions: pendingResult?.count ?? 0,
    };
  }

  async getCrmDashboardStats(): Promise<CrmDashboardStats> {
    const [totalAccounts] = await db.select({ count: count() }).from(schema.investorAccounts);
    const [activeAccounts] = await db.select({ count: count() }).from(schema.investorAccounts)
      .where(eq(schema.investorAccounts.status, "active"));
    const [blockedAccounts] = await db.select({ count: count() }).from(schema.investorAccounts)
      .where(eq(schema.investorAccounts.status, "blocked"));

    const [totalInterests] = await db.select({ count: count() }).from(schema.investorInterests);
    const [newInterests] = await db.select({ count: count() }).from(schema.investorInterests)
      .where(eq(schema.investorInterests.status, "new"));
    const [underReviewInterests] = await db.select({ count: count() }).from(schema.investorInterests)
      .where(eq(schema.investorInterests.status, "under_review"));
    const [approvedInterests] = await db.select({ count: count() }).from(schema.investorInterests)
      .where(eq(schema.investorInterests.status, "approved"));
    const [convertedInterests] = await db.select({ count: count() }).from(schema.investorInterests)
      .where(eq(schema.investorInterests.status, "converted"));

    const [totalIstifada] = await db.select({ count: count() }).from(schema.istifadaRequests);
    const [pendingIstifada] = await db.select({ count: count() }).from(schema.istifadaRequests)
      .where(or(
        eq(schema.istifadaRequests.status, "new"),
        eq(schema.istifadaRequests.status, "under_review")
      ));

    const mostFavorited = await this.getMostFavoritedAssets(10);

    const purposeCounts = await db.select({
      purpose: schema.investorInterests.investmentPurpose,
      count: count(),
    }).from(schema.investorInterests)
      .groupBy(schema.investorInterests.investmentPurpose);

    const total = totalInterests?.count ?? 0;
    const converted = convertedInterests?.count ?? 0;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      totalInvestorAccounts: totalAccounts?.count ?? 0,
      activeInvestors: activeAccounts?.count ?? 0,
      blockedInvestors: blockedAccounts?.count ?? 0,
      totalInterests: total,
      newInterests: newInterests?.count ?? 0,
      underReviewInterests: underReviewInterests?.count ?? 0,
      approvedInterests: approvedInterests?.count ?? 0,
      convertedInterests: converted,
      totalIstifadaRequests: totalIstifada?.count ?? 0,
      pendingIstifadaRequests: pendingIstifada?.count ?? 0,
      mostFavoritedAssets: mostFavorited,
      interestsByPurpose: purposeCounts.map(p => ({ purpose: p.purpose, count: p.count })),
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  // Initialize demo investor account for portal testing
  async initDemoInvestorAccount(): Promise<void> {
    const demoId = "demo-investor-001";
    try {
      const existing = await db.select().from(schema.investorAccounts)
        .where(eq(schema.investorAccounts.id, demoId)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(schema.investorAccounts).values({
          id: demoId,
          ssoUserId: "demo-sso-user-001",
          investorId: "INV-2024-0001",
          accountType: "individual",
          fullNameAr: "مستثمر تجريبي",
          fullNameEn: "Demo Investor",
          nationalIdOrCr: "1234567890",
          email: "demo@investor.example.com",
          phone: "+966501234567",
          verificationStatus: "verified",
          status: "active",
        });
        console.log("Demo investor account created successfully");
      }
    } catch (error) {
      // Account may already exist, ignore
      console.log("Demo investor account initialization skipped (may already exist)");
    }
  }
}

export const storage = new MemStorage();

// Initialize demo data on startup
storage.initDemoInvestorAccount().catch(console.error);
