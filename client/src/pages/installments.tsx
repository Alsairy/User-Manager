import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { format, isPast, isToday } from "date-fns";
import {
  Search,
  Filter,
  Receipt,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Installment, InstallmentStatus, ContractWithDetails } from "@shared/schema";

const statusConfig: Record<InstallmentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  overdue: { label: "Overdue", variant: "destructive", icon: AlertTriangle },
  partial: { label: "Partial", variant: "outline", icon: Wallet },
  paid: { label: "Paid", variant: "default", icon: CheckCircle2 },
};

interface InstallmentWithContract extends Installment {
  contract?: ContractWithDetails;
}

export default function InstallmentsPage() {
  const { t } = useTranslation(["pages", "common"]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

  const { data: contractsData, isLoading } = useQuery<{
    contracts: ContractWithDetails[];
    total: number;
  }>({
    queryKey: ["/api/contracts?limit=100"],
  });

  const contracts = contractsData?.contracts ?? [];

  const allInstallments: InstallmentWithContract[] = contracts.flatMap((contract) =>
    (contract.installments ?? []).map((inst) => ({
      ...inst,
      contract,
    }))
  );

  const filteredInstallments = allInstallments.filter((inst) => {
    if (statusFilter !== "all" && inst.status !== statusFilter) return false;
    if (search) {
      const contractCode = inst.contract?.contractCode?.toLowerCase() ?? "";
      const investorName = inst.contract?.investorNameEn?.toLowerCase() ?? "";
      const searchLower = search.toLowerCase();
      if (!contractCode.includes(searchLower) && !investorName.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  const sortedInstallments = [...filteredInstallments].sort((a, b) => {
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const overdueCount = allInstallments.filter((i) => i.status === "overdue").length;
  const pendingCount = allInstallments.filter((i) => i.status === "pending").length;
  const dueToday = allInstallments.filter((i) => i.status === "pending" && isToday(new Date(i.dueDate))).length;
  const paidCount = allInstallments.filter((i) => i.status === "paid").length;

  const overdueAmount = allInstallments
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.amountDue, 0);

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/installments/${id}/status`, {
        status: "paid",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        receiptFileUrl: "receipt-placeholder.pdf",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setMarkPaidDialogOpen(false);
      setSelectedInstallment(null);
      toast({ title: "Installment marked as paid" });
    },
    onError: () => {
      toast({ title: "Failed to update installment", variant: "destructive" });
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

  const openMarkPaidDialog = (inst: Installment) => {
    setSelectedInstallment(inst);
    setMarkPaidDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">{t("pages:contracts.installments")}</h1>
          <p className="text-muted-foreground text-sm">{t("pages:contracts.installmentsSubtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`cursor-pointer ${statusFilter === "overdue" ? "ring-2 ring-primary" : ""}`} onClick={() => setStatusFilter(statusFilter === "overdue" ? "all" : "overdue")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold">{overdueCount}</p>
                {overdueAmount > 0 && (
                  <p className="text-xs text-red-500">{formatCurrency(overdueAmount)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer ${statusFilter === "pending" ? "ring-2 ring-primary" : ""}`} onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{pendingCount}</p>
                {dueToday > 0 && (
                  <p className="text-xs text-yellow-600">{dueToday} due today</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer ${statusFilter === "paid" ? "ring-2 ring-primary" : ""}`} onClick={() => setStatusFilter(statusFilter === "paid" ? "all" : "paid")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold">{paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{allInstallments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">All Installments</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by contract or investor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" data-testid="select-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedInstallments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No installments found</p>
              <p className="text-sm">Create contracts with installment plans to see them here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInstallments.map((inst) => {
                  const config = statusConfig[inst.status];
                  const StatusIcon = config.icon;
                  const isDueSoon = inst.status === "pending" && isPast(new Date(inst.dueDate));
                  
                  return (
                    <TableRow key={inst.id} data-testid={`row-installment-${inst.id}`} className={isDueSoon ? "bg-red-50 dark:bg-red-950/20" : ""}>
                      <TableCell>{inst.installmentNumber}</TableCell>
                      <TableCell>
                        <Link href={`/contracts/${inst.contractId}`} className="hover:underline font-medium">
                          {inst.contract?.contractCode ?? inst.contractId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[150px]" title={inst.contract?.investorNameEn}>
                          {inst.contract?.investorNameEn ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(inst.dueDate), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(inst.amountDue)}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inst.paymentDate ? format(new Date(inst.paymentDate), "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        {inst.status !== "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMarkPaidDialog(inst)}
                            data-testid={`button-mark-paid-${inst.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Paid
                          </Button>
                        )}
                        {inst.status === "paid" && inst.receiptFileUrl && (
                          <Button variant="ghost" size="sm">
                            <Receipt className="h-4 w-4" />
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

      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Installment as Paid</DialogTitle>
          </DialogHeader>
          {selectedInstallment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Installment #</span>
                  <span className="font-medium">{selectedInstallment.installmentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span className="font-bold">{formatCurrency(selectedInstallment.amountDue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{format(new Date(selectedInstallment.dueDate), "MMM dd, yyyy")}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Marking this installment as paid will record today's date as the payment date.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedInstallment && markPaidMutation.mutate(selectedInstallment.id)}
              disabled={markPaidMutation.isPending}
              data-testid="button-confirm-paid"
            >
              {markPaidMutation.isPending ? "Updating..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
