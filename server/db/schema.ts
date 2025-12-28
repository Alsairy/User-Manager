import { pgTable, varchar, text, integer, boolean, timestamp, numeric, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const investorAccountStatusEnum = pgEnum("investor_account_status", ["active", "inactive", "blocked"]);
export const investorAccountTypeEnum = pgEnum("investor_account_type", ["individual", "company"]);
export const interestStatusEnum = pgEnum("interest_status", ["new", "under_review", "approved", "rejected", "converted"]);
export const investmentPurposeEnum = pgEnum("investment_purpose", [
  "commercial_development",
  "residential_project",
  "mixed_use",
  "educational_facility",
  "healthcare_facility",
  "retail_center",
  "industrial_warehouse",
  "other",
]);
export const investmentAmountRangeEnum = pgEnum("investment_amount_range", [
  "under_1m",
  "1m_5m",
  "5m_10m",
  "10m_50m",
  "50m_100m",
  "over_100m",
]);
export const investmentTimelineEnum = pgEnum("investment_timeline", [
  "immediate",
  "short_term",
  "mid_term",
  "long_term",
  "over_2_years",
]);
export const istifadaStatusEnum = pgEnum("istifada_status", [
  "new",
  "under_review",
  "additional_info_requested",
  "approved",
  "rejected",
  "completed",
]);
export const istifadaProgramTypeEnum = pgEnum("istifada_program_type", [
  "educational_services",
  "community_programs",
  "sports_activities",
  "cultural_events",
  "other",
]);

export const investorAccounts = pgTable("investor_accounts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  ssoUserId: varchar("sso_user_id", { length: 255 }).notNull().unique(),
  investorId: varchar("investor_id", { length: 36 }),
  accountType: investorAccountTypeEnum("account_type").notNull().default("individual"),
  fullNameAr: varchar("full_name_ar", { length: 255 }).notNull(),
  fullNameEn: varchar("full_name_en", { length: 255 }).notNull(),
  nationalIdOrCr: varchar("national_id_or_cr", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  companyName: varchar("company_name", { length: 255 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  verificationStatus: varchar("verification_status", { length: 50 }).notNull().default("pending"),
  status: investorAccountStatusEnum("status").notNull().default("active"),
  registrationDate: timestamp("registration_date").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  totalInterests: integer("total_interests").notNull().default(0),
  totalContracts: integer("total_contracts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const investorFavorites = pgTable("investor_favorites", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  investorAccountId: varchar("investor_account_id", { length: 36 }).notNull().references(() => investorAccounts.id),
  assetId: varchar("asset_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investorInterests = pgTable("investor_interests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  referenceNumber: varchar("reference_number", { length: 20 }).notNull().unique(),
  investorAccountId: varchar("investor_account_id", { length: 36 }).notNull().references(() => investorAccounts.id),
  assetId: varchar("asset_id", { length: 36 }).notNull(),
  investmentPurpose: investmentPurposeEnum("investment_purpose").notNull(),
  proposedUseDescription: text("proposed_use_description").notNull(),
  investmentAmountRange: investmentAmountRangeEnum("investment_amount_range").notNull(),
  expectedTimeline: investmentTimelineEnum("expected_timeline").notNull(),
  additionalComments: text("additional_comments"),
  attachments: jsonb("attachments").default([]),
  status: interestStatusEnum("status").notNull().default("new"),
  assignedToId: varchar("assigned_to_id", { length: 36 }),
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  convertedContractId: varchar("converted_contract_id", { length: 36 }),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const istifadaRequests = pgTable("istifada_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  referenceNumber: varchar("reference_number", { length: 20 }).notNull().unique(),
  investorAccountId: varchar("investor_account_id", { length: 36 }).notNull().references(() => investorAccounts.id),
  assetId: varchar("asset_id", { length: 36 }),
  programType: istifadaProgramTypeEnum("program_type").notNull(),
  programTitle: varchar("program_title", { length: 255 }).notNull(),
  programDescription: text("program_description").notNull(),
  targetBeneficiaries: text("target_beneficiaries"),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  budgetEstimate: varchar("budget_estimate", { length: 100 }),
  proposalDocuments: jsonb("proposal_documents").default([]),
  financialPlanDocuments: jsonb("financial_plan_documents").default([]),
  organizationCredentials: jsonb("organization_credentials").default([]),
  additionalDocuments: jsonb("additional_documents").default([]),
  status: istifadaStatusEnum("status").notNull().default("new"),
  assignedToId: varchar("assigned_to_id", { length: 36 }),
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  additionalInfoRequest: text("additional_info_request"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const investorNotes = pgTable("investor_notes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  investorAccountId: varchar("investor_account_id", { length: 36 }).notNull().references(() => investorAccounts.id),
  noteType: varchar("note_type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investorAccountsRelations = relations(investorAccounts, ({ many }) => ({
  favorites: many(investorFavorites),
  interests: many(investorInterests),
  istifadaRequests: many(istifadaRequests),
  notes: many(investorNotes),
}));

export const investorFavoritesRelations = relations(investorFavorites, ({ one }) => ({
  investorAccount: one(investorAccounts, {
    fields: [investorFavorites.investorAccountId],
    references: [investorAccounts.id],
  }),
}));

export const investorInterestsRelations = relations(investorInterests, ({ one }) => ({
  investorAccount: one(investorAccounts, {
    fields: [investorInterests.investorAccountId],
    references: [investorAccounts.id],
  }),
}));

export const istifadaRequestsRelations = relations(istifadaRequests, ({ one }) => ({
  investorAccount: one(investorAccounts, {
    fields: [istifadaRequests.investorAccountId],
    references: [investorAccounts.id],
  }),
}));

export const investorNotesRelations = relations(investorNotes, ({ one }) => ({
  investorAccount: one(investorAccounts, {
    fields: [investorNotes.investorAccountId],
    references: [investorAccounts.id],
  }),
}));
