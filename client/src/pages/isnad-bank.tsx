import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Search, Package, Building2, LandPlot, Clock, CheckCircle2, AlertCircle, 
  FileSpreadsheet, Eye, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { IsnadFormWithDetails, SlaStatus, Region } from "@shared/schema";
import { isnadStatusLabels, isnadStageLabels } from "@shared/schema";

const slaStatusColors: Record<SlaStatus, string> = {
  on_time: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  urgent: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const slaStatusLabels: Record<SlaStatus, string> = {
  on_time: "On Time",
  warning: "Warning",
  urgent: "Urgent",
  overdue: "Overdue",
};

export default function IsnadBank() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const limit = 25;
  const { toast } = useToast();

  const handleCreatePackage = () => {
    if (selectedForms.length === 0) return;
    const params = new URLSearchParams();
    params.set("selectedForms", selectedForms.join(","));
    navigate(`/isnad/packages?${params.toString()}`);
    toast({ title: `${selectedForms.length} forms selected for packaging. Click "New Package" to proceed.` });
  };

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  queryParams.set("status", "verified_filled");
  if (regionFilter !== "all") queryParams.set("regionId", regionFilter);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));

  const queryString = queryParams.toString();
  
  const { data, isLoading } = useQuery<{
    forms: IsnadFormWithDetails[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/isnad/forms-for-packaging", queryString],
    queryFn: () => fetch(`/api/isnad/forms-for-packaging?${queryString}`).then((r) => r.json()),
  });

  const { data: regions } = useQuery<Region[]>({
    queryKey: ["/api/reference/regions"],
  });

  const { data: stats } = useQuery<{
    totalReadyForPackaging: number;
    byRegion: Record<string, number>;
    bySlaStatus: Record<SlaStatus, number>;
  }>({
    queryKey: ["/api/isnad/bank/stats"],
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.forms) {
      setSelectedForms(data.forms.map((f) => f.id));
    } else {
      setSelectedForms([]);
    }
  };

  const handleSelectForm = (formId: string, checked: boolean) => {
    if (checked) {
      setSelectedForms((prev) => [...prev, formId]);
    } else {
      setSelectedForms((prev) => prev.filter((id) => id !== formId));
    }
  };

  const filteredForms = data?.forms?.filter((form) => {
    if (slaFilter !== "all" && form.slaStatus !== slaFilter) return false;
    return true;
  });

  const getSlaIcon = (slaStatus: SlaStatus | null) => {
    switch (slaStatus) {
      case "on_time":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const calculateApprovalProgress = (form: IsnadFormWithDetails) => {
    if (!form.departmentApprovals) return 0;
    const approved = form.departmentApprovals.filter((d) => d.status === "approved").length;
    return Math.round((approved / 19) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            ISNAD Bank
          </h1>
          <p className="text-muted-foreground">
            Pre-investable assets ready for executive package preparation
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            disabled={selectedForms.length === 0} 
            onClick={handleCreatePackage}
            data-testid="button-create-package"
          >
            <Package className="mr-2 h-4 w-4" />
            Create Package ({selectedForms.length})
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ready for Packaging</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-stat-ready">
              {stats?.totalReadyForPackaging ?? data?.total ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <CardDescription>On Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-stat-ontime">
              {stats?.bySlaStatus?.on_time ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <CardDescription>Warning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-stat-warning">
              {stats?.bySlaStatus?.warning ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <CardDescription>Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-stat-overdue">
              {(stats?.bySlaStatus?.urgent ?? 0) + (stats?.bySlaStatus?.overdue ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pre-Investable Assets</CardTitle>
          <CardDescription>
            Assets that have completed department review and are ready for executive packaging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by form code, asset name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]" data-testid="select-region">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions?.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={slaFilter} onValueChange={(v) => { setSlaFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]" data-testid="select-sla">
                  <SelectValue placeholder="SLA Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SLA Status</SelectItem>
                  <SelectItem value="on_time">On Time</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedForms.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-md">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {selectedForms.length} asset{selectedForms.length > 1 ? "s" : ""} selected for packaging
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedForms([])}
                className="ml-auto"
              >
                Clear Selection
              </Button>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredForms?.length === selectedForms.length && filteredForms?.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Form Code</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Approval Progress</TableHead>
                  <TableHead>SLA Status</TableHead>
                  <TableHead>Verified Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !filteredForms || filteredForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No assets ready for packaging
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredForms.map((form) => (
                    <TableRow key={form.id} data-testid={`row-form-${form.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedForms.includes(form.id)}
                          onCheckedChange={(checked) => handleSelectForm(form.id, !!checked)}
                          data-testid={`checkbox-form-${form.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-code-${form.id}`}>
                        {form.formCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{form.asset?.assetNameEn}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {form.asset?.assetCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {form.asset?.assetType === "land" ? (
                            <><LandPlot className="mr-1 h-3 w-3" /> Land</>
                          ) : (
                            <><Building2 className="mr-1 h-3 w-3" /> Building</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{form.asset?.region?.nameEn || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all" 
                              style={{ width: `${calculateApprovalProgress(form)}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {calculateApprovalProgress(form)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSlaIcon(form.slaStatus)}
                          <Badge className={slaStatusColors[form.slaStatus || "on_time"]}>
                            {slaStatusLabels[form.slaStatus || "on_time"]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {form.completedAt 
                          ? new Date(form.completedAt).toLocaleDateString() 
                          : new Date(form.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/isnad/forms/${form.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-${form.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
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
                  disabled={page === totalPages}
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
