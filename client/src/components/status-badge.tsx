import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: UserStatus;
}

const statusConfig: Record<UserStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  pending: { label: "Pending", variant: "outline" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant={config.variant}
      className={
        status === "active"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : status === "pending"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          : ""
      }
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
