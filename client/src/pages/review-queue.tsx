import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Clock, CheckCircle2, XCircle, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AssetWithDetails, WorkflowStage } from "@shared/schema";
import { workflowStageLabels, workflowStageEnum } from "@shared/schema";

type SlaStatus = "on_time" | "warning" | "urgent" | "overdue";

interface ReviewQueueItem {
  asset: AssetWithDetails;
  daysPending: number;
  slaStatus: SlaStatus;
  submittedDate: string;
}

const slaColors: Record<SlaStatus, string> = {
  on_time: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  urgent: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const slaLabels: Record<SlaStatus, string> = {
  on_time: "On Time",
  warning: "Warning",
  urgent: "Urgent",
  overdue: "Overdue",
};

export default function ReviewQueue() {
  const [selectedDepartment, setSelectedDepartment] = useState<WorkflowStage>("school_planning");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null);
  const [approveComments, setApproveComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectJustification, setRejectJustification] = useState("");
  const { toast } = useToast();

  const { data: queue, isLoading } = useQuery<ReviewQueueItem[]>({
    queryKey: ["/api/assets/reviews/queue", selectedDepartment],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      const res = await apiRequest("POST", `/api/assets/reviews/${id}/approve`, { comments });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string).startsWith("/api/assets") });
      toast({
        title: "Asset Approved",
        description: "The asset has been approved and moved to the next stage.",
      });
      setApproveDialogOpen(false);
      setSelectedAsset(null);
      setApproveComments("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve asset.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason, justification }: { id: string; reason: string; justification: string }) => {
      const res = await apiRequest("POST", `/api/assets/reviews/${id}/reject`, {
        rejectionReason: reason,
        rejectionJustification: justification,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string).startsWith("/api/assets") });
      toast({
        title: "Asset Rejected",
        description: "The asset has been rejected.",
      });
      setRejectDialogOpen(false);
      setSelectedAsset(null);
      setRejectReason("");
      setRejectJustification("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject asset.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (asset: AssetWithDetails) => {
    setSelectedAsset(asset);
    setApproveDialogOpen(true);
  };

  const handleReject = (asset: AssetWithDetails) => {
    setSelectedAsset(asset);
    setRejectDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedAsset) {
      approveMutation.mutate({ id: selectedAsset.id, comments: approveComments });
    }
  };

  const confirmReject = () => {
    if (selectedAsset && rejectReason && rejectJustification) {
      rejectMutation.mutate({
        id: selectedAsset.id,
        reason: rejectReason,
        justification: rejectJustification,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Review Queue
          </h1>
          <p className="text-muted-foreground">
            Review and approve pending asset registrations
          </p>
        </div>
        <Select value={selectedDepartment} onValueChange={(v) => setSelectedDepartment(v as WorkflowStage)}>
          <SelectTrigger className="w-[220px]" data-testid="select-department">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {workflowStageEnum.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {workflowStageLabels[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Pending Review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-pending">
              {queue?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <CardDescription>On Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-stat-on-time">
              {queue?.filter((q) => q.slaStatus === "on_time").length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <CardDescription>Warning / Urgent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-stat-warning">
              {queue?.filter((q) => q.slaStatus === "warning" || q.slaStatus === "urgent").length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <CardDescription>Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-stat-overdue">
              {queue?.filter((q) => q.slaStatus === "overdue").length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{workflowStageLabels[selectedDepartment]} Queue</CardTitle>
          <CardDescription>
            Assets pending review by {workflowStageLabels[selectedDepartment]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Days Pending</TableHead>
                  <TableHead>SLA Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : queue?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No assets pending review for this department
                    </TableCell>
                  </TableRow>
                ) : (
                  queue?.map((item) => (
                    <TableRow key={item.asset.id} data-testid={`row-review-${item.asset.id}`}>
                      <TableCell className="font-mono text-sm">
                        {item.asset.assetCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.asset.assetNameEn}</div>
                          <div className="text-sm text-muted-foreground">{item.asset.assetNameAr}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.asset.assetType}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.asset.district?.nameEn || "-"}</TableCell>
                      <TableCell>
                        <span className="font-medium">{item.daysPending}</span> days
                      </TableCell>
                      <TableCell>
                        <Badge className={slaColors[item.slaStatus]}>
                          {slaLabels[item.slaStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/assets/registrations/${item.asset.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-${item.asset.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item.asset)}
                            data-testid={`button-approve-${item.asset.id}`}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(item.asset)}
                            data-testid={`button-reject-${item.asset.id}`}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Asset</DialogTitle>
            <DialogDescription>
              Approve {selectedAsset?.assetNameEn} ({selectedAsset?.assetCode})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Comments (Optional)</Label>
              <Textarea
                placeholder="Add any comments for the next reviewer..."
                value={approveComments}
                onChange={(e) => setApproveComments(e.target.value)}
                data-testid="textarea-approve-comments"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={approveMutation.isPending}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Asset</DialogTitle>
            <DialogDescription>
              Reject {selectedAsset?.assetNameEn} ({selectedAsset?.assetCode})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Input
                placeholder="Enter rejection reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                data-testid="input-reject-reason"
              />
            </div>
            <div className="space-y-2">
              <Label>Justification</Label>
              <Textarea
                placeholder="Provide detailed justification for the rejection..."
                value={rejectJustification}
                onChange={(e) => setRejectJustification(e.target.value)}
                data-testid="textarea-reject-justification"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectReason || !rejectJustification}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
