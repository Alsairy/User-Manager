import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  Package,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Building2,
  LandPlot,
  UserCheck,
  Award,
} from "lucide-react";
import {
  IsnadPackageWithDetails,
  IsnadFormWithDetails,
  packageStatusLabels,
  PackageStatus,
  PackagePriority,
} from "@/lib/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<PackageStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_ceo: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ceo_approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending_minister: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  minister_approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected_ceo: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  rejected_minister: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function IsnadPackagesPage() {
  const { t } = useTranslation(["pages", "common"]);
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 25;

  const [createOpen, setCreateOpen] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PackagePriority>("medium");
  const [durationYears, setDurationYears] = useState<number>(5);
  const [durationMonths, setDurationMonths] = useState<number>(0);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);

  const [reviewPackage, setReviewPackage] = useState<IsnadPackageWithDetails | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [viewPackage, setViewPackage] = useState<IsnadPackageWithDetails | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const preSelectedForms = params.get("selectedForms");
    if (preSelectedForms) {
      const formIds = preSelectedForms.split(",").filter(Boolean);
      if (formIds.length > 0) {
        setSelectedForms(formIds);
        setCreateOpen(true);
        navigate("/isnad/packages", { replace: true });
      }
    }
  }, [searchParams, navigate]);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const queryString = queryParams.toString();
  const { data, isLoading } = useQuery<{
    packages: IsnadPackageWithDetails[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/isnad/packages", queryString],
    queryFn: () => fetch(`/api/isnad/packages?${queryString}`).then((r) => r.json()),
  });

  const { data: formsForPackagingData, isLoading: loadingForms } = useQuery<{
    forms: IsnadFormWithDetails[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/isnad/forms-for-packaging"],
    queryFn: () => fetch("/api/isnad/forms-for-packaging").then((r) => r.json()),
    enabled: createOpen,
  });
  const formsForPackaging = formsForPackagingData?.forms;

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/isnad/packages", {
        packageName,
        description,
        priority,
        durationYears,
        durationMonths,
        formIds: selectedForms,
      });
    },
    onSuccess: () => {
      toast({ title: "Package created successfully" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
      setCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create package", variant: "destructive" });
    },
  });

  const submitToCeoMutation = useMutation({
    mutationFn: async (packageId: string) => {
      return apiRequest("POST", `/api/isnad/packages/${packageId}/submit-ceo`);
    },
    onSuccess: () => {
      toast({ title: "Package submitted to CEO for review" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
    },
  });

  const ceoReviewMutation = useMutation({
    mutationFn: async ({ packageId, action, comments }: { packageId: string; action: "approve" | "reject"; comments?: string }) => {
      return apiRequest("POST", `/api/isnad/packages/${packageId}/review-ceo`, { action, comments });
    },
    onSuccess: (_, { action }) => {
      toast({ title: action === "approve" ? "Package approved by CEO" : "Package rejected by CEO" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
      closeReviewDialog();
    },
    onError: () => {
      toast({ title: "Failed to process CEO review", variant: "destructive" });
    },
  });

  const ministerReviewMutation = useMutation({
    mutationFn: async ({ packageId, action, comments }: { packageId: string; action: "approve" | "reject"; comments?: string }) => {
      return apiRequest("POST", `/api/isnad/packages/${packageId}/review-minister`, { action, comments });
    },
    onSuccess: (_, { action }) => {
      toast({ title: action === "approve" ? "Package approved by Minister" : "Package rejected by Minister" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
      closeReviewDialog();
    },
    onError: () => {
      toast({ title: "Failed to process Minister review", variant: "destructive" });
    },
  });

  const openReviewDialog = (pkg: IsnadPackageWithDetails, action: "approve" | "reject") => {
    setReviewPackage(pkg);
    setReviewAction(action);
    setReviewComments("");
    setReviewDialogOpen(true);
  };

  const closeReviewDialog = () => {
    setReviewPackage(null);
    setReviewAction(null);
    setReviewComments("");
    setReviewDialogOpen(false);
  };

  const handleReviewSubmit = () => {
    if (!reviewPackage || !reviewAction) return;
    const action = reviewAction as "approve" | "reject";
    const comments = reviewComments.trim() || undefined;
    if (reviewPackage.status === "pending_ceo") {
      ceoReviewMutation.mutate({ packageId: reviewPackage.id, action, comments });
    } else if (reviewPackage.status === "ceo_approved" || reviewPackage.status === "pending_minister") {
      ministerReviewMutation.mutate({ packageId: reviewPackage.id, action, comments });
    }
  };

  const resetForm = () => {
    setPackageName("");
    setDescription("");
    setPriority("medium");
    setDurationYears(5);
    setDurationMonths(0);
    setSelectedForms([]);
  };

  const toggleForm = (formId: string) => {
    setSelectedForms((prev) =>
      prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId]
    );
  };

  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <div className="p-6 space-y-6" data-testid="page-isnad-packages">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">{t("pages:isnad.packages")}</h1>
          <p className="text-muted-foreground">{t("pages:isnad.packagesSubtitle")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-package">
              <Plus className="w-4 h-4 mr-2" />
              New Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Investment Package</DialogTitle>
              <DialogDescription>Bundle approved ISNAD forms for CEO and Minister review</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name</Label>
                <Input
                  id="packageName"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g., Q1 2025 Investment Package"
                  data-testid="input-package-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the package..."
                  data-testid="input-package-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as PackagePriority)}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Select value={durationYears.toString()} onValueChange={(v) => setDurationYears(parseInt(v))}>
                      <SelectTrigger data-testid="select-duration-years">
                        <SelectValue placeholder="Years" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 50 }, (_, i) => i + 1).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year} {year === 1 ? "Year" : "Years"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={durationMonths.toString()} onValueChange={(v) => setDurationMonths(parseInt(v))}>
                      <SelectTrigger data-testid="select-duration-months">
                        <SelectValue placeholder="Months" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }, (_, i) => i).map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {month} {month === 1 ? "Month" : "Months"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select Approved ISNAD Requests</Label>
                {loadingForms ? (
                  <Skeleton className="h-32 w-full" />
                ) : formsForPackaging && formsForPackaging.length > 0 ? (
                  <div className="border rounded-md max-h-60 overflow-auto">
                    {formsForPackaging.map((form) => (
                      <div
                        key={form.id}
                        className="flex items-center gap-3 p-3 border-b last:border-b-0 hover-elevate"
                        data-testid={`form-option-${form.id}`}
                      >
                        <Checkbox
                          checked={selectedForms.includes(form.id)}
                          onCheckedChange={() => toggleForm(form.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{form.asset?.assetNameEn}</p>
                          <p className="text-sm text-muted-foreground">
                            {form.formCode} - {form.asset?.assetType}
                          </p>
                        </div>
                        {form.financialAnalysis && (
                          <span className="text-sm text-muted-foreground">
                            SAR {form.financialAnalysis.currentValuation.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-md p-8 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No approved requests available for packaging</p>
                    <p className="text-sm">Requests must be approved by Investment Agency to be packaged</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !packageName || selectedForms.length === 0}
                data-testid="button-confirm-create"
              >
                Create Package
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{data?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Packages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-md">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {data?.packages?.filter((p) => p.status === "pending_ceo").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Pending CEO</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-md">
                <Send className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {data?.packages?.filter((p) => p.status === "ceo_approved" || p.status === "pending_minister").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Pending Minister</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {data?.packages?.filter((p) => p.status === "minister_approved").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by package code or name..."
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
                <SelectItem value="pending_ceo">Pending CEO</SelectItem>
                <SelectItem value="ceo_approved">CEO Approved</SelectItem>
                <SelectItem value="pending_minister">Pending Minister</SelectItem>
                <SelectItem value="minister_approved">Approved</SelectItem>
                <SelectItem value="rejected_ceo">Rejected by CEO</SelectItem>
                <SelectItem value="rejected_minister">Rejected by Minister</SelectItem>
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
                    <TableHead>Package Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.packages?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No packages found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.packages?.map((pkg) => (
                      <TableRow key={pkg.id} data-testid={`row-package-${pkg.id}`}>
                        <TableCell>
                          <span className="font-mono font-medium">{pkg.packageCode}</span>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{pkg.packageName}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{pkg.totalAssets}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Banknote className="w-4 h-4 text-muted-foreground" />
                            <span>SAR {pkg.totalValuation.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[pkg.priority] || priorityColors.medium}>
                            {pkg.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[pkg.status]}>
                            {packageStatusLabels[pkg.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              data-testid={`button-view-${pkg.id}`}
                              onClick={() => setViewPackage(pkg)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {pkg.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => submitToCeoMutation.mutate(pkg.id)}
                                disabled={submitToCeoMutation.isPending}
                                data-testid={`button-submit-${pkg.id}`}
                                title="Submit to CEO"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            {pkg.status === "pending_ceo" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600"
                                  onClick={() => openReviewDialog(pkg, "approve")}
                                  data-testid={`button-ceo-approve-${pkg.id}`}
                                  title="CEO Approve"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600"
                                  onClick={() => openReviewDialog(pkg, "reject")}
                                  data-testid={`button-ceo-reject-${pkg.id}`}
                                  title="CEO Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {(pkg.status === "ceo_approved" || pkg.status === "pending_minister") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600"
                                  onClick={() => openReviewDialog(pkg, "approve")}
                                  data-testid={`button-minister-approve-${pkg.id}`}
                                  title="Minister Approve"
                                >
                                  <Award className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600"
                                  onClick={() => openReviewDialog(pkg, "reject")}
                                  data-testid={`button-minister-reject-${pkg.id}`}
                                  title="Minister Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data?.total || 0)} of {data?.total || 0} packages
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

      <Dialog open={reviewDialogOpen} onOpenChange={(open) => { if (!open) closeReviewDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewPackage?.status === "pending_ceo" ? "CEO Review" : "Minister Review"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve" 
                ? `Are you sure you want to approve "${reviewPackage?.packageName}"?`
                : `Are you sure you want to reject "${reviewPackage?.packageName}"?`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Package:</span>
                  <p className="font-medium">{reviewPackage?.packageName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Code:</span>
                  <p className="font-mono">{reviewPackage?.packageCode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Assets:</span>
                  <p className="font-medium">{reviewPackage?.totalAssets}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Value:</span>
                  <p className="font-medium">SAR {reviewPackage?.totalValuation?.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewComments">
                {reviewAction === "reject" ? "Rejection Reason (Required)" : "Comments (Optional)"}
              </Label>
              <Textarea
                id="reviewComments"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder={
                  reviewAction === "reject" 
                    ? "Please provide a reason for rejecting this package..."
                    : "Add any comments or notes..."
                }
                data-testid="input-review-comments"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReviewDialog}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={handleReviewSubmit}
              disabled={
                (reviewAction === "reject" && !reviewComments.trim()) ||
                ceoReviewMutation.isPending ||
                ministerReviewMutation.isPending
              }
              data-testid="button-confirm-review"
            >
              {reviewAction === "approve" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Package Dialog */}
      <Dialog open={!!viewPackage} onOpenChange={(open) => !open && setViewPackage(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Package Details</DialogTitle>
            <DialogDescription>
              {viewPackage?.packageCode} - {viewPackage?.packageName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="mt-1">
                  <Badge className={statusColors[viewPackage?.status || "draft"]}>
                    {packageStatusLabels[viewPackage?.status || "draft"]}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Priority</span>
                <div className="mt-1">
                  <Badge className={priorityColors[viewPackage?.priority || "medium"]}>
                    {viewPackage?.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total Assets</span>
                <p className="font-medium mt-1">{viewPackage?.totalAssets}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total Value</span>
                <p className="font-medium mt-1">SAR {viewPackage?.totalValuation?.toLocaleString()}</p>
              </div>
            </div>
            
            {viewPackage?.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="mt-1">{viewPackage.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-3">Included Assets ({viewPackage?.assets?.length || 0})</h3>
              <div className="space-y-3">
                {viewPackage?.assets?.map((asset) => (
                  <Card key={asset.id} className="p-4" data-testid={`card-asset-${asset.id}`}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-muted">
                            {asset.assetType === "building" ? (
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <LandPlot className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{asset.assetNameEn}</p>
                            <p className="text-sm text-muted-foreground">{asset.assetNameAr}</p>
                            <p className="text-xs font-mono text-muted-foreground mt-1">{asset.assetCode}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/assets/bank/${asset.id}`)}
                          data-testid={`button-view-asset-${asset.id}`}
                        >
                          <Eye className="w-4 h-4 me-2" />
                          View Details
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium">
                            {asset.district?.nameEn || asset.city?.nameEn || asset.region?.nameEn || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Area</p>
                          <p className="text-sm font-medium">{asset.totalArea?.toLocaleString()} sqm</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ownership</p>
                          <p className="text-sm font-medium">{asset.ownershipType?.replace(/_/g, " ") || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="text-sm font-medium capitalize">{asset.assetType || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {(!viewPackage?.assets || viewPackage.assets.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No assets in this package</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">ISNAD Requests ({viewPackage?.forms?.length || 0})</h3>
              <div className="space-y-2">
                {viewPackage?.forms?.map((form) => (
                  <Card key={form.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-medium">{form.formCode}</p>
                        <p className="text-sm text-muted-foreground">{form.asset?.assetNameEn}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{form.status}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          SAR {form.financialAnalysis?.currentValuation?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPackage(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
