import { Badge } from "@/components/ui/badge";
import type { AccessLevel } from "@shared/schema";
import { accessLevelLabels } from "@shared/schema";

interface AccessLevelBadgeProps {
  level: AccessLevel;
  size?: "sm" | "default";
}

const levelColors: Record<AccessLevel, string> = {
  viewer: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  editor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  approver: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  full_access: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export function AccessLevelBadge({ level, size = "default" }: AccessLevelBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${levelColors[level]} ${size === "sm" ? "text-xs px-2 py-0.5" : ""}`}
      data-testid={`badge-access-level-${level}`}
    >
      {accessLevelLabels[level]}
    </Badge>
  );
}
