import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertRoleSchema,
  userFiltersSchema,
  insertAssetSchema,
  assetFiltersSchema,
  assetBankFiltersSchema,
  reviewActionSchema,
  toggleVisibilitySchema,
  WorkflowStage,
  workflowStageEnum,
  predefinedFeatures,
  featureLabels,
  insertIsnadFormSchema,
  updateIsnadFormSchema,
  isnadFiltersSchema,
  isnadReviewActionSchema,
  IsnadStage,
  isnadStageEnum,
  insertPackageSchema,
  packageFiltersSchema,
  packageReviewSchema,
  notificationFiltersSchema,
  insertInvestorSchema,
  insertContractSchema,
  updateContractSchema,
  contractFiltersSchema,
  cancelContractSchema,
  insertInstallmentSchema,
  updateInstallmentStatusSchema,
  installmentPlanSchema,
  ContractStatus,
  insertInvestorAccountSchema,
  crmInvestorFiltersSchema,
  portalAssetFiltersSchema,
  insertInvestorInterestSchema,
  interestFiltersSchema,
  interestReviewActionSchema,
  insertIstifadaRequestSchema,
  istifadaFiltersSchema,
  istifadaReviewActionSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const filters = userFiltersSchema.parse({
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        organizationId: req.query.organizationId as string | undefined,
        roleId: req.query.roleId as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const result = await storage.getUsers(filters);
      res.json({
        ...result,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data, "admin");
      
      if (req.body.hasCustomPermissions && req.body.customPermissions) {
        await storage.setUserCustomPermissions(
          user.id,
          req.body.customPermissions,
          "admin"
        );
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "user_create",
        entityType: "user",
        entityId: user.id,
        changes: { email: user.email },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.get("/api/users/validate-email", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const available = await storage.validateEmail(email);
      res.json({ available });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate email" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "user_update",
        entityType: "user",
        entityId: user.id,
        changes: req.body,
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "user_deactivate",
        entityType: "user",
        entityId: req.params.id,
        changes: { status: "inactive" },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.post("/api/users/:id/resend-invitation", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.status !== "pending") {
        return res.status(400).json({ error: "User is not pending activation" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "invitation_resend",
        entityType: "user",
        entityId: req.params.id,
        changes: null,
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json({ success: true, message: "Invitation resent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to resend invitation" });
    }
  });

  app.get("/api/roles", async (_req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to get roles" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const data = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(data);

      await storage.createAuditLog({
        userId: "admin",
        actionType: "role_create",
        entityType: "role",
        entityId: role.id,
        changes: { name: role.name },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create role" });
      }
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to get role" });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const role = await storage.updateRole(req.params.id, req.body);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "role_update",
        entityType: "role",
        entityId: role.id,
        changes: req.body,
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const success = await storage.deleteRole(req.params.id);
      if (!success) {
        return res.status(400).json({ error: "Cannot delete role" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "role_delete",
        entityType: "role",
        entityId: req.params.id,
        changes: null,
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  app.get("/api/permissions", async (_req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get permissions" });
    }
  });

  app.get("/api/permissions/groups", async (_req, res) => {
    try {
      const permissions = await storage.getPermissions();
      const grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.processGroup]) {
          acc[perm.processGroup] = [];
        }
        acc[perm.processGroup].push(perm);
        return acc;
      }, {} as Record<string, typeof permissions>);
      res.json(grouped);
    } catch (error) {
      res.status(500).json({ error: "Failed to get permission groups" });
    }
  });

  app.get("/api/organizations", async (_req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get organizations" });
    }
  });

  app.get("/api/work-units", async (req, res) => {
    try {
      const organizationId = req.query.organizationId as string | undefined;
      const workUnits = await storage.getWorkUnits(organizationId);
      res.json(workUnits);
    } catch (error) {
      res.status(500).json({ error: "Failed to get work units" });
    }
  });

  app.get("/api/audit-logs", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        actionType: req.query.actionType as string | undefined,
        entityType: req.query.entityType as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      };
      const result = await storage.getAuditLogs(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get audit logs" });
    }
  });

  app.get("/api/audit-logs/user/:userId", async (req, res) => {
    try {
      const result = await storage.getAuditLogs({
        page: 1,
        limit: 100,
      });
      const userLogs = result.logs.filter((l) => l.userId === req.params.userId);
      res.json({ logs: userLogs, total: userLogs.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user audit logs" });
    }
  });

  app.get("/api/reference/regions", async (_req, res) => {
    try {
      const regions = await storage.getRegions();
      res.json(regions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get regions" });
    }
  });

  app.get("/api/reference/cities", async (req, res) => {
    try {
      const regionId = req.query.regionId as string | undefined;
      const cities = await storage.getCities(regionId);
      res.json(cities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get cities" });
    }
  });

  app.get("/api/reference/districts", async (req, res) => {
    try {
      const cityId = req.query.cityId as string | undefined;
      const districts = await storage.getDistricts(cityId);
      res.json(districts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get districts" });
    }
  });

  app.get("/api/reference/features", async (_req, res) => {
    try {
      const features = predefinedFeatures.map((f) => ({
        id: f,
        name: featureLabels[f],
      }));
      res.json(features);
    } catch (error) {
      res.status(500).json({ error: "Failed to get features" });
    }
  });

  app.get("/api/assets/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getAssetDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get asset dashboard stats" });
    }
  });

  app.get("/api/assets/registrations", async (req, res) => {
    try {
      const filters = assetFiltersSchema.parse({
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        assetType: req.query.assetType as string | undefined,
        regionId: req.query.regionId as string | undefined,
        cityId: req.query.cityId as string | undefined,
        districtId: req.query.districtId as string | undefined,
        createdBy: req.query.createdBy as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const result = await storage.getAssets(filters);
      res.json({
        ...result,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get asset registrations" });
    }
  });

  app.post("/api/assets/registrations", async (req, res) => {
    try {
      const data = insertAssetSchema.parse(req.body);
      const isDuplicate = await storage.checkDuplicateAssetName(
        data.assetNameAr,
        data.assetNameEn,
        data.districtId
      );
      if (isDuplicate) {
        return res.status(400).json({ error: "Asset name already exists in this district" });
      }
      const asset = await storage.createAsset(data, "admin");

      await storage.createAuditLog({
        userId: "admin",
        actionType: "asset_created",
        entityType: "asset",
        entityId: asset.id,
        changes: { assetCode: asset.assetCode },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.status(201).json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create asset registration" });
      }
    }
  });

  app.get("/api/assets/registrations/:id", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to get asset" });
    }
  });

  app.put("/api/assets/registrations/:id", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      if (asset.status !== "draft") {
        return res.status(400).json({ error: "Can only update draft assets" });
      }

      const updated = await storage.updateAsset(req.params.id, req.body, "admin");

      await storage.createAuditLog({
        userId: "admin",
        actionType: "asset_updated",
        entityType: "asset",
        entityId: req.params.id,
        changes: req.body,
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update asset" });
    }
  });

  app.delete("/api/assets/registrations/:id", async (req, res) => {
    try {
      const success = await storage.deleteAsset(req.params.id);
      if (!success) {
        return res.status(400).json({ error: "Cannot delete asset" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "asset_deleted",
        entityType: "asset",
        entityId: req.params.id,
        changes: null,
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  app.post("/api/assets/registrations/:id/submit", async (req, res) => {
    try {
      const mode = req.body.mode as "direct" | "approval_cycle";
      if (!mode || !["direct", "approval_cycle"].includes(mode)) {
        return res.status(400).json({ error: "Invalid registration mode" });
      }

      const asset = await storage.submitAsset(req.params.id, mode);
      if (!asset) {
        return res.status(400).json({ error: "Cannot submit asset" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "asset_submitted",
        entityType: "asset",
        entityId: req.params.id,
        changes: { mode, status: asset.status },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit asset" });
    }
  });

  app.get("/api/assets/registrations/:id/history", async (req, res) => {
    try {
      const history = await storage.getAssetWorkflowHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workflow history" });
    }
  });

  app.get("/api/assets/registrations/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getAssetComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.post("/api/assets/registrations/:id/comments", async (req, res) => {
    try {
      const comment = await storage.createAssetComment({
        assetId: req.params.id,
        section: req.body.section,
        commentText: req.body.commentText,
        commenterId: "admin",
        commenterDepartment: req.body.commenterDepartment || null,
        workflowStage: req.body.workflowStage || null,
        attachments: req.body.attachments || [],
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.get("/api/assets/reviews/queue/:department", async (req, res) => {
    try {
      const department = req.params.department as WorkflowStage;
      if (!workflowStageEnum.includes(department)) {
        return res.status(400).json({ error: "Invalid department" });
      }
      const queue = await storage.getReviewQueue(department);
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: "Failed to get review queue" });
    }
  });

  app.post("/api/assets/reviews/:id/approve", async (req, res) => {
    try {
      const asset = await storage.approveAsset(req.params.id, "admin", req.body.comments);
      if (!asset) {
        return res.status(400).json({ error: "Cannot approve asset" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "asset_approved",
        entityType: "asset",
        entityId: req.params.id,
        changes: { status: asset.status, currentStage: asset.currentStage },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve asset" });
    }
  });

  app.post("/api/assets/reviews/:id/reject", async (req, res) => {
    try {
      const data = reviewActionSchema.parse({
        action: "reject",
        ...req.body,
      });

      if (!data.rejectionReason || !data.rejectionJustification) {
        return res.status(400).json({ error: "Rejection reason and justification are required" });
      }

      const asset = await storage.rejectAsset(
        req.params.id,
        "admin",
        data.rejectionReason,
        data.rejectionJustification
      );
      if (!asset) {
        return res.status(400).json({ error: "Cannot reject asset" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "asset_rejected",
        entityType: "asset",
        entityId: req.params.id,
        changes: { status: "rejected", reason: data.rejectionReason },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to reject asset" });
      }
    }
  });

  app.get("/api/assets/bank", async (req, res) => {
    try {
      const filters = assetBankFiltersSchema.parse({
        search: req.query.search as string | undefined,
        assetType: req.query.assetType as string | undefined,
        regionId: req.query.regionId as string | undefined,
        cityId: req.query.cityId as string | undefined,
        districtId: req.query.districtId as string | undefined,
        ownershipType: req.query.ownershipType as string | undefined,
        visibilityStatus: req.query.visibilityStatus as string | undefined,
        areaMin: req.query.areaMin ? parseFloat(req.query.areaMin as string) : undefined,
        areaMax: req.query.areaMax ? parseFloat(req.query.areaMax as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const result = await storage.getAssetBank(filters);
      res.json({
        ...result,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get asset bank" });
    }
  });

  app.get("/api/assets/bank/:id", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset || asset.status !== "completed") {
        return res.status(404).json({ error: "Asset not found in bank" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to get asset" });
    }
  });

  app.put("/api/assets/bank/:id/visibility", async (req, res) => {
    try {
      const data = toggleVisibilitySchema.parse(req.body);
      const asset = await storage.toggleAssetVisibility(
        req.params.id,
        data.visible,
        "admin",
        data.reason
      );
      if (!asset) {
        return res.status(400).json({ error: "Cannot toggle visibility" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "visibility_toggled",
        entityType: "asset",
        entityId: req.params.id,
        changes: { visibleToInvestors: data.visible, reason: data.reason },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to toggle visibility" });
      }
    }
  });

  app.get("/api/assets/bank/:id/visibility-history", async (req, res) => {
    try {
      const history = await storage.getAssetVisibilityHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to get visibility history" });
    }
  });

  app.get("/api/assets/bank/:id/lifecycle", async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }

      const workflowHistory = await storage.getAssetWorkflowHistory(req.params.id);
      const visibilityHistory = await storage.getAssetVisibilityHistory(req.params.id);
      const comments = await storage.getAssetComments(req.params.id);

      res.json({
        asset,
        workflowHistory,
        visibilityHistory,
        comments,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get asset lifecycle" });
    }
  });

  // ISNAD Forms API Routes
  app.get("/api/isnad/dashboard/stats", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const stats = await storage.getIsnadDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get ISNAD dashboard stats" });
    }
  });

  app.get("/api/isnad/forms", async (req, res) => {
    try {
      const filters = isnadFiltersSchema.parse({
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        stage: req.query.stage as string | undefined,
        assetId: req.query.assetId as string | undefined,
        createdBy: req.query.createdBy as string | undefined,
        assigneeId: req.query.assigneeId as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const result = await storage.getIsnadForms(filters);
      res.json({
        ...result,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get ISNAD forms" });
    }
  });

  app.post("/api/isnad/forms", async (req, res) => {
    try {
      const data = insertIsnadFormSchema.parse(req.body);
      
      const asset = await storage.getAsset(data.assetId);
      if (!asset) {
        return res.status(400).json({ error: "Asset not found" });
      }
      if (asset.hasActiveIsnad) {
        return res.status(400).json({ error: "Asset already has an active ISNAD form" });
      }
      if (asset.status !== "completed") {
        return res.status(400).json({ error: "Asset must be completed before creating ISNAD" });
      }

      const form = await storage.createIsnadForm(data, "admin");

      await storage.createAuditLog({
        userId: "admin",
        actionType: "isnad_created",
        entityType: "isnad_form",
        entityId: form.id,
        changes: { formCode: form.formCode, assetId: form.assetId },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.status(201).json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create ISNAD form" });
      }
    }
  });

  app.get("/api/isnad/forms/:id", async (req, res) => {
    try {
      const form = await storage.getIsnadForm(req.params.id);
      if (!form) {
        return res.status(404).json({ error: "ISNAD form not found" });
      }
      res.json(form);
    } catch (error) {
      res.status(500).json({ error: "Failed to get ISNAD form" });
    }
  });

  app.put("/api/isnad/forms/:id", async (req, res) => {
    try {
      const form = await storage.getIsnadForm(req.params.id);
      if (!form) {
        return res.status(404).json({ error: "ISNAD form not found" });
      }
      if (form.status !== "draft" && form.status !== "returned") {
        return res.status(400).json({ error: "Can only update draft or returned forms" });
      }

      const validatedData = updateIsnadFormSchema.parse(req.body);
      const updated = await storage.updateIsnadForm(req.params.id, validatedData);

      await storage.createAuditLog({
        userId: "admin",
        actionType: "isnad_updated",
        entityType: "isnad_form",
        entityId: req.params.id,
        changes: validatedData,
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update ISNAD form" });
      }
    }
  });

  app.post("/api/isnad/forms/:id/submit", async (req, res) => {
    try {
      const form = await storage.submitIsnadForm(req.params.id);
      if (!form) {
        return res.status(400).json({ error: "Cannot submit ISNAD form" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "isnad_submitted",
        entityType: "isnad_form",
        entityId: req.params.id,
        changes: { status: form.status, currentStage: form.currentStage },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(form);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit ISNAD form" });
    }
  });

  app.post("/api/isnad/forms/:id/review", async (req, res) => {
    try {
      const action = isnadReviewActionSchema.parse(req.body);
      const form = await storage.processIsnadAction(req.params.id, "admin", action);
      if (!form) {
        return res.status(400).json({ error: "Cannot process review action" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: `isnad_${action.action}`,
        entityType: "isnad_form",
        entityId: req.params.id,
        changes: { action: action.action, status: form.status },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process review action" });
      }
    }
  });

  app.post("/api/isnad/forms/:id/department-review", async (req, res) => {
    try {
      const { department, action, comments, rejectionJustification } = req.body;
      
      if (!department || !action) {
        return res.status(400).json({ error: "Department and action are required" });
      }

      if (!["approved", "rejected", "returned"].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be approved, rejected, or returned" });
      }

      const form = await storage.processDepartmentApproval(
        req.params.id,
        department,
        "admin",
        action,
        comments || null,
        rejectionJustification || null
      );

      if (!form) {
        return res.status(400).json({ error: "Cannot process department review" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: `isnad_department_${action}`,
        entityType: "isnad_form",
        entityId: req.params.id,
        changes: { department, action, status: form.status },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(form);
    } catch (error) {
      res.status(500).json({ error: "Failed to process department review" });
    }
  });

  app.post("/api/isnad/forms/:id/cancel", async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: "Cancellation reason is required" });
      }

      const form = await storage.cancelIsnadForm(req.params.id, "admin", reason);
      if (!form) {
        return res.status(400).json({ error: "Cannot cancel ISNAD form" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "isnad_cancelled",
        entityType: "isnad_form",
        entityId: req.params.id,
        changes: { status: "cancelled", reason },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(form);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel ISNAD form" });
    }
  });

  app.get("/api/isnad/forms/:id/approvals", async (req, res) => {
    try {
      const approvals = await storage.getIsnadApprovals(req.params.id);
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get ISNAD approvals" });
    }
  });

  app.get("/api/isnad/reviews/queue/:stage", async (req, res) => {
    try {
      const stage = req.params.stage as IsnadStage;
      if (!isnadStageEnum.includes(stage)) {
        return res.status(400).json({ error: "Invalid stage" });
      }
      const queue = await storage.getIsnadReviewQueue(stage);
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: "Failed to get ISNAD review queue" });
    }
  });

  app.get("/api/isnad/forms-for-packaging", async (_req, res) => {
    try {
      const forms = await storage.getApprovedFormsForPackaging();
      res.json(forms);
    } catch (error) {
      res.status(500).json({ error: "Failed to get forms for packaging" });
    }
  });

  // ISNAD Packages API Routes
  app.get("/api/isnad/packages/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getPackageDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get package dashboard stats" });
    }
  });

  app.get("/api/isnad/packages", async (req, res) => {
    try {
      const filters = packageFiltersSchema.parse({
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        createdBy: req.query.createdBy as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const result = await storage.getPackages(filters);
      res.json({
        ...result,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get ISNAD packages" });
    }
  });

  app.post("/api/isnad/packages", async (req, res) => {
    try {
      const data = insertPackageSchema.parse(req.body);
      const pkg = await storage.createPackage(data, "admin");

      await storage.createAuditLog({
        userId: "admin",
        actionType: "package_created",
        entityType: "isnad_package",
        entityId: pkg.id,
        changes: { packageCode: pkg.packageCode, totalAssets: pkg.totalAssets },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.status(201).json(pkg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create ISNAD package" });
      }
    }
  });

  app.get("/api/isnad/packages/:id", async (req, res) => {
    try {
      const pkg = await storage.getPackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: "Package not found" });
      }
      res.json(pkg);
    } catch (error) {
      res.status(500).json({ error: "Failed to get package" });
    }
  });

  app.put("/api/isnad/packages/:id", async (req, res) => {
    try {
      const pkg = await storage.getPackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ error: "Package not found" });
      }
      if (pkg.status !== "draft") {
        return res.status(400).json({ error: "Can only update draft packages" });
      }

      const updated = await storage.updatePackage(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update package" });
    }
  });

  app.post("/api/isnad/packages/:id/submit-ceo", async (req, res) => {
    try {
      const pkg = await storage.submitPackageToCeo(req.params.id);
      if (!pkg) {
        return res.status(400).json({ error: "Cannot submit package to CEO" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "package_submitted_ceo",
        entityType: "isnad_package",
        entityId: req.params.id,
        changes: { status: pkg.status },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(pkg);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit package to CEO" });
    }
  });

  app.post("/api/isnad/packages/:id/review-ceo", async (req, res) => {
    try {
      const action = packageReviewSchema.parse(req.body);
      const pkg = await storage.processPackageReview(req.params.id, "admin", "ceo", action);
      if (!pkg) {
        return res.status(400).json({ error: "Cannot process CEO review" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: `package_ceo_${action.action}`,
        entityType: "isnad_package",
        entityId: req.params.id,
        changes: { action: action.action, status: pkg.status },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(pkg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process CEO review" });
      }
    }
  });

  app.post("/api/isnad/packages/:id/review-minister", async (req, res) => {
    try {
      const action = packageReviewSchema.parse(req.body);
      const pkg = await storage.processPackageReview(req.params.id, "admin", "minister", action);
      if (!pkg) {
        return res.status(400).json({ error: "Cannot process Minister review" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: `package_minister_${action.action}`,
        entityType: "isnad_package",
        entityId: req.params.id,
        changes: { action: action.action, status: pkg.status },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(pkg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process Minister review" });
      }
    }
  });

  // Notifications API Routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const filters = notificationFiltersSchema.parse({
        type: req.query.type as string | undefined,
        read: req.query.read === "true" ? true : req.query.read === "false" ? false : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const userId = "admin";
      const result = await storage.getNotifications(userId, filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/read-all", async (req, res) => {
    try {
      const userId = "admin";
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // =============================================
  // Contract Management API Routes
  // =============================================

  // Investors
  app.get("/api/investors", async (_req, res) => {
    try {
      const investors = await storage.getInvestors();
      res.json(investors);
    } catch (error) {
      res.status(500).json({ error: "Failed to get investors" });
    }
  });

  app.get("/api/investors/:id", async (req, res) => {
    try {
      const investor = await storage.getInvestor(req.params.id);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.json(investor);
    } catch (error) {
      res.status(500).json({ error: "Failed to get investor" });
    }
  });

  app.post("/api/investors", async (req, res) => {
    try {
      const data = insertInvestorSchema.parse(req.body);
      const investor = await storage.createInvestor(data);

      await storage.createAuditLog({
        userId: "admin",
        actionType: "investor_create",
        entityType: "investor",
        entityId: investor.id,
        changes: { investorCode: investor.investorCode },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.status(201).json(investor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create investor" });
      }
    }
  });

  app.patch("/api/investors/:id", async (req, res) => {
    try {
      const investor = await storage.updateInvestor(req.params.id, req.body);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.json(investor);
    } catch (error) {
      res.status(500).json({ error: "Failed to update investor" });
    }
  });

  // Contracts
  app.get("/api/contracts", async (req, res) => {
    try {
      const filters = contractFiltersSchema.parse({
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        investorId: req.query.investorId as string | undefined,
        assetId: req.query.assetId as string | undefined,
        signingDateFrom: req.query.signingDateFrom as string | undefined,
        signingDateTo: req.query.signingDateTo as string | undefined,
        endDateFrom: req.query.endDateFrom as string | undefined,
        endDateTo: req.query.endDateTo as string | undefined,
        paymentStatus: req.query.paymentStatus as string | undefined,
        expiryWindow: req.query.expiryWindow ? parseInt(req.query.expiryWindow as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
      });
      const result = await storage.getContracts(filters);
      res.json({
        ...result,
        page: filters.page,
        limit: filters.limit,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to get contracts" });
      }
    }
  });

  app.get("/api/contracts/drafts", async (req, res) => {
    try {
      const drafts = await storage.getDraftContracts(req.query.createdBy as string | undefined);
      res.json(drafts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get draft contracts" });
    }
  });

  app.get("/api/contracts/dashboard", async (_req, res) => {
    try {
      const stats = await storage.getContractDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get contract dashboard stats" });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to get contract" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const data = insertContractSchema.parse(req.body);

      // Check if asset already has an active contract
      const hasActiveContract = await storage.checkAssetHasActiveContract(data.assetId);
      if (hasActiveContract) {
        return res.status(400).json({ error: "Asset already has an active contract" });
      }

      const contract = await storage.createContract(data, "admin");

      await storage.createAuditLog({
        userId: "admin",
        actionType: "contract_create",
        entityType: "contract",
        entityId: contract.id,
        changes: { contractCode: contract.contractCode },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create contract" });
      }
    }
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const data = updateContractSchema.parse(req.body);
      const contract = await storage.updateContract(req.params.id, data, "admin");
      if (!contract) {
        return res.status(404).json({ error: "Contract not found or cannot be updated" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "contract_update",
        entityType: "contract",
        entityId: contract.id,
        changes: data,
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update contract" });
      }
    }
  });

  app.post("/api/contracts/:id/activate", async (req, res) => {
    try {
      const contract = await storage.activateContract(req.params.id);
      if (!contract) {
        return res.status(400).json({ 
          error: "Cannot activate contract. Ensure signed PDF and installment plan are uploaded." 
        });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "contract_activate",
        entityType: "contract",
        entityId: contract.id,
        changes: { status: "active" },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to activate contract" });
    }
  });

  app.post("/api/contracts/:id/archive", async (req, res) => {
    try {
      const contract = await storage.archiveContract(req.params.id, "admin");
      if (!contract) {
        return res.status(400).json({ error: "Cannot archive this contract" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "contract_archive",
        entityType: "contract",
        entityId: contract.id,
        changes: { status: "archived" },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to archive contract" });
    }
  });

  app.post("/api/contracts/:id/unarchive", async (req, res) => {
    try {
      const contract = await storage.unarchiveContract(req.params.id);
      if (!contract) {
        return res.status(400).json({ error: "Cannot unarchive this contract" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "contract_unarchive",
        entityType: "contract",
        entityId: contract.id,
        changes: { status: contract.status },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to unarchive contract" });
    }
  });

  app.post("/api/contracts/:id/cancel", async (req, res) => {
    try {
      const cancellation = cancelContractSchema.parse(req.body);
      const contract = await storage.cancelContract(req.params.id, "admin", cancellation);
      if (!contract) {
        return res.status(400).json({ error: "Cannot cancel this contract" });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: "contract_cancel",
        entityType: "contract",
        entityId: contract.id,
        changes: { status: "cancelled", reason: cancellation.reason },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to cancel contract" });
      }
    }
  });

  // Installments
  app.get("/api/contracts/:contractId/installments", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const installments = await storage.getInstallments(req.params.contractId, year);
      res.json(installments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get installments" });
    }
  });

  app.post("/api/contracts/:contractId/installment-plan", async (req, res) => {
    try {
      const plan = installmentPlanSchema.parse(req.body);
      const contract = await storage.getContract(req.params.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Validate custom installment totals match contract amount
      if (plan.type === "custom" && plan.customInstallments) {
        const total = plan.customInstallments.reduce((sum, i) => sum + i.amount, 0);
        if (Math.abs(total - contract.totalContractAmount) > 0.01) {
          return res.status(400).json({ 
            error: `Installment total (${total.toFixed(2)}) must equal contract amount (${contract.totalContractAmount.toFixed(2)})` 
          });
        }
      }

      const installments = await storage.createInstallmentPlan(
        req.params.contractId,
        plan,
        contract.totalContractAmount,
        contract.startDate
      );

      await storage.createAuditLog({
        userId: "admin",
        actionType: "installment_plan_create",
        entityType: "contract",
        entityId: req.params.contractId,
        changes: { planType: plan.type, installmentCount: installments.length },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(installments);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create installment plan" });
      }
    }
  });

  app.get("/api/installments/:id", async (req, res) => {
    try {
      const installment = await storage.getInstallment(req.params.id);
      if (!installment) {
        return res.status(404).json({ error: "Installment not found" });
      }
      res.json(installment);
    } catch (error) {
      res.status(500).json({ error: "Failed to get installment" });
    }
  });

  app.patch("/api/installments/:id/status", async (req, res) => {
    try {
      const status = updateInstallmentStatusSchema.parse(req.body);
      const installment = await storage.updateInstallmentStatus(req.params.id, status, "admin");
      if (!installment) {
        return res.status(400).json({ error: "Cannot update installment. Receipt required for 'paid' status." });
      }

      await storage.createAuditLog({
        userId: "admin",
        actionType: `installment_${status.status}`,
        entityType: "installment",
        entityId: installment.id,
        changes: { status: status.status },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json(installment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update installment status" });
      }
    }
  });

  app.delete("/api/contracts/:contractId/installment-plan", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      if (contract.status !== "draft") {
        return res.status(400).json({ error: "Can only delete installment plan for draft contracts" });
      }

      await storage.deleteInstallmentPlan(req.params.contractId);

      await storage.createAuditLog({
        userId: "admin",
        actionType: "installment_plan_delete",
        entityType: "contract",
        entityId: req.params.contractId,
        changes: { action: "deleted" },
        ipAddress: req.ip ?? null,
        sessionId: null,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete installment plan" });
    }
  });

  // Update overdue installments (can be called periodically)
  app.post("/api/installments/update-overdue", async (_req, res) => {
    try {
      const count = await storage.updateOverdueInstallments();
      res.json({ updated: count });
    } catch (error) {
      res.status(500).json({ error: "Failed to update overdue installments" });
    }
  });

  // =============================================================================
  // Investor Portal API Routes
  // =============================================================================

  // Portal exposed assets (visible to investors)
  app.get("/api/portal/assets", async (req, res) => {
    try {
      const filters = portalAssetFiltersSchema.parse({
        search: req.query.search as string | undefined,
        cityId: req.query.cityId as string | undefined,
        districtId: req.query.districtId as string | undefined,
        assetType: req.query.assetType as string | undefined,
        areaMin: req.query.areaMin ? parseFloat(req.query.areaMin as string) : undefined,
        areaMax: req.query.areaMax ? parseFloat(req.query.areaMax as string) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 12,
      });
      const result = await storage.getExposedAssets(filters);
      res.json({ ...result, page: filters.page, limit: filters.limit });
    } catch (error) {
      res.status(500).json({ error: "Failed to get exposed assets" });
    }
  });

  app.get("/api/portal/assets/:id", async (req, res) => {
    try {
      const asset = await storage.getExposedAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found or not available" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to get asset" });
    }
  });

  // Investor account endpoints
  app.get("/api/portal/account", async (req, res) => {
    try {
      const ssoUserId = req.query.ssoUserId as string;
      if (!ssoUserId) {
        return res.status(400).json({ error: "SSO user ID required" });
      }
      const account = await storage.getInvestorAccountBySsoId(ssoUserId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to get account" });
    }
  });

  app.post("/api/portal/account", async (req, res) => {
    try {
      const data = insertInvestorAccountSchema.parse(req.body);
      const account = await storage.createInvestorAccount(data);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create account" });
      }
    }
  });

  // Favorites
  app.get("/api/portal/favorites", async (req, res) => {
    try {
      const investorAccountId = req.query.investorAccountId as string;
      if (!investorAccountId) {
        return res.status(400).json({ error: "Investor account ID required" });
      }
      const favorites = await storage.getFavorites(investorAccountId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });

  app.post("/api/portal/favorites", async (req, res) => {
    try {
      const { investorAccountId, assetId } = req.body;
      if (!investorAccountId || !assetId) {
        return res.status(400).json({ error: "Investor account ID and asset ID required" });
      }
      const favorite = await storage.addFavorite(investorAccountId, assetId);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/portal/favorites", async (req, res) => {
    try {
      const { investorAccountId, assetId } = req.body;
      if (!investorAccountId || !assetId) {
        return res.status(400).json({ error: "Investor account ID and asset ID required" });
      }
      await storage.removeFavorite(investorAccountId, assetId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/portal/favorites/check", async (req, res) => {
    try {
      const investorAccountId = req.query.investorAccountId as string;
      const assetId = req.query.assetId as string;
      if (!investorAccountId || !assetId) {
        return res.status(400).json({ error: "Investor account ID and asset ID required" });
      }
      const isFavorited = await storage.isFavorited(investorAccountId, assetId);
      res.json({ isFavorited });
    } catch (error) {
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  // Portal interests (investor's own interests)
  app.get("/api/portal/interests", async (req, res) => {
    try {
      const investorAccountId = req.query.investorAccountId as string;
      if (!investorAccountId) {
        return res.status(400).json({ error: "Investor account ID required" });
      }
      const interests = await storage.getMyInterests(investorAccountId);
      res.json(interests);
    } catch (error) {
      res.status(500).json({ error: "Failed to get interests" });
    }
  });

  app.post("/api/portal/interests", async (req, res) => {
    try {
      const { investorAccountId, ...interestData } = req.body;
      if (!investorAccountId) {
        return res.status(400).json({ error: "Investor account ID required" });
      }
      const data = insertInvestorInterestSchema.parse(interestData);
      const interest = await storage.createInvestorInterest(data, investorAccountId);
      res.status(201).json(interest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to submit interest" });
      }
    }
  });

  // Portal Istifada requests (investor's own requests)
  app.get("/api/portal/istifada", async (req, res) => {
    try {
      const investorAccountId = req.query.investorAccountId as string;
      if (!investorAccountId) {
        return res.status(400).json({ error: "Investor account ID required" });
      }
      const requests = await storage.getMyIstifadaRequests(investorAccountId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to get Istifada requests" });
    }
  });

  app.post("/api/portal/istifada", async (req, res) => {
    try {
      const { investorAccountId, ...requestData } = req.body;
      if (!investorAccountId) {
        return res.status(400).json({ error: "Investor account ID required" });
      }
      const data = insertIstifadaRequestSchema.parse(requestData);
      const request = await storage.createIstifadaRequest(data, investorAccountId);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to submit Istifada request" });
      }
    }
  });

  // Portal dashboard stats
  app.get("/api/portal/dashboard", async (req, res) => {
    try {
      const investorAccountId = req.query.investorAccountId as string;
      if (!investorAccountId) {
        return res.status(400).json({ error: "Investor account ID required" });
      }
      const stats = await storage.getPortalDashboardStats(investorAccountId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get portal dashboard stats" });
    }
  });

  // =============================================================================
  // Investor CRM API Routes (Admin)
  // =============================================================================

  // CRM Dashboard
  app.get("/api/crm/dashboard", async (_req, res) => {
    try {
      const stats = await storage.getCrmDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get CRM dashboard stats" });
    }
  });

  // CRM Investor accounts management
  app.get("/api/crm/investors", async (req, res) => {
    try {
      const filters = crmInvestorFiltersSchema.parse({
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        accountType: req.query.accountType as string | undefined,
        verificationStatus: req.query.verificationStatus as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const result = await storage.getInvestorAccounts(filters);
      res.json({ ...result, page: filters.page, limit: filters.limit });
    } catch (error) {
      res.status(500).json({ error: "Failed to get investor accounts" });
    }
  });

  app.get("/api/crm/investors/:id", async (req, res) => {
    try {
      const account = await storage.getInvestorAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Investor account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to get investor account" });
    }
  });

  app.patch("/api/crm/investors/:id", async (req, res) => {
    try {
      const account = await storage.updateInvestorAccount(req.params.id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Investor account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to update investor account" });
    }
  });

  app.post("/api/crm/investors/:id/block", async (req, res) => {
    try {
      const account = await storage.blockInvestorAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Investor account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to block investor account" });
    }
  });

  // CRM Investor notes
  app.get("/api/crm/investors/:id/notes", async (req, res) => {
    try {
      const notes = await storage.getInvestorNotes(req.params.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get investor notes" });
    }
  });

  app.post("/api/crm/investors/:id/notes", async (req, res) => {
    try {
      const { noteType, content, createdBy } = req.body;
      if (!noteType || !content || !createdBy) {
        return res.status(400).json({ error: "Note type, content, and created by required" });
      }
      const note = await storage.createInvestorNote(req.params.id, noteType, content, createdBy);
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create investor note" });
    }
  });

  // CRM Interest pipeline
  app.get("/api/crm/interests", async (req, res) => {
    try {
      const filters = interestFiltersSchema.parse({
        status: req.query.status as string | undefined,
        investorAccountId: req.query.investorAccountId as string | undefined,
        assetId: req.query.assetId as string | undefined,
        assignedToId: req.query.assignedToId as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const result = await storage.getInvestorInterests(filters);
      res.json({ ...result, page: filters.page, limit: filters.limit });
    } catch (error) {
      res.status(500).json({ error: "Failed to get investor interests" });
    }
  });

  app.get("/api/crm/interests/:id", async (req, res) => {
    try {
      const interest = await storage.getInvestorInterest(req.params.id);
      if (!interest) {
        return res.status(404).json({ error: "Interest not found" });
      }
      res.json(interest);
    } catch (error) {
      res.status(500).json({ error: "Failed to get interest" });
    }
  });

  app.post("/api/crm/interests/:id/review", async (req, res) => {
    try {
      const { reviewerId, ...actionData } = req.body;
      if (!reviewerId) {
        return res.status(400).json({ error: "Reviewer ID required" });
      }
      const action = interestReviewActionSchema.parse(actionData);
      const interest = await storage.processInterestReview(req.params.id, reviewerId, action);
      if (!interest) {
        return res.status(404).json({ error: "Interest not found" });
      }
      res.json(interest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process interest review" });
      }
    }
  });

  // CRM Istifada requests management
  app.get("/api/crm/istifada", async (req, res) => {
    try {
      const filters = istifadaFiltersSchema.parse({
        status: req.query.status as string | undefined,
        programType: req.query.programType as string | undefined,
        investorAccountId: req.query.investorAccountId as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      });
      const result = await storage.getIstifadaRequests(filters);
      res.json({ ...result, page: filters.page, limit: filters.limit });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Istifada requests" });
    }
  });

  app.get("/api/crm/istifada/:id", async (req, res) => {
    try {
      const request = await storage.getIstifadaRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Istifada request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to get Istifada request" });
    }
  });

  app.post("/api/crm/istifada/:id/review", async (req, res) => {
    try {
      const { reviewerId, ...actionData } = req.body;
      if (!reviewerId) {
        return res.status(400).json({ error: "Reviewer ID required" });
      }
      const action = istifadaReviewActionSchema.parse(actionData);
      const request = await storage.processIstifadaReview(req.params.id, reviewerId, action);
      if (!request) {
        return res.status(404).json({ error: "Istifada request not found" });
      }
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process Istifada review" });
      }
    }
  });

  // Most favorited assets (for CRM analytics)
  app.get("/api/crm/analytics/most-favorited", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const mostFavorited = await storage.getMostFavoritedAssets(limit);
      res.json(mostFavorited);
    } catch (error) {
      res.status(500).json({ error: "Failed to get most favorited assets" });
    }
  });

  return httpServer;
}
