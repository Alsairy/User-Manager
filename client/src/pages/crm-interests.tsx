import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, FileText, Eye, Check, X, ChevronLeft, ChevronRight, Building2, User, ArrowRightCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InvestorInterestWithDetails } from "@shared/schema";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "secondary" },
  under_review: { label: "Under Review", variant: "default" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  converted: { label: "Converted", variant: "default" },
};

export default function CrmInterests() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedInterest, setSelectedInterest] = useState<InvestorInterestWithDetails | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);
  const limit = 25;
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{
    interests: InvestorInterestWithDetails[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/crm/interests", { status, page, limit }],
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, reviewNotes, rejectionReason }: {
      id: string;
      action: "approve" | "reject";
      reviewNotes?: string;
      rejectionReason?: string;
    }) => apiRequest(`/api/crm/interests/${id}/review`, "POST", {
      action,
      reviewNotes,
      rejectionReason,
      reviewerId: "admin",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/interests"] });
      toast({ title: "Interest updated successfully" });
      setDialogOpen(false);
      setReviewNotes("");
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "Failed to update interest", variant: "destructive" });
    },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleAction = (interest: InvestorInterestWithDetails, action: "approve" | "reject") => {
    setSelectedInterest(interest);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedInterest || !dialogAction) return;
    reviewMutation.mutate({
      id: selectedInterest.id,
      action: dialogAction,
      reviewNotes,
      rejectionReason: dialogAction === "reject" ? rejectionReason : undefined,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Interest Pipeline</h1>
          <p className="text-sm text-muted-foreground">Review and process investment interests</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
          <SelectTrigger className="w-[180px]" data-testid="select-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : !data?.interests.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No interests found
                  </TableCell>
                </TableRow>
              ) : (
                data.interests.map((interest) => {
                  const statusInfo = statusConfig[interest.status] || { label: interest.status, variant: "secondary" };
                  
                  return (
                    <TableRow key={interest.id} data-testid={`row-interest-${interest.id}`}>
                      <TableCell>
                        <span className="font-mono text-sm">{interest.referenceNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{interest.investorAccount?.fullNameEn || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{interest.asset?.assetNameEn || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{interest.investmentPurpose.replace("_", " ")}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(interest.submittedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {interest.status === "new" || interest.status === "under_review" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAction(interest, "approve")}
                                data-testid={`button-approve-${interest.id}`}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAction(interest, "reject")}
                                data-testid={`button-reject-${interest.id}`}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            data-testid="button-next-page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Approve Interest" : "Reject Interest"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? "This will approve the investment interest and notify the investor."
                : "This will reject the investment interest. Please provide a reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Review Notes</Label>
              <Textarea
                placeholder="Add any notes about this decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                data-testid="input-review-notes"
              />
            </div>
            {dialogAction === "reject" && (
              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <Textarea
                  placeholder="Explain why this interest is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  data-testid="input-rejection-reason"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={reviewMutation.isPending || (dialogAction === "reject" && !rejectionReason)}
              variant={dialogAction === "reject" ? "destructive" : "default"}
              data-testid="button-confirm"
            >
              {dialogAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
