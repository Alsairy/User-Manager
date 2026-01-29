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

export const assetTypeEnum = ["land", "building"] as const;
export type AssetType = (typeof assetTypeEnum)[number];

export const assetStatusEnum = ["draft", "in_review", "completed", "rejected", "incomplete_bulk"] as const;
export type AssetStatus = (typeof assetStatusEnum)[number];

export const registrationModeEnum = ["direct", "approval_cycle"] as const;
export type RegistrationMode = (typeof registrationModeEnum)[number];

export const workflowStageEnum = [
  "school_planning",
  "facilities_security",
  "investment_partnerships",
  "investment_agency",
  "tbc_approver",
] as const;
export type WorkflowStage = (typeof workflowStageEnum)[number];

export const workflowStageLabels: Record<WorkflowStage, string> = {
  school_planning: "School Planning",
  facilities_security: "Facilities & Security",
  investment_partnerships: "Investment & Partnerships (I&P)",
  investment_agency: "Investment Agency (MOE)",
  tbc_approver: "TBC Asset Approver",
};

export const landUseTypeEnum = [
  "residential",
  "commercial",
  "mixed_use",
  "educational",
  "industrial",
  "vacant_land",
  "other",
] as const;
export type LandUseType = (typeof landUseTypeEnum)[number];

export const ownershipTypeEnum = ["moe_owned", "leased", "under_custodianship", "other"] as const;
export type OwnershipType = (typeof ownershipTypeEnum)[number];

export const currentStatusEnum = ["available", "occupied", "under_development", "reserved"] as const;
export type CurrentStatus = (typeof currentStatusEnum)[number];

export const predefinedFeatures = [
  "utilities_water",
  "utilities_electricity",
  "utilities_sewage",
  "road_access",
  "fenced_secured",
  "building_permit",
  "cleared_title",
  "no_encumbrances",
] as const;
export type PredefinedFeature = (typeof predefinedFeatures)[number];

export const featureLabels: Record<PredefinedFeature, string> = {
  utilities_water: "Water Connected",
  utilities_electricity: "Electricity Connected",
  utilities_sewage: "Sewage Connected",
  road_access: "Road Access",
  fenced_secured: "Fenced/Secured",
  building_permit: "Building Permit Available",
  cleared_title: "Cleared Title",
  no_encumbrances: "No Encumbrances",
};

export interface Region {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

export interface City {
  id: string;
  regionId: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

export interface District {
  id: string;
  cityId: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

export interface AssetVerifier {
  department: WorkflowStage;
  userId: string;
  userName: string;
  date: string;
}

export interface Asset {
  id: string;
  assetCode: string;
  assetNameAr: string;
  assetNameEn: string;
  assetType: AssetType;
  regionId: string;
  cityId: string;
  districtId: string;
  neighborhood: string | null;
  streetAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  locationValidated: boolean;
  nearbyAssetsJustification: string | null;
  totalArea: number;
  builtUpArea: number | null;
  landUseType: LandUseType | null;
  zoningClassification: string | null;
  currentStatus: CurrentStatus | null;
  ownershipType: OwnershipType | null;
  deedNumber: string | null;
  deedDate: string | null;
  ownershipDocuments: string[];
  features: string[];
  customFeatures: string | null;
  financialDues: number | null;
  custodyDetails: string | null;
  administrativeNotes: string | null;
  relatedReferences: string | null;
  description: string | null;
  specialConditions: string | null;
  investmentPotential: string | null;
  restrictions: string | null;
  attachments: string[];
  status: AssetStatus;
  registrationMode: RegistrationMode | null;
  currentStage: WorkflowStage | null;
  verifiedBy: AssetVerifier[];
  rejectionReason: string | null;
  rejectionJustification: string | null;
  visibleToInvestors: boolean;
  visibilityCount: number;
  totalExposureDays: number;
  hasActiveIsnad: boolean;
  hasActiveContract: boolean;
  createdBy: string;
  createdAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface AssetWithDetails extends Asset {
  region?: Region;
  city?: City;
  district?: District;
  createdByUser?: User;
}

export const workflowActionEnum = ["submitted", "approved", "rejected"] as const;
export type WorkflowAction = (typeof workflowActionEnum)[number];

export interface AssetWorkflowHistory {
  id: string;
  assetId: string;
  stage: WorkflowStage;
  action: WorkflowAction;
  reviewerId: string | null;
  reviewerDepartment: string | null;
  comments: string | null;
  rejectionReason: string | null;
  rejectionJustification: string | null;
  documentsAdded: string[];
  actionDate: string;
  createdAt: string;
}

export const visibilityStatusEnum = ["visible", "hidden"] as const;
export type VisibilityStatus = (typeof visibilityStatusEnum)[number];

export interface AssetVisibilityHistory {
  id: string;
  assetId: string;
  visibilityStatus: VisibilityStatus;
  startDate: string;
  endDate: string | null;
  durationDays: number | null;
  changedBy: string;
  reason: string | null;
  createdAt: string;
}

export interface AssetComment {
  id: string;
  assetId: string;
  section: string;
  commentText: string;
  commenterId: string;
  commenterDepartment: string | null;
  workflowStage: WorkflowStage | null;
  attachments: string[];
  createdAt: string;
}

export const assetSectionEnum = [
  "basic_information",
  "location_coordinates",
  "property_details",
  "ownership_documentation",
  "features_amenities",
  "financial_administrative",
  "additional_information",
  "attachments",
] as const;
export type AssetSection = (typeof assetSectionEnum)[number];

export const assetSectionLabels: Record<AssetSection, string> = {
  basic_information: "Basic Information",
  location_coordinates: "Location & Coordinates",
  property_details: "Property Details",
  ownership_documentation: "Ownership & Documentation",
  features_amenities: "Features & Amenities",
  financial_administrative: "Financial & Administrative",
  additional_information: "Additional Information",
  attachments: "Attachments",
};

export const insertAssetSchema = z.object({
  assetNameAr: z.string().nullable().optional(),
  assetNameEn: z.string().min(1, "English name is required"),
  assetType: z.enum(assetTypeEnum),
  regionId: z.string().min(1, "Region is required"),
  cityId: z.string().min(1, "City is required"),
  districtId: z.string().min(1, "District is required"),
  neighborhood: z.string().nullable().optional(),
  streetAddress: z.string().nullable().optional(),
  latitude: z.number().min(16).max(32).nullable().optional(),
  longitude: z.number().min(34).max(56).nullable().optional(),
  totalArea: z.number().positive("Total area must be positive"),
  builtUpArea: z.number().positive().nullable().optional(),
  landUseType: z.enum(landUseTypeEnum).nullable().optional(),
  zoningClassification: z.string().nullable().optional(),
  currentStatus: z.enum(currentStatusEnum).nullable().optional(),
  ownershipType: z.enum(ownershipTypeEnum).nullable().optional(),
  deedNumber: z.string().nullable().optional(),
  deedDate: z.string().nullable().optional(),
  features: z.array(z.string()).default([]),
  customFeatures: z.string().nullable().optional(),
  financialDues: z.number().nullable().optional(),
  custodyDetails: z.string().nullable().optional(),
  administrativeNotes: z.string().nullable().optional(),
  relatedReferences: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  specialConditions: z.string().nullable().optional(),
  investmentPotential: z.string().nullable().optional(),
  restrictions: z.string().nullable().optional(),
  registrationMode: z.enum(registrationModeEnum).nullable().optional(),
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;

export const assetFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...assetStatusEnum, "all"]).optional(),
  assetType: z.enum([...assetTypeEnum, "all"]).optional(),
  regionId: z.string().optional(),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  createdBy: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(25),
});

export type AssetFilters = z.infer<typeof assetFiltersSchema>;

export const assetBankFiltersSchema = z.object({
  search: z.string().optional(),
  assetType: z.enum([...assetTypeEnum, "all"]).optional(),
  regionId: z.string().optional(),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  ownershipType: z.enum([...ownershipTypeEnum, "all"]).optional(),
  visibilityStatus: z.enum(["visible", "hidden", "all"]).optional(),
  areaMin: z.number().optional(),
  areaMax: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(25),
});

export type AssetBankFilters = z.infer<typeof assetBankFiltersSchema>;

export const reviewActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comments: z.string().optional(),
  rejectionReason: z.string().optional(),
  rejectionJustification: z.string().min(100, "Justification must be at least 100 characters").optional(),
});

export type ReviewAction = z.infer<typeof reviewActionSchema>;

export const toggleVisibilitySchema = z.object({
  visible: z.boolean(),
  reason: z.string().optional(),
});

export type ToggleVisibility = z.infer<typeof toggleVisibilitySchema>;

export interface AssetDashboardStats {
  totalAssets: number;
  draftAssets: number;
  inReviewAssets: number;
  completedAssets: number;
  rejectedAssets: number;
  visibleToInvestors: number;
  byAssetType: { land: number; building: number };
  recentRegistrations: Asset[];
}

export interface ReviewQueueItem {
  asset: AssetWithDetails;
  daysPending: number;
  slaStatus: "on_time" | "warning" | "urgent" | "overdue";
  submittedDate: string;
}

// =============================================================================
// ISNAD Workflow System Types & Schemas
// =============================================================================

export const isnadStatusEnum = [
  "draft",
  "pending_verification",
  "verification_due",
  "changes_requested",
  "verified_filled",
  "investment_agency_review",
  "in_package",
  "pending_ceo",
  "pending_minister",
  "approved",
  "rejected",
  "cancelled",
] as const;
export type IsnadStatus = (typeof isnadStatusEnum)[number];

export const isnadStatusLabels: Record<IsnadStatus, string> = {
  draft: "Draft",
  pending_verification: "Pending Verification",
  verification_due: "Verification Due",
  changes_requested: "Changes Requested",
  verified_filled: "Verified and Filled",
  investment_agency_review: "Investment Agency Review",
  in_package: "In Executive Package",
  pending_ceo: "Pending CEO of TBC Approval",
  pending_minister: "Pending Associate Minister Approval",
  approved: "Approved for Investment",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const isnadStageEnum = [
  "ip_initiation",
  "school_planning_review",
  "ip_secondary_review",
  "finance_review",
  "security_facilities_review",
  "ip_third_review",
  "head_of_education_review",
  "investment_agency_review",
  "tbc_final_approval",
] as const;
export type IsnadStage = (typeof isnadStageEnum)[number];

export const isnadStageLabels: Record<IsnadStage, string> = {
  ip_initiation: "I&P Initiation",
  school_planning_review: "School Planning Review",
  ip_secondary_review: "I&P Secondary Review",
  finance_review: "Finance Review",
  security_facilities_review: "Security, Safety & Facilities Review",
  ip_third_review: "I&P Third Review",
  head_of_education_review: "Head of Education Review",
  investment_agency_review: "Investment Agency Review",
  tbc_final_approval: "TBC Final Approval",
};

export const workflowStepsOrder: IsnadStage[] = [
  "ip_initiation",
  "school_planning_review",
  "ip_secondary_review",
  "finance_review",
  "security_facilities_review",
  "ip_third_review",
  "head_of_education_review",
  "investment_agency_review",
  "tbc_final_approval",
];

export interface WorkflowStep {
  stage: IsnadStage;
  stepIndex: number;
  status: "pending" | "current" | "approved" | "rejected" | "skipped";
  reviewerId: string | null;
  reviewerName: string | null;
  actionTakenAt: string | null;
  comments: string | null;
  rejectionReason: string | null;
  slaDeadline: string | null;
  slaStatus: SlaStatus | null;
}

export const isnadActionEnum = [
  "created",
  "submitted",
  "approved",
  "rejected",
  "modification_requested",
  "request_info",
  "info_provided",
  "cancelled",
  "packaged",
] as const;
export type IsnadAction = (typeof isnadActionEnum)[number];

export const isnadActionLabels: Record<IsnadAction, string> = {
  created: "Created",
  submitted: "Submitted for Review",
  approved: "Approved",
  rejected: "Rejected",
  modification_requested: "Modification Requested",
  request_info: "Additional Info Requested",
  info_provided: "Information Provided",
  cancelled: "Cancelled",
  packaged: "Added to Package",
};

export const slaStatusEnum = ["on_time", "warning", "urgent", "overdue"] as const;
export type SlaStatus = (typeof slaStatusEnum)[number];

export const slaDaysConfig: Record<IsnadStage, number> = {
  ip_initiation: 2,
  school_planning_review: 5,
  ip_secondary_review: 3,
  finance_review: 5,
  security_facilities_review: 5,
  ip_third_review: 3,
  head_of_education_review: 5,
  investment_agency_review: 5,
  tbc_final_approval: 3,
};

export interface InvestmentCriteria {
  investmentPurpose: string;
  revenueProjection: string;
  projectTimeline: string;
  requiredModifications: string;
  complianceRequirements: string;
  riskAssessment: string;
}

export interface TechnicalAssessment {
  structuralCondition: string;
  utilitiesAvailability: string;
  accessInfrastructure: string;
  environmentalConsiderations: string;
  zoningCompliance: string;
}

export interface FinancialAnalysis {
  currentValuation: number;
  outstandingDues: number;
  maintenanceCosts: number;
  expectedReturns: number;
  breakEvenAnalysis: string;
}

// =============================================================================
// ISNAD Form Sections - Based on ISNAD_Form_1.pdf
// Each department fills their specific section during workflow
// =============================================================================

// Section 1-2: School Planning Department
export interface SchoolPlanningSection {
  assetStatus: "vacant_land" | "existing_building" | "vacated_building" | "stalled_project" | "other";
  assetStatusOther?: string;
  buildingName?: string;
  decisionNumber?: string;
  decisionDate?: string;
  planningNeed: "no_need" | "has_need";
  needExpectedPeriod?: string;
  hasProgrammingForm: boolean;
  programmingFormDate?: string;
  completedAt?: string;
  completedBy?: string;
}

// Section 3-5: Investment & Partnerships Department
export interface InvestmentPartnershipsSection {
  cityPreferred: boolean;
  districtPreferred: boolean;
  isCriticalArea: boolean;
  hasInvestmentBlockers: boolean;
  blockers?: {
    lackOfDeed: boolean;
    financialLiabilities: boolean;
    other?: string;
  };
  investmentProposal: "partial" | "full";
  investmentType: "educational" | "commercial" | "other";
  investmentTypeOther?: string;
  partialSketchFileName?: string;
  partialSketchFileUrl?: string;
  completedAt?: string;
  completedBy?: string;
}

// Section 6-9: Finance Department (Shared Services)
export interface FinanceSection {
  hasFinancialDues: boolean;
  financialDuesAction?: string;
  custodyItemsCleared: boolean;
  electricityAccountNumber?: string;
  electricityMeterNumbers?: string;
  waterAccountNumber?: string;
  waterMeterNumbers?: string;
  completedAt?: string;
  completedBy?: string;
}

// Section 10-12: Shared Services (Land Registry/Documentation)
export interface LandRegistrySection {
  assetOwnership: "ministry_of_education" | "education_department" | "other";
  assetOwnershipOther?: string;
  ownershipReference: "deed" | "building_permit" | "receipt_record" | "survey_decision" | "allocation_decision" | "regulatory_sketch" | "other";
  ownershipReferenceOther?: string;
  ownershipDocumentNumber?: string;
  ownershipDocumentDate?: string;
  regulatoryPlanReference?: string;
  plotNumber?: string;
  planNumber?: string;
  areaInWords?: string;
  areaInNumbers?: number;
  areaDocumentNumber?: string;
  areaDocumentDate?: string;
  completedAt?: string;
  completedBy?: string;
}

// Section 10-16: Security, Safety & Facilities Department (Shared Services)
export interface SecurityFacilitiesSection {
  // Section 10: Asset Ownership Reference
  assetOwnership?: "ministry_of_education" | "education_department" | "other";
  assetOwnershipOther?: string;
  ownershipReference?: "deed" | "building_permit" | "receipt_record" | "survey_decision" | "allocation_decision" | "regulatory_sketch" | "other";
  ownershipReferenceOther?: string;
  ownershipDocumentNumber?: string;
  ownershipDocumentDate?: string;
  // Section 11: Regulatory Plan
  regulatoryPlanReference?: "deed" | "building_permit" | "receipt_record" | "survey_decision" | "allocation_decision" | "regulatory_sketch" | "other";
  regulatoryPlanReferenceOther?: string;
  plotNumber?: string;
  planNumber?: string;
  // Section 12: Asset Area
  areaReference?: "deed" | "building_permit" | "receipt_record" | "survey_decision" | "allocation_decision" | "regulatory_sketch" | "other";
  areaReferenceOther?: string;
  areaInWords?: string;
  areaInNumbers?: number;
  areaDocumentNumber?: string;
  areaDocumentDate?: string;
  // Section 13: Structural Condition
  structuralCondition: "operational" | "requires_renovation" | "dilapidated" | "other";
  structuralConditionOther?: string;
  hasDemolitionDecision: boolean;
  demolitionDecisionNumber?: string;
  demolitionDecisionDate?: string;
  // Section 14: Dimensions
  dimensions: {
    north?: string;
    east?: string;
    south?: string;
    west?: string;
  };
  // Section 15: Boundaries
  boundaries: {
    north: "commercial_street" | "internal_street" | "other";
    northOther?: string;
    east: "commercial_street" | "internal_street" | "other";
    eastOther?: string;
    south: "commercial_street" | "internal_street" | "other";
    southOther?: string;
    west: "commercial_street" | "internal_street" | "other";
    westOther?: string;
  };
  // Section 16: Location
  location: {
    region?: string;
    governorate?: string;
    city?: string;
    district?: string;
    shortNationalAddress?: string;
    longitude?: number;
    latitude?: number;
  };
  aerialPhotoAttached?: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface IsnadForm {
  id: string;
  formCode: string;
  assetId: string;
  status: IsnadStatus;
  currentStage: IsnadStage;
  currentStepIndex: number;
  currentAssigneeId: string | null;
  investmentCriteria: InvestmentCriteria | null;
  technicalAssessment: TechnicalAssessment | null;
  financialAnalysis: FinancialAnalysis | null;
  schoolPlanningSection: SchoolPlanningSection | null;
  investmentPartnershipsSection: InvestmentPartnershipsSection | null;
  financeSection: FinanceSection | null;
  landRegistrySection: LandRegistrySection | null;
  securityFacilitiesSection: SecurityFacilitiesSection | null;
  workflowSteps: WorkflowStep[];
  attachments: string[];
  submittedAt: string | null;
  completedAt: string | null;
  returnCount: number;
  returnedByStage: IsnadStage | null;
  returnReason: string | null;
  slaDeadline: string | null;
  slaStatus: SlaStatus | null;
  packageId: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IsnadFormWithDetails extends IsnadForm {
  asset?: AssetWithDetails;
  createdByUser?: User;
  currentAssignee?: User;
  approvalHistory?: IsnadApproval[];
}

export interface IsnadApproval {
  id: string;
  formId: string;
  stage: IsnadStage;
  approverId: string;
  approverRole: string | null;
  action: IsnadAction;
  comments: string | null;
  rejectionReason: string | null;
  rejectionJustification: string | null;
  attachments: string[];
  assignedAt: string;
  actionTakenAt: string | null;
  durationHours: number | null;
  slaCompliant: boolean | null;
  createdAt: string;
}

export interface IsnadApprovalWithDetails extends IsnadApproval {
  approver?: User;
}

export const insertIsnadFormSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  investmentCriteria: z.object({
    investmentPurpose: z.string().min(1, "Investment purpose is required"),
    revenueProjection: z.string().optional().default(""),
    projectTimeline: z.string().min(1, "Project timeline is required"),
    requiredModifications: z.string().optional().default(""),
    complianceRequirements: z.string().optional().default(""),
    riskAssessment: z.string().min(1, "Risk assessment is required"),
  }).optional(),
  technicalAssessment: z.object({
    structuralCondition: z.string().optional().default(""),
    utilitiesAvailability: z.string().optional().default(""),
    accessInfrastructure: z.string().optional().default(""),
    environmentalConsiderations: z.string().optional().default(""),
    zoningCompliance: z.string().optional().default(""),
  }).optional(),
  financialAnalysis: z.object({
    currentValuation: z.number().min(0).default(0),
    outstandingDues: z.number().min(0).default(0),
    maintenanceCosts: z.number().min(0).default(0),
    expectedReturns: z.number().min(0).default(0),
    breakEvenAnalysis: z.string().optional().default(""),
  }).optional(),
});

export type InsertIsnadForm = z.infer<typeof insertIsnadFormSchema>;

export const isnadReviewActionSchema = z.object({
  action: z.enum(["approve", "reject", "return", "request_info", "info_provided"]),
  comments: z.string().optional(),
  rejectionReason: z.string().optional(),
  rejectionJustification: z.string().min(50, "Justification must be at least 50 characters").optional(),
});

export type IsnadReviewAction = z.infer<typeof isnadReviewActionSchema>;

// Zod schemas for department sections
export const schoolPlanningSectionSchema = z.object({
  assetStatus: z.enum(["vacant_land", "existing_building", "vacated_building", "stalled_project", "other"]),
  assetStatusOther: z.string().optional(),
  buildingName: z.string().optional(),
  decisionNumber: z.string().optional(),
  decisionDate: z.string().optional(),
  planningNeed: z.enum(["no_need", "has_need"]),
  needExpectedPeriod: z.string().optional(),
  hasProgrammingForm: z.boolean(),
  programmingFormDate: z.string().optional(),
  completedAt: z.string().optional(),
  completedBy: z.string().optional(),
});

export const investmentPartnershipsSectionSchema = z.object({
  cityPreferred: z.boolean(),
  districtPreferred: z.boolean(),
  isCriticalArea: z.boolean(),
  hasInvestmentBlockers: z.boolean(),
  blockers: z.object({
    lackOfDeed: z.boolean(),
    financialLiabilities: z.boolean(),
    other: z.string().optional(),
  }).optional(),
  investmentProposal: z.enum(["partial", "full"]),
  investmentType: z.enum(["educational", "commercial", "other"]),
  investmentTypeOther: z.string().optional(),
  partialSketchAttached: z.boolean().optional(),
  completedAt: z.string().optional(),
  completedBy: z.string().optional(),
});

export const financeSectionSchema = z.object({
  hasFinancialDues: z.boolean(),
  financialDuesAction: z.string().optional(),
  custodyItemsCleared: z.boolean(),
  electricityAccountNumber: z.string().optional(),
  electricityMeterNumbers: z.string().optional(),
  waterAccountNumber: z.string().optional(),
  waterMeterNumbers: z.string().optional(),
  completedAt: z.string().optional(),
  completedBy: z.string().optional(),
});

export const landRegistrySectionSchema = z.object({
  assetOwnership: z.enum(["ministry_of_education", "education_department", "other"]),
  assetOwnershipOther: z.string().optional(),
  ownershipReference: z.enum(["deed", "building_permit", "receipt_record", "survey_decision", "allocation_decision", "regulatory_sketch", "other"]),
  ownershipReferenceOther: z.string().optional(),
  ownershipDocumentNumber: z.string().optional(),
  ownershipDocumentDate: z.string().optional(),
  regulatoryPlanReference: z.string().optional(),
  plotNumber: z.string().optional(),
  planNumber: z.string().optional(),
  areaInWords: z.string().optional(),
  areaInNumbers: z.number().optional(),
  areaDocumentNumber: z.string().optional(),
  areaDocumentDate: z.string().optional(),
  completedAt: z.string().optional(),
  completedBy: z.string().optional(),
});

export const securityFacilitiesSectionSchema = z.object({
  structuralCondition: z.enum(["operational", "requires_renovation", "dilapidated", "other"]),
  structuralConditionOther: z.string().optional(),
  hasDemolitionDecision: z.boolean(),
  demolitionDecisionNumber: z.string().optional(),
  demolitionDecisionDate: z.string().optional(),
  dimensions: z.object({
    north: z.string().optional(),
    east: z.string().optional(),
    south: z.string().optional(),
    west: z.string().optional(),
  }),
  boundaries: z.object({
    north: z.enum(["commercial_street", "internal_street", "other"]),
    northOther: z.string().optional(),
    east: z.enum(["commercial_street", "internal_street", "other"]),
    eastOther: z.string().optional(),
    south: z.enum(["commercial_street", "internal_street", "other"]),
    southOther: z.string().optional(),
    west: z.enum(["commercial_street", "internal_street", "other"]),
    westOther: z.string().optional(),
  }),
  location: z.object({
    region: z.string().optional(),
    governorate: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    shortNationalAddress: z.string().optional(),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
  }),
  aerialPhotoAttached: z.boolean().optional(),
  completedAt: z.string().optional(),
  completedBy: z.string().optional(),
});

export const updateIsnadFormSchema = z.object({
  investmentCriteria: z.object({
    investmentPurpose: z.string(),
    revenueProjection: z.string(),
    projectTimeline: z.string(),
    requiredModifications: z.string(),
    complianceRequirements: z.string(),
    riskAssessment: z.string(),
  }).optional(),
  technicalAssessment: z.object({
    structuralCondition: z.string(),
    utilitiesAvailability: z.string(),
    accessInfrastructure: z.string(),
    environmentalConsiderations: z.string(),
    zoningCompliance: z.string(),
  }).optional(),
  financialAnalysis: z.object({
    currentValuation: z.number(),
    outstandingDues: z.number(),
    maintenanceCosts: z.number(),
    expectedReturns: z.number(),
    breakEvenAnalysis: z.string(),
  }).optional(),
  schoolPlanningSection: schoolPlanningSectionSchema.optional(),
  investmentPartnershipsSection: investmentPartnershipsSectionSchema.optional(),
  financeSection: financeSectionSchema.optional(),
  landRegistrySection: landRegistrySectionSchema.optional(),
  securityFacilitiesSection: securityFacilitiesSectionSchema.optional(),
  attachments: z.array(z.object({
    url: z.string(),
    fileName: z.string(),
    fileType: z.string(),
    uploadedAt: z.string(),
    uploadedBy: z.string(),
  })).optional(),
});

export type UpdateIsnadForm = z.infer<typeof updateIsnadFormSchema>;

export const isnadFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...isnadStatusEnum, "all"]).optional(),
  stage: z.enum([...isnadStageEnum, "all"]).optional(),
  assetId: z.string().optional(),
  createdBy: z.string().optional(),
  assigneeId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
});

export type IsnadFilters = z.infer<typeof isnadFiltersSchema>;

// =============================================================================
// ISNAD Package Types & Schemas
// =============================================================================

export const packageStatusEnum = [
  "draft",
  "pending_ceo",
  "ceo_approved",
  "pending_minister",
  "minister_approved",
  "rejected_ceo",
  "rejected_minister",
] as const;
export type PackageStatus = (typeof packageStatusEnum)[number];

export const packageStatusLabels: Record<PackageStatus, string> = {
  draft: "Draft",
  pending_ceo: "Pending CEO Approval",
  ceo_approved: "CEO Approved",
  pending_minister: "Pending Minister Approval",
  minister_approved: "Minister Approved",
  rejected_ceo: "Rejected by CEO",
  rejected_minister: "Rejected by Minister",
};

export const packagePriorityEnum = ["high", "medium", "low"] as const;
export type PackagePriority = (typeof packagePriorityEnum)[number];

export interface IsnadPackage {
  id: string;
  packageCode: string;
  packageName: string;
  description: string | null;
  investmentStrategy: string | null;
  priority: PackagePriority;
  durationYears: number | null;
  durationMonths: number | null;
  status: PackageStatus;
  expectedRevenue: number;
  totalValuation: number;
  totalAssets: number;
  ceoApprovedAt: string | null;
  ceoComments: string | null;
  ministerApprovedAt: string | null;
  ministerComments: string | null;
  rejectionReason: string | null;
  packageDocumentUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface PackageAsset {
  id: string;
  packageId: string;
  assetId: string;
  formId: string;
  addedAt: string;
}

export interface IsnadPackageWithDetails extends IsnadPackage {
  createdByUser?: User;
  assets?: AssetWithDetails[];
  forms?: IsnadFormWithDetails[];
}

export const insertPackageSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  description: z.string().optional(),
  investmentStrategy: z.string().optional(),
  priority: z.enum(packagePriorityEnum).default("medium"),
  durationYears: z.number().int().min(1).max(50).optional(),
  durationMonths: z.number().int().min(0).max(12).optional(),
  formIds: z.array(z.string()).min(1, "At least one ISNAD form is required"),
});

export type InsertPackage = z.infer<typeof insertPackageSchema>;

export const packageReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comments: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type PackageReview = z.infer<typeof packageReviewSchema>;

export const packageFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...packageStatusEnum, "all"]).optional(),
  priority: z.enum([...packagePriorityEnum, "all"]).optional(),
  createdBy: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
});

export type PackageFilters = z.infer<typeof packageFiltersSchema>;

// =============================================================================
// Notification System Types & Schemas
// =============================================================================

export const notificationTypeEnum = [
  "form_submitted",
  "approval_needed",
  "form_approved",
  "form_rejected",
  "form_returned",
  "info_requested",
  "sla_warning",
  "sla_urgent",
  "sla_overdue",
  "package_created",
  "package_approved",
  "package_rejected",
  "comment_added",
  "assigned_reviewer",
] as const;
export type NotificationType = (typeof notificationTypeEnum)[number];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  formId: string | null;
  packageId: string | null;
  assetId: string | null;
  actionUrl: string | null;
  read: boolean;
  readAt: string | null;
  emailSent: boolean;
  emailSentAt: string | null;
  createdAt: string;
}

export interface NotificationWithDetails extends Notification {
  form?: IsnadForm;
  package?: IsnadPackage;
  asset?: Asset;
}

export const notificationFiltersSchema = z.object({
  type: z.enum([...notificationTypeEnum, "all"]).optional(),
  read: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
});

export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;

// =============================================================================
// Dashboard Types for ISNAD
// =============================================================================

export interface IsnadDashboardStats {
  totalForms: number;
  draftForms: number;
  inReviewForms: number;
  approvedForms: number;
  rejectedForms: number;
  changesRequestedForms: number;
  pendingMyAction: number;
  byStage: Record<IsnadStage, number>;
  slaCompliance: {
    onTime: number;
    warning: number;
    urgent: number;
    overdue: number;
  };
  recentForms: IsnadFormWithDetails[];
}

export interface PackageDashboardStats {
  totalPackages: number;
  draftPackages: number;
  pendingCeo: number;
  pendingMinister: number;
  approved: number;
  rejected: number;
  totalValueApproved: number;
  recentPackages: IsnadPackageWithDetails[];
}

export interface IsnadReviewQueueItem {
  form: IsnadFormWithDetails;
  daysPending: number;
  slaStatus: SlaStatus;
  submittedDate: string;
}

export interface ExecutiveDashboardStats {
  pendingPackages: number;
  approvedPackages: number;
  rejectedPackages: number;
  totalApprovedValue: number;
  totalApprovedAssets: number;
  averageApprovalTime: number;
  recentDecisions: IsnadPackageWithDetails[];
}

// =============================================================================
// Contract Management Types
// =============================================================================

export const contractStatusEnum = [
  "draft",
  "incomplete",
  "active",
  "expiring",
  "expired",
  "archived",
  "cancelled",
] as const;
export type ContractStatus = (typeof contractStatusEnum)[number];

export const contractStatusLabels: Record<ContractStatus, string> = {
  draft: "Draft",
  incomplete: "Incomplete",
  active: "Active",
  expiring: "Expiring",
  expired: "Expired",
  archived: "Archived",
  cancelled: "Cancelled",
};

export const installmentStatusEnum = [
  "pending",
  "overdue",
  "partial",
  "paid",
] as const;
export type InstallmentStatus = (typeof installmentStatusEnum)[number];

export const installmentStatusLabels: Record<InstallmentStatus, string> = {
  pending: "Pending",
  overdue: "Overdue",
  partial: "Partial",
  paid: "Paid",
};

export const vatRateEnum = [0, 5, 15] as const;
export type VatRate = (typeof vatRateEnum)[number];

export const installmentPlanTypeEnum = ["equal", "custom"] as const;
export type InstallmentPlanType = (typeof installmentPlanTypeEnum)[number];

export const installmentFrequencyEnum = [
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
] as const;
export type InstallmentFrequency = (typeof installmentFrequencyEnum)[number];

export const cancellationReasonEnum = [
  "investor_default",
  "asset_issues",
  "mutual_agreement",
  "legal_regulatory",
  "force_majeure",
  "other",
] as const;
export type CancellationReason = (typeof cancellationReasonEnum)[number];

export const cancellationReasonLabels: Record<CancellationReason, string> = {
  investor_default: "Investor Default",
  asset_issues: "Asset Issues",
  mutual_agreement: "Mutual Agreement",
  legal_regulatory: "Legal/Regulatory",
  force_majeure: "Force Majeure",
  other: "Other",
};

export const investorStatusEnum = ["active", "inactive", "blacklisted"] as const;
export type InvestorStatus = (typeof investorStatusEnum)[number];

export interface Investor {
  id: string;
  investorCode: string;
  nameAr: string;
  nameEn: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  companyRegistration: string | null;
  taxId: string | null;
  address: string | null;
  city: string | null;
  country: string;
  status: InvestorStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  contractCode: string;
  landCode: string;
  assetId: string;
  investorId: string;
  assetNameAr: string;
  assetNameEn: string;
  investorNameAr: string;
  investorNameEn: string;
  annualRentalAmount: number;
  vatRate: VatRate;
  totalAnnualAmount: number;
  contractDuration: number;
  totalContractAmount: number;
  currency: string;
  signingDate: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  installmentPlanType: InstallmentPlanType | null;
  installmentCount: number | null;
  installmentFrequency: InstallmentFrequency | null;
  signedPdfUrl: string | null;
  signedPdfUploadedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: CancellationReason | null;
  cancellationJustification: string | null;
  cancellationDocuments: string[];
  notes: string | null;
  specialConditions: string | null;
  legalTermsReference: string | null;
  approvalAuthority: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
}

export interface ContractWithDetails extends Contract {
  asset?: Asset;
  investor?: Investor;
  installments?: Installment[];
  nextInstallment?: Installment | null;
  paymentStatus?: InstallmentStatus;
}

export interface Installment {
  id: string;
  contractId: string;
  installmentNumber: number;
  amountDue: number;
  dueDate: string;
  status: InstallmentStatus;
  paymentDate: string | null;
  partialAmountPaid: number | null;
  remainingBalance: number | null;
  receiptFileUrl: string | null;
  receiptFileName: string | null;
  receiptUploadedAt: string | null;
  receiptUploadedBy: string | null;
  notes: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ContractVersion {
  id: string;
  contractId: string;
  versionNumber: number;
  contractData: Record<string, unknown>;
  changedBy: string;
  changedAt: string;
  changeDescription: string | null;
  changesMade: Record<string, unknown> | null;
}

// Contract Insert Schemas
export const insertInvestorSchema = z.object({
  investorCode: z.string().min(1, "Investor code is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  nameEn: z.string().min(1, "English name is required"),
  contactPerson: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  companyRegistration: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().default("Saudi Arabia"),
  status: z.enum(investorStatusEnum).default("active"),
  notes: z.string().nullable().optional(),
});

export type InsertInvestor = z.infer<typeof insertInvestorSchema>;

export const landCodeRegex = /^[A-Z]{3}-\d{1,6}$/;

export const insertContractSchema = z.object({
  landCode: z.string().regex(landCodeRegex, "Land code must be format XXX-### (e.g., RYD-001)"),
  assetId: z.string().min(1, "Asset is required"),
  investorId: z.string().min(1, "Investor is required"),
  assetNameAr: z.string().min(1, "Asset name (Arabic) is required"),
  assetNameEn: z.string().min(1, "Asset name (English) is required"),
  investorNameAr: z.string().min(1, "Investor name (Arabic) is required"),
  investorNameEn: z.string().min(1, "Investor name (English) is required"),
  annualRentalAmount: z.number().positive("Annual rental amount must be positive"),
  vatRate: z.number().refine((v) => [0, 5, 15].includes(v), "VAT rate must be 0%, 5%, or 15%"),
  contractDuration: z.number().int().positive("Contract duration must be at least 1 year"),
  signingDate: z.string().min(1, "Signing date is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  installmentPlanType: z.enum(installmentPlanTypeEnum).nullable().optional(),
  installmentCount: z.number().int().positive().nullable().optional(),
  installmentFrequency: z.enum(installmentFrequencyEnum).nullable().optional(),
  signedPdfUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  specialConditions: z.string().nullable().optional(),
  legalTermsReference: z.string().nullable().optional(),
  approvalAuthority: z.string().nullable().optional(),
});

export type InsertContract = z.infer<typeof insertContractSchema>;

export const updateContractSchema = insertContractSchema.partial().extend({
  status: z.enum(contractStatusEnum).optional(),
});

export type UpdateContract = z.infer<typeof updateContractSchema>;

export const insertInstallmentSchema = z.object({
  contractId: z.string().min(1, "Contract is required"),
  installmentNumber: z.number().int().positive(),
  amountDue: z.number().positive("Amount must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().nullable().optional(),
});

export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;

export const updateInstallmentStatusSchema = z.object({
  status: z.enum(installmentStatusEnum),
  paymentDate: z.string().nullable().optional(),
  partialAmountPaid: z.number().positive().nullable().optional(),
  receiptFileUrl: z.string().nullable().optional(),
  receiptFileName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateInstallmentStatus = z.infer<typeof updateInstallmentStatusSchema>;

export const contractFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...contractStatusEnum, "all"]).optional(),
  investorId: z.string().optional(),
  assetId: z.string().optional(),
  signingDateFrom: z.string().optional(),
  signingDateTo: z.string().optional(),
  endDateFrom: z.string().optional(),
  endDateTo: z.string().optional(),
  paymentStatus: z.enum([...installmentStatusEnum, "all"]).optional(),
  expiryWindow: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type ContractFilters = z.infer<typeof contractFiltersSchema>;

export const cancelContractSchema = z.object({
  reason: z.enum(cancellationReasonEnum),
  justification: z.string().min(100, "Justification must be at least 100 characters"),
  documents: z.array(z.string()).optional(),
});

export type CancelContract = z.infer<typeof cancelContractSchema>;

export const installmentPlanSchema = z.object({
  type: z.enum(installmentPlanTypeEnum),
  count: z.number().int().positive().optional(),
  frequency: z.enum(installmentFrequencyEnum).optional(),
  customInstallments: z.array(z.object({
    amount: z.number().positive(),
    dueDate: z.string(),
    description: z.string().optional(),
  })).optional(),
});

export type InstallmentPlan = z.infer<typeof installmentPlanSchema>;

// Contract Dashboard Types
export interface ContractDashboardStats {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  incompleteContracts: number;
  cancelledContracts: number;
  archivedContracts: number;
  totalContractValue: number;
  overdueInstallments: number;
  overdueAmount: number;
  paidThisMonth: number;
  paidAmountThisMonth: number;
  pendingInstallments: number;
  installmentsDueToday: number;
}

// =============================================================================
// Investor Portal & CRM Types & Schemas
// =============================================================================

export const investorAccountStatusEnum = ["active", "inactive", "blocked"] as const;
export type InvestorAccountStatus = (typeof investorAccountStatusEnum)[number];

export const investorAccountTypeEnum = ["individual", "company"] as const;
export type InvestorAccountType = (typeof investorAccountTypeEnum)[number];

export const interestStatusEnum = ["new", "under_review", "approved", "rejected", "converted"] as const;
export type InterestStatus = (typeof interestStatusEnum)[number];

export const interestStatusLabels: Record<InterestStatus, string> = {
  new: "New",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted to Contract",
};

export const investmentPurposeEnum = [
  "commercial_development",
  "residential_project",
  "mixed_use",
  "educational_facility",
  "healthcare_facility",
  "retail_center",
  "industrial_warehouse",
  "other",
] as const;
export type InvestmentPurpose = (typeof investmentPurposeEnum)[number];

export const investmentPurposeLabels: Record<InvestmentPurpose, string> = {
  commercial_development: "Commercial Development",
  residential_project: "Residential Project",
  mixed_use: "Mixed Use",
  educational_facility: "Educational Facility",
  healthcare_facility: "Healthcare Facility",
  retail_center: "Retail Center",
  industrial_warehouse: "Industrial/Warehouse",
  other: "Other",
};

export const investmentAmountRangeEnum = [
  "under_1m",
  "1m_5m",
  "5m_10m",
  "10m_50m",
  "50m_100m",
  "over_100m",
] as const;
export type InvestmentAmountRange = (typeof investmentAmountRangeEnum)[number];

export const investmentAmountRangeLabels: Record<InvestmentAmountRange, string> = {
  under_1m: "< 1M SAR",
  "1m_5m": "1M - 5M SAR",
  "5m_10m": "5M - 10M SAR",
  "10m_50m": "10M - 50M SAR",
  "50m_100m": "50M - 100M SAR",
  over_100m: "> 100M SAR",
};

export const investmentTimelineEnum = [
  "immediate",
  "short_term",
  "mid_term",
  "long_term",
  "over_2_years",
] as const;
export type InvestmentTimeline = (typeof investmentTimelineEnum)[number];

export const investmentTimelineLabels: Record<InvestmentTimeline, string> = {
  immediate: "Immediate (0-3 months)",
  short_term: "Short-term (3-6 months)",
  mid_term: "Mid-term (6-12 months)",
  long_term: "Long-term (1-2 years)",
  over_2_years: "2+ years",
};

export const istifadaStatusEnum = [
  "new",
  "under_review",
  "additional_info_requested",
  "approved",
  "rejected",
  "completed",
] as const;
export type IstifadaStatus = (typeof istifadaStatusEnum)[number];

export const istifadaStatusLabels: Record<IstifadaStatus, string> = {
  new: "New",
  under_review: "Under Review",
  additional_info_requested: "Info Requested",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export const istifadaProgramTypeEnum = [
  "educational_services",
  "community_programs",
  "sports_activities",
  "cultural_events",
  "other",
] as const;
export type IstifadaProgramType = (typeof istifadaProgramTypeEnum)[number];

export const istifadaProgramTypeLabels: Record<IstifadaProgramType, string> = {
  educational_services: "Educational Services",
  community_programs: "Community Programs",
  sports_activities: "Sports Activities",
  cultural_events: "Cultural Events",
  other: "Other",
};

// Portal Investor Account (linked to SSO)
export interface InvestorAccount {
  id: string;
  ssoUserId: string;
  investorId: string | null;
  accountType: InvestorAccountType;
  fullNameAr: string;
  fullNameEn: string;
  nationalIdOrCr: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  contactPerson: string | null;
  verificationStatus: string;
  status: InvestorAccountStatus;
  registrationDate: string;
  lastLoginAt: string | null;
  totalInterests: number;
  totalContracts: number;
  createdAt: string;
  updatedAt: string;
}

// Asset Favorites
export interface InvestorFavorite {
  id: string;
  investorAccountId: string;
  assetId: string;
  createdAt: string;
}

export interface InvestorFavoriteWithAsset extends InvestorFavorite {
  asset?: AssetWithDetails;
}

// Investment Interest Submission
export interface InvestorInterest {
  id: string;
  referenceNumber: string;
  investorAccountId: string;
  assetId: string;
  investmentPurpose: InvestmentPurpose;
  proposedUseDescription: string;
  investmentAmountRange: InvestmentAmountRange;
  expectedTimeline: InvestmentTimeline;
  additionalComments: string | null;
  attachments: string[];
  status: InterestStatus;
  assignedToId: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  convertedContractId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestorInterestWithDetails extends InvestorInterest {
  investorAccount?: InvestorAccount;
  asset?: AssetWithDetails;
  assignedTo?: User;
  reviewedByUser?: User;
}

// Istifada Program Request
export interface IstifadaRequest {
  id: string;
  referenceNumber: string;
  investorAccountId: string;
  assetId: string | null;
  programType: IstifadaProgramType;
  programTitle: string;
  programDescription: string;
  targetBeneficiaries: string | null;
  startDate: string;
  endDate: string;
  budgetEstimate: string | null;
  proposalDocuments: string[];
  financialPlanDocuments: string[];
  organizationCredentials: string[];
  additionalDocuments: string[];
  status: IstifadaStatus;
  assignedToId: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  additionalInfoRequest: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IstifadaRequestWithDetails extends IstifadaRequest {
  investorAccount?: InvestorAccount;
  asset?: AssetWithDetails;
  assignedTo?: User;
  reviewedByUser?: User;
}

// CRM Investor Notes
export interface InvestorNote {
  id: string;
  investorAccountId: string;
  noteType: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface InvestorNoteWithUser extends InvestorNote {
  createdByUser?: User;
}

// Insert Schemas
export const insertInvestorAccountSchema = z.object({
  ssoUserId: z.string().min(1, "SSO User ID is required"),
  investorId: z.string().nullable().optional(),
  accountType: z.enum(investorAccountTypeEnum),
  fullNameAr: z.string().min(1, "Arabic name is required"),
  fullNameEn: z.string().min(1, "English name is required"),
  nationalIdOrCr: z.string().min(1, "National ID or CR is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  verificationStatus: z.string().default("pending"),
  status: z.enum(investorAccountStatusEnum).default("active"),
});

export type InsertInvestorAccount = z.infer<typeof insertInvestorAccountSchema>;

export const insertInvestorInterestSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  investmentPurpose: z.enum(investmentPurposeEnum),
  proposedUseDescription: z.string().min(20, "Description must be at least 20 characters"),
  investmentAmountRange: z.enum(investmentAmountRangeEnum).optional(),
  expectedTimeline: z.enum(investmentTimelineEnum).optional(),
  additionalComments: z.string().nullable().optional(),
  attachments: z.array(z.string()).default([]),
});

export type InsertInvestorInterest = z.infer<typeof insertInvestorInterestSchema>;

export const insertIstifadaRequestSchema = z.object({
  assetId: z.string().nullable().optional(),
  programType: z.enum(istifadaProgramTypeEnum),
  programTitle: z.string().min(5, "Program title must be at least 5 characters"),
  programDescription: z.string().min(20, "Description must be at least 20 characters"),
  targetBeneficiaries: z.string().nullable().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budgetEstimate: z.string().nullable().optional(),
  proposalDocuments: z.array(z.string()).default([]),
  financialPlanDocuments: z.array(z.string()).default([]),
  organizationCredentials: z.array(z.string()).default([]),
  additionalDocuments: z.array(z.string()).default([]),
});

export type InsertIstifadaRequest = z.infer<typeof insertIstifadaRequestSchema>;

export const interestReviewActionSchema = z.object({
  action: z.enum(["approve", "reject", "convert"]),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type InterestReviewAction = z.infer<typeof interestReviewActionSchema>;

export const istifadaReviewActionSchema = z.object({
  action: z.enum(["approve", "reject", "request_info", "complete"]),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  additionalInfoRequest: z.string().optional(),
});

export type IstifadaReviewAction = z.infer<typeof istifadaReviewActionSchema>;

// Filter Schemas
export const portalAssetFiltersSchema = z.object({
  search: z.string().optional(),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  assetType: z.enum([...assetTypeEnum, "all"]).optional(),
  areaMin: z.number().optional(),
  areaMax: z.number().optional(),
  classification: z.string().optional(),
  sortBy: z.enum(["newest", "name", "area_asc", "area_desc"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(48).default(12),
});

export type PortalAssetFilters = z.infer<typeof portalAssetFiltersSchema>;

export const crmInvestorFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...investorAccountStatusEnum, "all"]).optional(),
  accountType: z.enum([...investorAccountTypeEnum, "all"]).optional(),
  hasActiveInterests: z.boolean().optional(),
  hasContracts: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
});

export type CrmInvestorFilters = z.infer<typeof crmInvestorFiltersSchema>;

export const interestFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...interestStatusEnum, "all"]).optional(),
  investorAccountId: z.string().optional(),
  assetId: z.string().optional(),
  assignedToId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
});

export type InterestFilters = z.infer<typeof interestFiltersSchema>;

export const istifadaFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum([...istifadaStatusEnum, "all"]).optional(),
  programType: z.enum([...istifadaProgramTypeEnum, "all"]).optional(),
  investorAccountId: z.string().optional(),
  assetId: z.string().optional(),
  assignedToId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
});

export type IstifadaFilters = z.infer<typeof istifadaFiltersSchema>;

// Dashboard Stats
export interface PortalDashboardStats {
  exposedAssets: number;
  totalFavorites: number;
  myInterests: number;
  myRequests: number;
  pendingActions: number;
}

export interface CrmDashboardStats {
  totalInvestorAccounts: number;
  activeInvestors: number;
  blockedInvestors: number;
  totalInterests: number;
  newInterests: number;
  underReviewInterests: number;
  approvedInterests: number;
  convertedInterests: number;
  totalIstifadaRequests: number;
  pendingIstifadaRequests: number;
  mostFavoritedAssets: { assetId: string; assetName: string; count: number }[];
  interestsByPurpose: { purpose: InvestmentPurpose; count: number }[];
  conversionRate: number;
}
