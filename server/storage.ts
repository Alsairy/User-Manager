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
} from "@shared/schema";
import { permissionGroups, permissionGroupLabels } from "@shared/schema";

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

  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.organizations = new Map();
    this.workUnits = new Map();
    this.auditLogs = new Map();
    this.userCustomPermissions = new Map();
    this.rolePermissions = new Map();

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
}

export const storage = new MemStorage();
