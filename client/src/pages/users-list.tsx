import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, MoreHorizontal, Mail, Edit, UserX, Trash2, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserWithDetails, Organization, Role, UserStatus } from "@shared/schema";
import { format } from "date-fns";

interface UsersResponse {
  users: UserWithDetails[];
  total: number;
  page: number;
  limit: number;
}

export default function UsersList() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const usersQueryParams = new URLSearchParams();
  if (search) usersQueryParams.set("search", search);
  if (statusFilter && statusFilter !== "all") usersQueryParams.set("status", statusFilter);
  if (orgFilter && orgFilter !== "all") usersQueryParams.set("organizationId", orgFilter);
  usersQueryParams.set("page", String(page));
  const usersQueryString = usersQueryParams.toString();

  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: [`/api/users?${usersQueryString}`],
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/resend-invitation`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "The invitation email has been resent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/users")
      });
      toast({
        title: "User Deactivated",
        description: "The user has been deactivated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const users = usersData?.users ?? [];
  const total = usersData?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelect = (userId: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUsers(newSet);
  };

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return "Custom Permissions";
    const role = roles?.find((r) => r.id === roleId);
    return role?.name ?? "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <Link href="/users/create">
          <Button data-testid="button-create-user">
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={(v) => { setOrgFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]" data-testid="select-org-filter">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" data-testid="button-export">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={users.length > 0 && selectedUsers.size === users.length}
                    onCheckedChange={toggleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Email</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Organization</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Work Unit</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Role</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Last Login</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserX className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No users found</p>
                      <Link href="/users/create">
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Create First User
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="group" data-testid={`row-user-${user.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                        data-testid={`checkbox-user-${user.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-email-${user.id}`}>
                      {user.email}
                    </TableCell>
                    <TableCell>{user.organization?.name ?? "-"}</TableCell>
                    <TableCell>{user.workUnit?.name ?? "-"}</TableCell>
                    <TableCell>
                      <span className={user.hasCustomPermissions ? "text-muted-foreground italic" : ""}>
                        {getRoleName(user.roleId)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100"
                            data-testid={`button-actions-${user.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${user.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </Link>
                          </DropdownMenuItem>
                          {user.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => resendInvitationMutation.mutate(user.id)}
                              disabled={resendInvitationMutation.isPending}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invitation
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deactivateUserMutation.mutate(user.id)}
                            disabled={deactivateUserMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t p-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} of {total} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
