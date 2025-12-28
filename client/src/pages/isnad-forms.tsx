import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  Eye,
  Send,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  IsnadFormWithDetails,
  isnadStatusLabels,
  isnadStageLabels,
  IsnadStatus,
  IsnadStage,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<IsnadStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_department_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  investment_agency_review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  in_package: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  pending_ceo: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  pending_minister: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  returned: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const slaStatusColors = {
  on_time: "text-green-600",
  warning: "text-yellow-600",
  urgent: "text-orange-600",
  overdue: "text-red-600",
};

const slaStatusIcons = {
  on_time: CheckCircle2,
  warning: AlertTriangle,
  urgent: Clock,
  overdue: XCircle,
};

export default function IsnadFormsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 25;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(stageFilter !== "all" && { stage: stageFilter }),
  });

  const queryString = queryParams.toString();
  const { data, isLoading } = useQuery<{
    forms: IsnadFormWithDetails[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/isnad/forms", queryString],
    queryFn: () => fetch(`/api/isnad/forms?${queryString}`).then((r) => r.json()),
  });

  const submitMutation = useMutation({
    mutationFn: async (formId: string) => {
      return apiRequest("POST", `/api/isnad/forms/${formId}/submit`);
    },
    onSuccess: () => {
      toast({ title: "Form submitted for review" });
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ formId, reason }: { formId: string; reason: string }) => {
      return apiRequest("POST", `/api/isnad/forms/${formId}/cancel`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Form cancelled" });
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <div className="p-6 space-y-6" data-testid="page-isnad-forms">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">ISNAD Forms</h1>
          <p className="text-muted-foreground">Investment suitability assessment workflow</p>
        </div>
        <Button onClick={() => navigate("/isnad/forms/new")} data-testid="button-create-form">
          <Plus className="w-4 h-4 mr-2" />
          New ISNAD Form
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Forms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by form code or asset name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_department_review">In Department Review</SelectItem>
                <SelectItem value="investment_agency_review">Investment Agency Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[200px]" data-testid="select-stage-filter">
                <SelectValue placeholder="Current Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="ip_initiation">I&P Initiation</SelectItem>
                <SelectItem value="school_planning">School Planning</SelectItem>
                <SelectItem value="asset_management">Asset Management</SelectItem>
                <SelectItem value="shared_services">Shared Services</SelectItem>
                <SelectItem value="education_dept">Education Dept</SelectItem>
                <SelectItem value="investment_agency">Investment Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Code</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>SLA Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.forms?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No ISNAD forms found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.forms?.map((form) => {
                      const SlaIcon = form.slaStatus ? slaStatusIcons[form.slaStatus] : null;
                      return (
                        <TableRow key={form.id} data-testid={`row-form-${form.id}`}>
                          <TableCell>
                            <span className="font-mono font-medium">{form.formCode}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{form.asset?.assetNameEn || "Unknown Asset"}</p>
                              <p className="text-sm text-muted-foreground">{form.asset?.assetCode}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[form.status]}>
                              {isnadStatusLabels[form.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{isnadStageLabels[form.currentStage]}</span>
                          </TableCell>
                          <TableCell>
                            {form.slaStatus && SlaIcon && (
                              <div className={`flex items-center gap-1 ${slaStatusColors[form.slaStatus]}`}>
                                <SlaIcon className="w-4 h-4" />
                                <span className="text-sm capitalize">{form.slaStatus.replace("_", " ")}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(form.createdAt).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-actions-${form.id}`}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/isnad/forms/${form.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {form.status === "draft" && (
                                  <>
                                    <DropdownMenuItem onClick={() => navigate(`/isnad/forms/${form.id}/edit`)}>
                                      <FileText className="w-4 h-4 mr-2" />
                                      Edit Form
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => submitMutation.mutate(form.id)}
                                      disabled={submitMutation.isPending}
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Submit for Review
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {form.status === "returned" && (
                                  <DropdownMenuItem onClick={() => navigate(`/isnad/forms/${form.id}/edit`)}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Revise & Resubmit
                                  </DropdownMenuItem>
                                )}
                                {(form.status === "draft" || form.status === "submitted" || form.status === "returned") && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      const reason = prompt("Please enter cancellation reason:");
                                      if (reason) {
                                        cancelMutation.mutate({ formId: form.id, reason });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Cancel Form
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data?.total || 0)} of {data?.total || 0} forms
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
