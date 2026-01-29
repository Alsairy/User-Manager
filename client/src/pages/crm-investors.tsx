import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Eye, ChevronLeft, ChevronRight, Mail, Phone, Building2, User } from "lucide-react";
import { format } from "date-fns";
import type { InvestorAccount } from "@shared/schema";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  blocked: { label: "Blocked", variant: "destructive" },
  inactive: { label: "Inactive", variant: "secondary" },
};

const accountTypeConfig: Record<string, { label: string; icon: typeof User }> = {
  individual: { label: "Individual", icon: User },
  company: { label: "Company", icon: Building2 },
};

export default function CrmInvestors() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [accountType, setAccountType] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 25;

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (status && status !== "all") queryParams.set("status", status);
  if (accountType && accountType !== "all") queryParams.set("accountType", accountType);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  const queryString = queryParams.toString();

  const { data, isLoading } = useQuery<{
    accounts: InvestorAccount[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/crm/investors", queryString],
    queryFn: () => fetch(`/api/crm/investors?${queryString}`).then((r) => r.json()),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Investor Records</h1>
          <p className="text-sm text-muted-foreground">Manage investor accounts and profiles</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
          <SelectTrigger className="w-[150px]" data-testid="select-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={accountType} onValueChange={(val) => { setAccountType(val); setPage(1); }}>
          <SelectTrigger className="w-[150px]" data-testid="select-account-type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interests</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : !data?.accounts.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No investor accounts found
                  </TableCell>
                </TableRow>
              ) : (
                data.accounts.map((account) => {
                  const statusInfo = statusConfig[account.status] || { label: account.status, variant: "secondary" };
                  const typeInfo = accountTypeConfig[account.accountType] || { label: account.accountType, icon: User };
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <TableRow key={account.id} data-testid={`row-investor-${account.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{account.fullNameEn}</p>
                          <p className="text-xs text-muted-foreground">{account.nationalIdOrCr}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{typeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {account.email}
                          </p>
                          {account.phone && (
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {account.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{account.totalInterests}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(account.registrationDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/crm/investors/${account.id}`}>
                          <Button variant="ghost" size="icon" data-testid={`button-view-${account.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
    </div>
  );
}
