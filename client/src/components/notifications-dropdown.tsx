import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, Clock, AlertTriangle, CheckCircle2, Info, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/lib/schema";

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

const typeIcons: Record<string, typeof Bell> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: X,
  action_required: Bell,
  sla_warning: Clock,
  sla_urgent: AlertTriangle,
};

const typeColors: Record<string, string> = {
  info: "text-blue-500",
  warning: "text-yellow-500",
  success: "text-green-500",
  error: "text-red-500",
  action_required: "text-primary",
  sla_warning: "text-orange-500",
  sla_urgent: "text-red-500",
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery<NotificationsResponse>({
    queryKey: ["/api/notifications"],
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PUT", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
              aria-hidden="true"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between gap-4 p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive opacity-70" />
              <p className="text-sm text-muted-foreground mb-3">
                Failed to load notifications
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                data-testid="button-retry-notifications"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 20).map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover-elevate cursor-pointer ${
                      !notification.read ? "bg-muted/50" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsReadMutation.mutate(notification.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !notification.read) {
                        e.preventDefault();
                        markAsReadMutation.mutate(notification.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${notification.title}${!notification.read ? ', unread' : ''}`}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="flex gap-3">
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          typeColors[notification.type] || "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            !notification.read ? "font-medium" : ""
                          }`}
                        >
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(new Date(notification.createdAt))}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
