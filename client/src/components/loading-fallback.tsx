import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  variant?: "page" | "card" | "table" | "minimal";
  message?: string;
}

export function LoadingFallback({
  variant = "page",
  message = "Loading..."
}: LoadingFallbackProps) {
  if (variant === "minimal") {
    return (
      <div
        className="flex items-center justify-center p-8"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card role="status" aria-live="polite" aria-label={message}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <span className="sr-only">{message}</span>
      </Card>
    );
  }

  if (variant === "table") {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-lg border">
          <div className="border-b p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b last:border-b-0 p-4">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  // Default: page variant
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

export default LoadingFallback;
