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

  return httpServer;
}
