import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Shield, Users, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Role } from "@/lib/schema";

interface RoleWithUsage extends Role {
  userCount: number;
}

export default function RolesList() {
  const { t } = useTranslation(["pages", "common"]);
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithUsage | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  const { data: roles, isLoading } = useQuery<RoleWithUsage[]>({
    queryKey: ["/api/roles"],
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return apiRequest("POST", "/api/roles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setCreateDialogOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      toast({
        title: t("pages:roles.roleCreated"),
        description: t("pages:roles.roleCreatedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common:error"),
        description: t("pages:roles.createError"),
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description: string } }) => {
      return apiRequest("PUT", `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setEditDialogOpen(false);
      setSelectedRole(null);
      toast({
        title: t("pages:roles.roleUpdated"),
        description: t("pages:roles.roleUpdatedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common:error"),
        description: t("pages:roles.updateError"),
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setDeleteDialogOpen(false);
      setSelectedRole(null);
      toast({
        title: t("pages:roles.roleDeleted"),
        description: t("pages:roles.roleDeletedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common:error"),
        description: t("pages:roles.deleteError"),
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = () => {
    if (newRoleName.trim()) {
      createRoleMutation.mutate({
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
      });
    }
  };

  const handleEditRole = () => {
    if (selectedRole && newRoleName.trim()) {
      updateRoleMutation.mutate({
        id: selectedRole.id,
        data: {
          name: newRoleName.trim(),
          description: newRoleDescription.trim(),
        },
      });
    }
  };

  const openEditDialog = (role: RoleWithUsage) => {
    setSelectedRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || "");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (role: RoleWithUsage) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">{t("pages:roles.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pages:roles.subtitle")}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-role">
          <Plus className="me-2 h-4 w-4" />
          {t("pages:roles.addRole")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : roles && roles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="group" data-testid={`card-role-${role.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    {role.isSystemRole && (
                      <Badge variant="secondary" className="mt-1">
                        {t("pages:roles.systemRole")}
                      </Badge>
                    )}
                  </div>
                </div>
                {!role.isSystemRole && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                        data-testid={`button-role-actions-${role.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(role)}>
                        <Edit className="me-2 h-4 w-4" />
                        {t("pages:roles.editRole")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openDeleteDialog(role)}
                        disabled={role.userCount > 0}
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {t("pages:roles.deleteRole")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {role.description || t("pages:roles.noDescription")}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{t("pages:roles.usersCount", { count: role.userCount })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("pages:roles.noRolesFound")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("pages:roles.createFirstRole")}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              {t("pages:roles.addRole")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages:roles.addRole")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">{t("pages:roles.roleName")}</Label>
              <Input
                id="roleName"
                placeholder={t("pages:roles.enterRoleName")}
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                data-testid="input-role-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">{t("common:description")}</Label>
              <Textarea
                id="roleDescription"
                placeholder={t("pages:roles.describeRole")}
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                data-testid="input-role-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t("common:cancel")}
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || createRoleMutation.isPending}
              data-testid="button-confirm-create-role"
            >
              {createRoleMutation.isPending ? t("common:loading") : t("pages:roles.addRole")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages:roles.editRole")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editRoleName">{t("pages:roles.roleName")}</Label>
              <Input
                id="editRoleName"
                placeholder={t("pages:roles.enterRoleName")}
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                data-testid="input-edit-role-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoleDescription">{t("common:description")}</Label>
              <Textarea
                id="editRoleDescription"
                placeholder={t("pages:roles.describeRole")}
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                data-testid="input-edit-role-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("common:cancel")}
            </Button>
            <Button
              onClick={handleEditRole}
              disabled={!newRoleName.trim() || updateRoleMutation.isPending}
              data-testid="button-confirm-edit-role"
            >
              {updateRoleMutation.isPending ? t("common:loading") : t("common:save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages:roles.deleteRole")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {t("pages:roles.confirmDelete")} "{selectedRole?.name}"? {t("pages:roles.confirmDeleteDesc")}
            </p>
            {selectedRole && selectedRole.userCount > 0 && (
              <p className="text-sm text-destructive mt-2">
                {t("pages:roles.roleInUse", { count: selectedRole.userCount })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common:cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRole && deleteRoleMutation.mutate(selectedRole.id)}
              disabled={deleteRoleMutation.isPending || (selectedRole?.userCount ?? 0) > 0}
              data-testid="button-confirm-delete-role"
            >
              {deleteRoleMutation.isPending ? t("common:loading") : t("pages:roles.deleteRole")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
