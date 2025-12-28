import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  FileSignature,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Archive,
  DollarSign,
  TrendingUp,
  Calendar,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContractDashboardStats } from "@shared/schema";

export default function ContractsDashboardPage() {
  const { data: stats, isLoading } = useQuery<ContractDashboardStats>({
    queryKey: ["/api/contracts/dashboard"],
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
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Contracts Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of contract performance and payments</p>
        </div>
        <Link href="/contracts/new">
          <Button data-testid="button-new-contract">
            <FileSignature className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-blue-500/10">
                <FileSignature className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contracts</p>
                <p className="text-2xl font-bold">{stats.totalContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Contracts</p>
                <p className="text-2xl font-bold">{stats.activeContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{stats.expiringContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contract Value</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalContractValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-red-500/10">
                    <Ban className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium">Overdue Installments</p>
                    <p className="text-sm text-muted-foreground">{stats.overdueInstallments} payments</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-red-500">{formatCurrency(stats.overdueAmount)}</p>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-yellow-500/10">
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Installments</p>
                    <p className="text-sm text-muted-foreground">{stats.pendingInstallments} payments</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-500/10">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Paid This Month</p>
                    <p className="text-sm text-muted-foreground">{stats.paidThisMonth} payments</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-green-500">{formatCurrency(stats.paidAmountThisMonth)}</p>
              </div>

              {stats.installmentsDueToday > 0 && (
                <div className="flex items-center justify-between p-3 border rounded-md bg-blue-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-blue-500/10">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Due Today</p>
                      <p className="text-sm text-muted-foreground">{stats.installmentsDueToday} installments</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Contract Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-yellow-500/10">
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </div>
                  <span>Incomplete</span>
                </div>
                <span className="font-semibold">{stats.incompleteContracts}</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-red-500/10">
                    <Ban className="h-4 w-4 text-red-500" />
                  </div>
                  <span>Cancelled</span>
                </div>
                <span className="font-semibold">{stats.cancelledContracts}</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-gray-500/10">
                    <Archive className="h-4 w-4 text-gray-500" />
                  </div>
                  <span>Archived</span>
                </div>
                <span className="font-semibold">{stats.archivedContracts}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link href="/contracts">
          <Button variant="outline" data-testid="button-view-contracts">
            View All Contracts
          </Button>
        </Link>
        <Link href="/contracts/investors">
          <Button variant="outline" data-testid="button-view-investors">
            Manage Investors
          </Button>
        </Link>
      </div>
    </div>
  );
}
