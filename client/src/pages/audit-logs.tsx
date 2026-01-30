import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserMinus,
  Edit,
  Shield,
  LogIn,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditLog } from "@/lib/schema";

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const actionTypeConfig: Record<string, { icon: typeof UserPlus; color: string; label: string }> = {
  user_create: { icon: UserPlus, color: "bg-green-500", label: "User Created" },
  user_update: { icon: Edit, color: "bg-blue-500", label: "User Updated" },
  user_delete: { icon: UserMinus, color: "bg-red-500", label: "User Deleted" },
  user_deactivate: { icon: UserMinus, color: "bg-orange-500", label: "User Deactivated" },
  role_create: { icon: Shield, color: "bg-green-500", label: "Role Created" },
  role_update: { icon: Edit, color: "bg-blue-500", label: "Role Updated" },
  role_delete: { icon: Shield, color: "bg-red-500", label: "Role Deleted" },
  permission_assign: { icon: Shield, color: "bg-purple-500", label: "Permission Assigned" },
  permission_revoke: { icon: Shield, color: "bg-orange-500", label: "Permission Revoked" },
  login_success: { icon: LogIn, color: "bg-green-500", label: "Login Success" },
  login_failed: { icon: LogIn, color: "bg-red-500", label: "Login Failed" },
};

function AuditLogItem({ log }: { log: AuditLog }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = actionTypeConfig[log.actionType] || {
    icon: Clock,
    color: "bg-gray-500",
    label: log.actionType.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
  };
  const Icon = config.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-start gap-4 py-4 border-b last:border-0">
        <div className="relative">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${config.color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="absolute left-1/2 top-full h-full w-0.5 -translate-x-1/2 bg-border" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{config.label}</span>
              <Badge variant="outline" className="text-xs">
                {log.entityType}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Entity ID: {log.entityId ? log.entityId.slice(0, 8) + "..." : "N/A"}
          </p>
          {log.changes && Object.keys(log.changes).length > 0 && (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-xs"
                data-testid={`button-expand-log-${log.id}`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" />
                    View Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          )}
          <CollapsibleContent>
            <div className="mt-3 rounded-md bg-muted/50 p-3">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </div>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
}

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 25;

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (actionFilter && actionFilter !== "all") queryParams.set("actionType", actionFilter);
  if (entityFilter && entityFilter !== "all") queryParams.set("entityType", entityFilter);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  const queryString = queryParams.toString();

  const { data: logsData, isLoading } = useQuery<AuditLogsResponse>({
    queryKey: ["/api/audit-logs", queryString],
    queryFn: () => fetch(`/api/audit-logs?${queryString}`).then((r) => r.json()),
  });

  const logs = logsData?.logs ?? [];
  const total = logsData?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all system activities and changes
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-logs">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                data-testid="input-search-logs"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]" data-testid="select-action-filter">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user_create">User Create</SelectItem>
                <SelectItem value="user_update">User Update</SelectItem>
                <SelectItem value="user_delete">User Delete</SelectItem>
                <SelectItem value="role_create">Role Create</SelectItem>
                <SelectItem value="role_update">Role Update</SelectItem>
                <SelectItem value="role_delete">Role Delete</SelectItem>
                <SelectItem value="login_success">Login Success</SelectItem>
                <SelectItem value="login_failed">Login Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]" data-testid="select-entity-filter">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="role">Roles</SelectItem>
                <SelectItem value="permission">Permissions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4">
            {isLoading ? (
              <div className="space-y-4 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : logs.length > 0 ? (
              <div className="divide-y-0">
                {logs.map((log) => (
                  <AuditLogItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No Audit Logs</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Activity logs will appear here as actions are performed
                </p>
              </div>
            )}
          </div>
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t p-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} of {total} entries
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
