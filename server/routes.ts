import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertRoleSchema, userFiltersSchema } from "@shared/schema";
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

  return httpServer;
}
