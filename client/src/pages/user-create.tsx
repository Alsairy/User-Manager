import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  ChevronRight,
  Info,
  Mail,
  Building2,
  Briefcase,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AccessLevelBadge } from "@/components/access-level-badge";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  Organization,
  WorkUnit,
  Role,
  Permission,
  AccessLevel,
  PermissionGroup,
} from "@shared/schema";
import {
  insertUserSchema,
  permissionGroups,
  permissionGroupLabels,
  accessLevelLabels,
  accessLevelEnum,
} from "@shared/schema";

const steps = [
  { id: 1, name: "Basic Info", icon: Mail },
  { id: 2, name: "Role Assignment", icon: Shield },
  { id: 3, name: "Permissions", icon: Briefcase },
  { id: 4, name: "Summary", icon: Check },
];

const formSchema = insertUserSchema.extend({
  email: z.string().email("Please enter a valid email address"),
  organizationId: z.string().min(1, "Please select an organization"),
  workUnitId: z.string().min(1, "Please select a work unit"),
  assignmentType: z.enum(["role", "custom"]),
  roleId: z.string().nullable(),
  sendInvitation: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface PermissionAssignment {
  permissionId: string;
  accessLevel: AccessLevel;
}

export default function UserCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<PermissionGroup>>(new Set());
  const [customPermissions, setCustomPermissions] = useState<Map<string, PermissionAssignment>>(new Map());
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      organizationId: "",
      workUnitId: "",
      assignmentType: "role",
      roleId: null,
      hasCustomPermissions: false,
      status: "active",
      sendInvitation: true,
    },
  });

  const selectedOrgId = form.watch("organizationId");
  const assignmentType = form.watch("assignmentType");
  const selectedRoleId = form.watch("roleId");

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: workUnits } = useQuery<WorkUnit[]>({
    queryKey: [`/api/work-units?organizationId=${selectedOrgId}`],
    enabled: !!selectedOrgId,
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        email: data.email,
        organizationId: data.organizationId,
        workUnitId: data.workUnitId,
        roleId: data.assignmentType === "role" ? data.roleId : null,
        hasCustomPermissions: data.assignmentType === "custom",
        status: data.status,
        customPermissions:
          data.assignmentType === "custom"
            ? Array.from(customPermissions.values())
            : [],
        sendInvitation: data.sendInvitation,
      };
      return apiRequest("POST", "/api/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/users")
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "User Created",
        description: "The user has been created successfully.",
      });
      navigate("/users");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkEmailAvailability = async (email: string) => {
    if (!email || !z.string().email().safeParse(email).success) {
      setEmailAvailable(null);
      return;
    }
    setEmailChecking(true);
    try {
      const res = await fetch(`/api/users/validate-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setEmailAvailable(data.available);
    } catch {
      setEmailAvailable(null);
    } finally {
      setEmailChecking(false);
    }
  };

  const toggleGroup = (group: PermissionGroup) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleGroupPermissions = (group: PermissionGroup, enabled: boolean) => {
    const groupPerms = permissions?.filter((p) => p.processGroup === group) ?? [];
    const newPermissions = new Map(customPermissions);
    
    if (enabled) {
      groupPerms.forEach((p) => {
        if (!newPermissions.has(p.id)) {
          newPermissions.set(p.id, { permissionId: p.id, accessLevel: "viewer" });
        }
      });
    } else {
      groupPerms.forEach((p) => {
        newPermissions.delete(p.id);
      });
    }
    setCustomPermissions(newPermissions);
  };

  const setPermissionLevel = (permissionId: string, level: AccessLevel) => {
    const newPermissions = new Map(customPermissions);
    newPermissions.set(permissionId, { permissionId, accessLevel: level });
    setCustomPermissions(newPermissions);
  };

  const removePermission = (permissionId: string) => {
    const newPermissions = new Map(customPermissions);
    newPermissions.delete(permissionId);
    setCustomPermissions(newPermissions);
  };

  const isGroupEnabled = (group: PermissionGroup) => {
    const groupPerms = permissions?.filter((p) => p.processGroup === group) ?? [];
    return groupPerms.some((p) => customPermissions.has(p.id));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      const email = form.getValues("email");
      const orgId = form.getValues("organizationId");
      const workUnitId = form.getValues("workUnitId");
      return email && orgId && workUnitId && emailAvailable !== false;
    }
    if (currentStep === 2) {
      return true;
    }
    if (currentStep === 3) {
      if (assignmentType === "role") {
        return !!selectedRoleId;
      }
      return customPermissions.size > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    form.handleSubmit((data) => createUserMutation.mutate(data))();
  };

  const getSelectedRole = () => {
    return roles?.find((r) => r.id === selectedRoleId);
  };

  const getOrganization = () => {
    return organizations?.find((o) => o.id === form.getValues("organizationId"));
  };

  const getWorkUnit = () => {
    return workUnits?.find((w) => w.id === form.getValues("workUnitId"));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/users" className="hover:text-foreground">User Management</a>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Create User</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Create New User</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new user to the system with role or custom permissions
        </p>
      </div>

      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-background text-muted-foreground"
                }`}
                data-testid={`step-indicator-${step.id}`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <span
                className={`ml-3 text-sm font-medium ${
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 w-16 ${
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email Address <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="user@example.com"
                            className="pl-9"
                            onChange={(e) => {
                              field.onChange(e);
                              checkEmailAvailability(e.target.value);
                            }}
                            data-testid="input-email"
                          />
                          {emailChecking && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                            </div>
                          )}
                          {!emailChecking && emailAvailable === true && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          )}
                          {!emailChecking && emailAvailable === false && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive">
                              Already exists
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Organization <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("workUnitId", "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-organization">
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select an organization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizations?.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workUnitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Work Unit <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedOrgId}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-work-unit">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder={selectedOrgId ? "Select a work unit" : "Select organization first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workUnits?.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Role Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="assignmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="space-y-4"
                        >
                          <div className="flex items-start space-x-3 rounded-md border p-4 hover-elevate">
                            <RadioGroupItem value="role" id="role" className="mt-1" data-testid="radio-predefined-role" />
                            <div className="flex-1">
                              <Label htmlFor="role" className="font-medium cursor-pointer">
                                Predefined Role
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Assign a predefined role with preset permissions
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 rounded-md border p-4 hover-elevate">
                            <RadioGroupItem value="custom" id="custom" className="mt-1" data-testid="radio-custom-permissions" />
                            <div className="flex-1">
                              <Label htmlFor="custom" className="font-medium cursor-pointer">
                                Custom Permissions
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Configure specific permissions for this user
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {assignmentType === "role" && (
                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Role</FormLabel>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-role">
                              <SelectValue placeholder="Choose a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center gap-2">
                                  <span>{role.name}</span>
                                  {role.isSystemRole && (
                                    <span className="text-xs text-muted-foreground">(System)</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {getSelectedRole() && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {getSelectedRole()?.description}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5" />
                    {assignmentType === "role" ? "Role Permissions Preview" : "Configure Permissions"}
                  </CardTitle>
                  {assignmentType === "custom" && (
                    <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-help">
                          <Info className="mr-2 h-4 w-4" />
                          Help
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>How to Configure Permissions</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</div>
                            <div>
                              <p className="font-medium">Select Permission Group</p>
                              <p className="text-sm text-muted-foreground">Toggle the switch to enable a group</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</div>
                            <div>
                              <p className="font-medium">Expand Permission Area</p>
                              <p className="text-sm text-muted-foreground">Click the group to see individual permissions</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</div>
                            <div>
                              <p className="font-medium">Choose Access Level</p>
                              <p className="text-sm text-muted-foreground">Select Viewer, Editor, Approver, or Full Access</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">4</div>
                            <div>
                              <p className="font-medium">Review and Confirm</p>
                              <p className="text-sm text-muted-foreground">Check your selections in the summary</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {assignmentType === "role" ? (
                  <div className="space-y-4">
                    {getSelectedRole() ? (
                      <div className="rounded-md border p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">{getSelectedRole()?.name}</h3>
                          {getSelectedRole()?.isSystemRole && (
                            <StatusBadge status="active" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {getSelectedRole()?.description}
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          Permissions for this role are predefined and cannot be modified here.
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Please select a role in the previous step.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {permissionGroups.map((group) => (
                      <Collapsible
                        key={group}
                        open={expandedGroups.has(group)}
                        onOpenChange={() => toggleGroup(group)}
                      >
                        <div className="rounded-md border">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={isGroupEnabled(group)}
                                onCheckedChange={(checked) => toggleGroupPermissions(group, checked)}
                                data-testid={`switch-group-${group}`}
                              />
                              <span className="font-medium">{permissionGroupLabels[group]}</span>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon">
                                {expandedGroups.has(group) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                              {permissions
                                ?.filter((p) => p.processGroup === group)
                                .map((permission) => (
                                  <div
                                    key={permission.id}
                                    className="flex items-center justify-between gap-4 pl-8"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        checked={customPermissions.has(permission.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setPermissionLevel(permission.id, "viewer");
                                          } else {
                                            removePermission(permission.id);
                                          }
                                        }}
                                        data-testid={`checkbox-permission-${permission.id}`}
                                      />
                                      <div>
                                        <p className="text-sm">{permission.permissionArea}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {permission.description}
                                        </p>
                                      </div>
                                    </div>
                                    {customPermissions.has(permission.id) && (
                                      <Select
                                        value={customPermissions.get(permission.id)?.accessLevel}
                                        onValueChange={(v) =>
                                          setPermissionLevel(permission.id, v as AccessLevel)
                                        }
                                      >
                                        <SelectTrigger className="w-[140px]" data-testid={`select-access-level-${permission.id}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {accessLevelEnum.map((level) => (
                                            <SelectItem key={level} value={level}>
                                              {accessLevelLabels[level]}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                    {customPermissions.size === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Enable at least one permission group to continue
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Check className="h-5 w-5" />
                  Summary & Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium" data-testid="summary-email">{form.getValues("email")}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Organization</Label>
                      <p className="font-medium">{getOrganization()?.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Work Unit</Label>
                      <p className="font-medium">{getWorkUnit()?.name}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Assignment Type</Label>
                      <p className="font-medium">
                        {assignmentType === "role" ? "Predefined Role" : "Custom Permissions"}
                      </p>
                    </div>
                    {assignmentType === "role" && getSelectedRole() && (
                      <div>
                        <Label className="text-muted-foreground">Role</Label>
                        <p className="font-medium">{getSelectedRole()?.name}</p>
                      </div>
                    )}
                    {assignmentType === "custom" && (
                      <div>
                        <Label className="text-muted-foreground">Custom Permissions</Label>
                        <p className="font-medium">{customPermissions.size} permissions assigned</p>
                      </div>
                    )}
                  </div>
                </div>

                {assignmentType === "custom" && customPermissions.size > 0 && (
                  <div className="rounded-md border p-4">
                    <Label className="text-muted-foreground mb-3 block">Assigned Permissions</Label>
                    <div className="space-y-2">
                      {Array.from(customPermissions.values()).map((cp) => {
                        const perm = permissions?.find((p) => p.id === cp.permissionId);
                        return perm ? (
                          <div key={cp.permissionId} className="flex items-center justify-between gap-2">
                            <span className="text-sm">{perm.permissionArea}</span>
                            <AccessLevelBadge level={cp.accessLevel} size="sm" />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 rounded-md bg-muted/50">
                  <Checkbox
                    id="sendInvitation"
                    checked={form.watch("sendInvitation")}
                    onCheckedChange={(checked) =>
                      form.setValue("sendInvitation", checked === true)
                    }
                    data-testid="checkbox-send-invitation"
                  />
                  <Label htmlFor="sendInvitation" className="cursor-pointer">
                    Send invitation email to user
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="button-back"
            >
              Back
            </Button>
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                data-testid="button-next"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createUserMutation.isPending}
                data-testid="button-create-user"
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
