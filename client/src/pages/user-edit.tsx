import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight,
  Mail,
  Building2,
  Briefcase,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  UserWithDetails,
  Organization,
  WorkUnit,
  Role,
} from "@/lib/schema";
import { userStatusEnum } from "@/lib/schema";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  organizationId: z.string().min(1, "Please select an organization"),
  workUnitId: z.string().min(1, "Please select a work unit"),
  roleId: z.string().nullable(),
  status: z.enum(userStatusEnum),
});

type FormValues = z.infer<typeof formSchema>;

export default function UserEdit() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const userId = params.id;

  const { data: user, isLoading: userLoading } = useQuery<UserWithDetails>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      organizationId: "",
      workUnitId: "",
      roleId: null,
      status: "active",
    },
  });

  const selectedOrgId = form.watch("organizationId");
  const effectiveOrgId = selectedOrgId || user?.organizationId || "";

  const { data: workUnits } = useQuery<WorkUnit[]>({
    queryKey: [`/api/work-units?organizationId=${effectiveOrgId}`],
    enabled: !!effectiveOrgId,
  });

  useEffect(() => {
    if (user && workUnits && roles && organizations) {
      form.reset({
        email: user.email,
        organizationId: user.organizationId,
        workUnitId: user.workUnitId,
        roleId: user.roleId,
        status: user.status,
      });
    }
  }, [user, workUnits, roles, organizations, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("PUT", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/users")
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "User Updated",
        description: "The user has been updated successfully.",
      });
      navigate("/users");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    updateUserMutation.mutate(data);
  };

  const isDataLoading = userLoading || !workUnits || !roles || !organizations;

  if (isDataLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">User not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/users")}>
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/users" className="hover:text-foreground">User Management</a>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Edit User</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Edit User</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </div>
        <StatusBadge status={user.status} />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          className="pl-9"
                          disabled
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
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
                    <FormLabel>Work Unit</FormLabel>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Role & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Role</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v || null)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="active" id="status-active" data-testid="radio-status-active" />
                          <Label htmlFor="status-active" className="cursor-pointer">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inactive" id="status-inactive" data-testid="radio-status-inactive" />
                          <Label htmlFor="status-inactive" className="cursor-pointer">Inactive</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pending" id="status-pending" data-testid="radio-status-pending" />
                          <Label htmlFor="status-pending" className="cursor-pointer">Pending</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isPending}
              data-testid="button-save-user"
            >
              {updateUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
