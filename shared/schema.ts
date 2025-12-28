import { z } from "zod";

export const userStatusEnum = ["active", "inactive", "pending"] as const;
export type UserStatus = (typeof userStatusEnum)[number];

export const accessLevelEnum = ["viewer", "editor", "approver", "full_access"] as const;
export type AccessLevel = (typeof accessLevelEnum)[number];

export const permissionGroups = [
  "new_asset_management",
  "new_asset_reviewing",
  "isnad_management",
  "isnad_reviewing",
  "tbc_final_approval_management",
  "tbc_final_approval_reviewing",
  "admin_role_management",
  "admin_user_management",
] as const;
export type PermissionGroup = (typeof permissionGroups)[number];

export const permissionGroupLabels: Record<PermissionGroup, string> = {
  new_asset_management: "New Asset: Management",
  new_asset_reviewing: "New Asset: Reviewing",
  isnad_management: "ISNAD: Management",
  isnad_reviewing: "ISNAD: Reviewing",
  tbc_final_approval_management: "TBC Final Approval: Management",
  tbc_final_approval_reviewing: "TBC Final Approval: Reviewing",
  admin_role_management: "Admin: Role Management",
  admin_user_management: "Admin: User Management",
};

export const accessLevelLabels: Record<AccessLevel, string> = {
  viewer: "Viewer",
  editor: "Editor",
  approver: "Approver",
  full_access: "Full Access",
};

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: string;
  createdAt: string;
}

export interface WorkUnit {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  processGroup: PermissionGroup;
  permissionArea: string;
  code: string;
  description: string;
  requiresSpecialPermission: boolean;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  accessLevel: AccessLevel;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: RolePermission[];
}

export interface UserCustomPermission {
  id: string;
  userId: string;
  permissionId: string;
  accessLevel: AccessLevel;
  grantedBy: string;
  grantedAt: string;
}

export interface User {
  id: string;
  email: string;
  organizationId: string;
  workUnitId: string;
  roleId: string | null;
  hasCustomPermissions: boolean;
  status: UserStatus;
  invitationToken: string | null;
  invitationExpiresAt: string | null;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  customPermissions?: UserCustomPermission[];
}

export interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  sessionId: string | null;
  createdAt: string;
}

export const insertUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  organizationId: z.string().min(1, "Organization is required"),
  workUnitId: z.string().min(1, "Work unit is required"),
  roleId: z.string().nullable(),
  hasCustomPermissions: z.boolean().default(false),
  status: z.enum(userStatusEnum).default("active"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().optional(),
  isSystemRole: z.boolean().default(false),
});

export type InsertRole = z.infer<typeof insertRoleSchema>;

export const insertOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  code: z.string().min(1, "Organization code is required"),
  type: z.string().optional(),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export const insertWorkUnitSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  name: z.string().min(1, "Work unit name is required"),
  code: z.string().optional(),
});

export type InsertWorkUnit = z.infer<typeof insertWorkUnitSchema>;

export const assignPermissionSchema = z.object({
  permissionId: z.string().min(1),
  accessLevel: z.enum(accessLevelEnum),
});

export type AssignPermission = z.infer<typeof assignPermissionSchema>;

export const userFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...userStatusEnum, "all"]).optional(),
  organizationId: z.string().optional(),
  roleId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
});

export type UserFilters = z.infer<typeof userFiltersSchema>;

export interface UserWithDetails extends User {
  organization?: Organization;
  workUnit?: WorkUnit;
  role?: Role;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalRoles: number;
  recentActivity: AuditLog[];
}
