import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Plus, Building2, Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { IstifadaRequestWithDetails } from "@/lib/schema";

const DEMO_INVESTOR_ACCOUNT_ID = "demo-investor-001";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "secondary" },
  under_review: { label: "Under Review", variant: "default" },
  additional_info_requested: { label: "Info Requested", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  completed: { label: "Completed", variant: "default" },
};

const programTypeLabels: Record<string, string> = {
  educational: "Educational Program",
  social: "Social Initiative",
  cultural: "Cultural Program",
  environmental: "Environmental Project",
  health: "Health Initiative",
  other: "Other",
};

export default function PortalIstifada() {
  const queryString = `investorAccountId=${DEMO_INVESTOR_ACCOUNT_ID}`;
  const { data: requests, isLoading } = useQuery<IstifadaRequestWithDetails[]>({
    queryKey: ["/api/portal/istifada", queryString],
    queryFn: () => fetch(`/api/portal/istifada?${queryString}`).then((r) => r.json()),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Landmark className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Istifada Program Requests</h1>
            <p className="text-sm text-muted-foreground">Apply for asset utilization programs</p>
          </div>
        </div>
        <Link href="/portal/istifada/new">
          <Button data-testid="button-new-request">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !requests || requests.length === 0 ? (
        <div className="text-center py-12">
          <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No Istifada program requests yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Apply to utilize assets for educational, social, or cultural programs
          </p>
          <Link href="/portal/istifada/new">
            <Button data-testid="button-submit-request">Submit Request</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const status = statusConfig[request.status] || { label: request.status, variant: "secondary" };
            return (
              <Card key={request.id} data-testid={`card-request-${request.id}`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{request.referenceNumber}</span>
                        <span className="text-lg">{request.programTitle}</span>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Landmark className="h-3.5 w-3.5" />
                          {programTypeLabels[request.programType] || request.programType}
                        </span>
                        {request.asset && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {request.asset.assetNameEn}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">{request.startDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">{request.endDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget Estimate</p>
                      <p className="font-medium">{request.budgetEstimate || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(request.submittedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  {request.programDescription && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm line-clamp-2">{request.programDescription}</p>
                    </div>
                  )}

                  {request.status === "additional_info_requested" && request.additionalInfoRequest && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      <p className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        Additional Information Required:
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">{request.additionalInfoRequest}</p>
                    </div>
                  )}

                  {request.status === "rejected" && request.rejectionReason && (
                    <div className="p-3 bg-destructive/10 rounded-md">
                      <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                      <p className="text-sm text-destructive">{request.rejectionReason}</p>
                    </div>
                  )}

                  {request.reviewNotes && request.status !== "new" && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Review Notes:</p>
                      <p className="text-sm text-muted-foreground">{request.reviewNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
