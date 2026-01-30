import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Clock, Shield, Activity } from "lucide-react";
import type { DashboardStats, AuditLog } from "@/lib/schema";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// Memoized stat card component to prevent unnecessary re-renders
interface StatCardProps {
  title: string;
  value: number | string;
  icon: typeof Users;
  description?: string;
  isLoading?: boolean;
}

const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: StatCardProps) {
  const cardId = useMemo(() => `stat-${title.toLowerCase().replace(/\s+/g, "-")}`, [title]);

  return (
    <Card role="region" aria-labelledby={`${cardId}-title`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle id={`${cardId}-title`} className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" aria-label="Loading value" />
        ) : (
          <div
            className="text-2xl font-semibold"
            data-testid={cardId}
            aria-live="polite"
          >
            {value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
});

// Helper functions moved outside component to avoid recreation
const getActionColor = (actionType: string): string => {
  if (actionType.includes("create")) return "bg-green-500";
  if (actionType.includes("update")) return "bg-blue-500";
  if (actionType.includes("delete")) return "bg-red-500";
  if (actionType.includes("login")) return "bg-purple-500";
  return "bg-gray-500";
};

const getActionLabel = (actionType: string): string => {
  return actionType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Memoized activity item component
interface ActivityItemProps {
  log: AuditLog;
  locale: string;
}

const ActivityItem = memo(function ActivityItem({ log, locale }: ActivityItemProps) {
  const dateLocale = locale === "ar" ? ar : enUS;
  const formattedDate = useMemo(
    () => formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: dateLocale }),
    [log.createdAt, dateLocale]
  );

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getActionColor(log.actionType)}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-start">
          {getActionLabel(log.actionType)}
        </p>
        <p className="text-xs text-muted-foreground text-start">
          {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
        {formattedDate}
      </span>
    </div>
  );
});

export default function Dashboard() {
  const { t, i18n } = useTranslation(["pages", "common"]);
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="space-y-6" role="region" aria-labelledby="dashboard-title">
      <header>
        <h1 id="dashboard-title" className="text-2xl font-semibold" data-testid="text-page-title">{t("pages:dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("pages:dashboard.overview")}
        </p>
      </header>

      <section aria-label={t("pages:dashboard.statistics", { defaultValue: "Statistics" })} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("pages:dashboard.totalUsers")}
          value={stats?.totalUsers ?? 0}
          icon={Users}
          description={t("pages:dashboard.registeredInSystem", { defaultValue: "Registered in the system" })}
          isLoading={isLoading}
        />
        <StatCard
          title={t("pages:dashboard.activeUsers", { defaultValue: "Active Users" })}
          value={stats?.activeUsers ?? 0}
          icon={UserCheck}
          description={t("pages:dashboard.currentlyActive", { defaultValue: "Currently active" })}
          isLoading={isLoading}
        />
        <StatCard
          title={t("pages:dashboard.pendingActivation", { defaultValue: "Pending Activation" })}
          value={stats?.pendingUsers ?? 0}
          icon={Clock}
          description={t("pages:dashboard.awaitingFirstLogin", { defaultValue: "Awaiting first login" })}
          isLoading={isLoading}
        />
        <StatCard
          title={t("pages:dashboard.totalRoles", { defaultValue: "Total Roles" })}
          value={stats?.totalRoles ?? 0}
          icon={Shield}
          description={t("pages:dashboard.definedInSystem", { defaultValue: "Defined in the system" })}
          isLoading={isLoading}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card role="region" aria-labelledby="recent-activity-title">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle id="recent-activity-title" as="h2" className="text-lg font-semibold">{t("pages:dashboard.recentActivity")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                  <ActivityItem key={log.id} log={log} locale={i18n.language} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("pages:dashboard.noRecentActivity", { defaultValue: "No recent activity" })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card role="region" aria-labelledby="quick-actions-title">
          <CardHeader className="pb-4">
            <CardTitle id="quick-actions-title" as="h2" className="text-lg font-semibold">{t("pages:dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <a
              href="/users/create"
              className="flex items-center gap-3 rounded-md border p-4 hover-elevate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              data-testid="link-quick-create-user"
              aria-label={t("pages:dashboard.createNewUser", { defaultValue: "Create New User" })}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10" aria-hidden="true">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-start">
                <p className="text-sm font-medium">{t("pages:dashboard.createNewUser", { defaultValue: "Create New User" })}</p>
                <p className="text-xs text-muted-foreground">
                  {t("pages:dashboard.addUserToSystem", { defaultValue: "Add a new user to the system" })}
                </p>
              </div>
            </a>
            <a
              href="/roles"
              className="flex items-center gap-3 rounded-md border p-4 hover-elevate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              data-testid="link-quick-manage-roles"
              aria-label={t("pages:dashboard.manageRoles", { defaultValue: "Manage Roles" })}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10" aria-hidden="true">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="text-start">
                <p className="text-sm font-medium">{t("pages:dashboard.manageRoles", { defaultValue: "Manage Roles" })}</p>
                <p className="text-xs text-muted-foreground">
                  {t("pages:dashboard.configureRolesPermissions", { defaultValue: "Configure roles and permissions" })}
                </p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
