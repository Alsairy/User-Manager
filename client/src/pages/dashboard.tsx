import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Clock, Shield, Activity } from "lucide-react";
import type { DashboardStats, AuditLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: typeof Users;
  description?: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-semibold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({ log }: { log: AuditLog }) {
  const getActionColor = (actionType: string) => {
    if (actionType.includes("create")) return "bg-green-500";
    if (actionType.includes("update")) return "bg-blue-500";
    if (actionType.includes("delete")) return "bg-red-500";
    if (actionType.includes("login")) return "bg-purple-500";
    return "bg-gray-500";
  };

  const getActionLabel = (actionType: string) => {
    return actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-1.5 h-2 w-2 rounded-full ${getActionColor(log.actionType)}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {getActionLabel(log.actionType)}
        </p>
        <p className="text-xs text-muted-foreground">
          {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your user management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          description="Registered in the system"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={UserCheck}
          description="Currently active"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Activation"
          value={stats?.pendingUsers ?? 0}
          icon={Clock}
          description="Awaiting first login"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Roles"
          value={stats?.totalRoles ?? 0}
          icon={Shield}
          description="Defined in the system"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="divide-y">
                {stats.recentActivity.map((log) => (
                  <ActivityItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No recent activity
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <a
              href="/users/create"
              className="flex items-center gap-3 rounded-md border p-4 hover-elevate"
              data-testid="link-quick-create-user"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Create New User</p>
                <p className="text-xs text-muted-foreground">
                  Add a new user to the system
                </p>
              </div>
            </a>
            <a
              href="/roles"
              className="flex items-center gap-3 rounded-md border p-4 hover-elevate"
              data-testid="link-quick-manage-roles"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Manage Roles</p>
                <p className="text-xs text-muted-foreground">
                  Configure roles and permissions
                </p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
