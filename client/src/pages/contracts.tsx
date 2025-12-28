import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Archive,
  XCircle,
  FileSignature,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  ChevronLeft,
  ChevronRight,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  ContractWithDetails,
  ContractStatus,
  Investor,
} from "@shared/schema";

const statusConfig: Record<ContractStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", variant: "secondary", icon: FileSignature },
  incomplete: { label: "Incomplete", variant: "outline", icon: Clock },
  active: { label: "Active", variant: "default", icon: CheckCircle2 },
  expiring: { label: "Expiring", variant: "secondary", icon: AlertTriangle },
  expired: { label: "Expired", variant: "destructive", icon: Ban },
  archived: { label: "Archived", variant: "outline", icon: Archive },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

export default function ContractsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [investorFilter, setInvestorFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const buildContractsUrl = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (investorFilter !== "all") params.append("investorId", investorFilter);
    params.append("page", String(page));
    params.append("limit", String(limit));
    return `/api/contracts?${params.toString()}`;
  };

  const { data: contractsData, isLoading: isLoadingContracts } = useQuery<{
    contracts: ContractWithDetails[];
    total: number;
    statusCounts: Record<ContractStatus, number>;
    page: number;
    limit: number;
  }>({
    queryKey: [buildContractsUrl()],
  });

  const { data: investors = [] } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/contracts/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Contract archived successfully" });
    },
    onError: () => {
      toast({ title: "Failed to archive contract", variant: "destructive" });
    },
  });

  const contracts = contractsData?.contracts ?? [];
  const total = contractsData?.total ?? 0;
  const statusCounts = contractsData?.statusCounts ?? {} as Record<ContractStatus, number>;
  const totalPages = Math.ceil(total / limit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Contract Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage investor contracts, installments, and payments
          </p>
        </div>
        <Button onClick={() => setLocation("/contracts/new")} data-testid="button-create-contract">
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {(Object.entries(statusConfig) as [ContractStatus, typeof statusConfig[ContractStatus]][]).map(([status, config]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-colors ${statusFilter === status ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            data-testid={`card-status-${status}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <config.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
              <p className="text-xl font-semibold">{statusCounts[status] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Contracts</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40" data-testid="select-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={investorFilter} onValueChange={(v) => { setInvestorFilter(v); setPage(1); }}>
                <SelectTrigger className="w-48" data-testid="select-investor">
                  <SelectValue placeholder="All Investors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Investors</SelectItem>
                  {investors.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>{inv.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingContracts ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No contracts found</p>
              <p className="text-sm">Create your first contract to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Code</TableHead>
                  <TableHead>Land Code</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => {
                  const config = statusConfig[contract.status];
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                      <TableCell className="font-medium">
                        <Link href={`/contracts/${contract.id}`} className="hover:underline" data-testid={`link-contract-${contract.id}`}>
                          {contract.contractCode}
                        </Link>
                      </TableCell>
                      <TableCell>{contract.landCode}</TableCell>
                      <TableCell>
                        <div className="truncate max-w-[150px]" title={contract.investorNameEn}>
                          {contract.investorNameEn}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[150px]" title={contract.assetNameEn}>
                          {contract.assetNameEn}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(contract.totalContractAmount)}
                      </TableCell>
                      <TableCell>{contract.contractDuration} year{contract.contractDuration > 1 ? "s" : ""}</TableCell>
                      <TableCell>{format(new Date(contract.endDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${contract.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/contracts/${contract.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {(contract.status === "active" || contract.status === "expired") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => archiveMutation.mutate(contract.id)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {total > limit && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} contracts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
