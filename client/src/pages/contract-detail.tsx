import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileSignature,
  Building2,
  UserCircle,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Archive,
  XCircle,
  Upload,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  ContractWithDetails,
  ContractStatus,
  Installment,
  InstallmentStatus,
  CancellationReason,
} from "@shared/schema";
import { cancellationReasonLabels } from "@shared/schema";

const statusConfig: Record<ContractStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", variant: "secondary", icon: FileSignature },
  incomplete: { label: "Incomplete", variant: "outline", icon: Clock },
  active: { label: "Active", variant: "default", icon: CheckCircle2 },
  expiring: { label: "Expiring", variant: "secondary", icon: AlertTriangle },
  expired: { label: "Expired", variant: "destructive", icon: Ban },
  archived: { label: "Archived", variant: "outline", icon: Archive },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

const installmentStatusConfig: Record<InstallmentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  overdue: { label: "Overdue", variant: "destructive" },
  partial: { label: "Partial", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
};

export default function ContractDetailPage() {
  const [, params] = useRoute("/contracts/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancellationReason>("mutual_agreement");
  const [cancelJustification, setCancelJustification] = useState("");
  const [installmentPlanDialogOpen, setInstallmentPlanDialogOpen] = useState(false);
  const [planType, setPlanType] = useState<"equal" | "custom">("equal");
  const [planCount, setPlanCount] = useState(12);
  const [planFrequency, setPlanFrequency] = useState<"monthly" | "quarterly" | "semi_annual" | "annual">("monthly");

  const { data: contract, isLoading } = useQuery<ContractWithDetails>({
    queryKey: [`/api/contracts/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: installments = [] } = useQuery<Installment[]>({
    queryKey: [`/api/contracts/${params?.id}/installments`],
    enabled: !!params?.id,
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/contracts/${params?.id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${params?.id}`] });
      toast({ title: "Contract archived successfully" });
    },
    onError: () => {
      toast({ title: "Failed to archive contract", variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/contracts/${params?.id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${params?.id}`] });
      toast({ title: "Contract activated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to activate contract. Ensure PDF and installment plan are uploaded.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/contracts/${params?.id}/cancel`, {
        reason: cancelReason,
        justification: cancelJustification,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${params?.id}`] });
      setCancelDialogOpen(false);
      toast({ title: "Contract cancelled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to cancel contract", variant: "destructive" });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/contracts/${params?.id}/installment-plan`, {
        type: planType,
        count: planCount,
        frequency: planFrequency,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${params?.id}/installments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${params?.id}`] });
      setInstallmentPlanDialogOpen(false);
      toast({ title: "Installment plan created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create installment plan", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Contract not found</p>
        <Button variant="ghost" onClick={() => setLocation("/contracts")}>
          Back to Contracts
        </Button>
      </div>
    );
  }

  const config = statusConfig[contract.status];
  const StatusIcon = config.icon;

  const paidAmount = installments
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amountDue, 0);

  const remainingAmount = contract.totalContractAmount - paidAmount;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/contracts")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold" data-testid="text-contract-code">{contract.contractCode}</h1>
            <Badge variant={config.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Land Code: {contract.landCode}</p>
        </div>
        <div className="flex items-center gap-2">
          {(contract.status === "draft" || contract.status === "incomplete") && (
            <Button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending} data-testid="button-activate">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Activate Contract
            </Button>
          )}
          {(contract.status === "active" || contract.status === "expiring") && (
            <Button variant="destructive" onClick={() => setCancelDialogOpen(true)} data-testid="button-cancel">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Contract
            </Button>
          )}
          {(contract.status === "active" || contract.status === "expired") && (
            <Button variant="outline" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending} data-testid="button-archive">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contract</p>
                <p className="text-xl font-semibold">{formatCurrency(contract.totalContractAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-semibold">{formatCurrency(paidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-semibold">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-semibold">{contract.contractDuration} year{contract.contractDuration > 1 ? "s" : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="installments" data-testid="tab-installments">Installments ({installments.length})</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Asset Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name (English)</p>
                  <p className="font-medium">{contract.assetNameEn}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name (Arabic)</p>
                  <p className="font-medium">{contract.assetNameAr}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asset ID</p>
                  <p className="font-medium">{contract.assetId}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Investor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name (English)</p>
                  <p className="font-medium">{contract.investorNameEn}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name (Arabic)</p>
                  <p className="font-medium">{contract.investorNameAr}</p>
                </div>
                {contract.investor && (
                  <>
                    {contract.investor.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{contract.investor.email}</p>
                      </div>
                    )}
                    {contract.investor.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{contract.investor.phone}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual Rental Amount</span>
                  <span className="font-medium">{formatCurrency(contract.annualRentalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT Rate</span>
                  <span className="font-medium">{contract.vatRate}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Annual (with VAT)</span>
                  <span className="font-semibold">{formatCurrency(contract.totalAnnualAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Contract Value</span>
                  <span className="font-bold text-lg">{formatCurrency(contract.totalContractAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Contract Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signing Date</span>
                  <span className="font-medium">{format(new Date(contract.signingDate), "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{format(new Date(contract.startDate), "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium">{format(new Date(contract.endDate), "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{contract.contractDuration} year{contract.contractDuration > 1 ? "s" : ""}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="installments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Installment Plan</CardTitle>
              {installments.length === 0 && (contract.status === "draft" || contract.status === "incomplete") && (
                <Button onClick={() => setInstallmentPlanDialogOpen(true)} data-testid="button-create-plan">
                  Create Installment Plan
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {installments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No installment plan created yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((installment) => {
                      const instConfig = installmentStatusConfig[installment.status];
                      return (
                        <TableRow key={installment.id} data-testid={`row-installment-${installment.id}`}>
                          <TableCell>{installment.installmentNumber}</TableCell>
                          <TableCell>{format(new Date(installment.dueDate), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(installment.amountDue)}</TableCell>
                          <TableCell>
                            <Badge variant={instConfig.variant}>{instConfig.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {installment.paymentDate ? format(new Date(installment.paymentDate), "MMM dd, yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            {installment.receiptFileUrl ? (
                              <Button variant="ghost" size="sm">
                                <Receipt className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                <Upload className="h-4 w-4 mr-1" />
                                Upload
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <FileSignature className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Signed Contract PDF</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.signedPdfUrl ? "Uploaded" : "Not uploaded"}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Contract</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Cancellation Reason</label>
              <Select value={cancelReason} onValueChange={(v) => setCancelReason(v as CancellationReason)}>
                <SelectTrigger data-testid="select-cancel-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(cancellationReasonLabels) as [CancellationReason, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Justification (min 100 characters)</label>
              <Textarea
                value={cancelJustification}
                onChange={(e) => setCancelJustification(e.target.value)}
                placeholder="Please provide detailed justification..."
                rows={4}
                data-testid="input-cancel-justification"
              />
              <p className="text-xs text-muted-foreground mt-1">{cancelJustification.length}/100 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelJustification.length < 100 || cancelMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={installmentPlanDialogOpen} onOpenChange={setInstallmentPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Installment Plan</DialogTitle>
            <DialogDescription>
              Set up the payment schedule for this contract.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Plan Type</label>
              <Select value={planType} onValueChange={(v) => setPlanType(v as "equal" | "custom")}>
                <SelectTrigger data-testid="select-plan-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equal Installments</SelectItem>
                  <SelectItem value="custom" disabled>Custom (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Number of Installments</label>
              <Select value={String(planCount)} onValueChange={(v) => setPlanCount(Number(v))}>
                <SelectTrigger data-testid="select-plan-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 installments</SelectItem>
                  <SelectItem value="6">6 installments</SelectItem>
                  <SelectItem value="12">12 installments</SelectItem>
                  <SelectItem value="24">24 installments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <Select value={planFrequency} onValueChange={(v) => setPlanFrequency(v as "monthly" | "quarterly" | "semi_annual" | "annual")}>
                <SelectTrigger data-testid="select-plan-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Each installment:</p>
              <p className="text-lg font-semibold">{formatCurrency(contract.totalContractAmount / planCount)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallmentPlanDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createPlanMutation.mutate()}
              disabled={createPlanMutation.isPending}
              data-testid="button-create-installments"
            >
              {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
