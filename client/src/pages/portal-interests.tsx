import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Building2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import type { InvestorInterestWithDetails } from "@/lib/schema";

const DEMO_INVESTOR_ACCOUNT_ID = "demo-investor-001";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "secondary" },
  under_review: { label: "Under Review", variant: "default" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  converted: { label: "Converted to Contract", variant: "default" },
};

export default function PortalInterests() {
  const queryString = `investorAccountId=${DEMO_INVESTOR_ACCOUNT_ID}`;
  const { data: interests, isLoading } = useQuery<InvestorInterestWithDetails[]>({
    queryKey: ["/api/portal/interests", queryString],
    queryFn: () => fetch(`/api/portal/interests?${queryString}`).then((r) => r.json()),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">My Investment Interests</h1>
            <p className="text-sm text-muted-foreground">Track your investment interest submissions</p>
          </div>
        </div>
        <Link href="/portal/interests/new">
          <Button data-testid="button-new-interest">
            <Plus className="h-4 w-4 mr-2" />
            New Interest
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
      ) : !interests || interests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">You haven't submitted any investment interests yet</p>
          <div className="flex items-center justify-center gap-2">
            <Link href="/portal/assets">
              <Button variant="outline" data-testid="button-browse-assets">Browse Assets</Button>
            </Link>
            <Link href="/portal/interests/new">
              <Button data-testid="button-submit-interest">Submit Interest</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {interests.map((interest) => {
            const status = statusConfig[interest.status] || { label: interest.status, variant: "secondary" };
            return (
              <Card key={interest.id} data-testid={`card-interest-${interest.id}`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{interest.referenceNumber}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{interest.asset?.assetNameEn || "Unknown Asset"}</span>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Investment Purpose</p>
                      <p className="font-medium capitalize">{interest.investmentPurpose.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount Range</p>
                      <p className="font-medium">{interest.investmentAmountRange || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expected Timeline</p>
                      <p className="font-medium">{interest.expectedTimeline || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(interest.submittedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  {interest.proposedUseDescription && (
                    <div>
                      <p className="text-sm text-muted-foreground">Proposed Use</p>
                      <p className="text-sm line-clamp-2">{interest.proposedUseDescription}</p>
                    </div>
                  )}

                  {interest.status === "rejected" && interest.rejectionReason && (
                    <div className="p-3 bg-destructive/10 rounded-md">
                      <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                      <p className="text-sm text-destructive">{interest.rejectionReason}</p>
                    </div>
                  )}

                  {interest.reviewNotes && interest.status !== "new" && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Review Notes:</p>
                      <p className="text-sm text-muted-foreground">{interest.reviewNotes}</p>
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
