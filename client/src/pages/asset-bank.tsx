import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Eye, EyeOff, Building2, LandPlot, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AssetWithDetails, Region } from "@shared/schema";

export default function AssetBank() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 25;
  const { toast } = useToast();

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (typeFilter && typeFilter !== "all") queryParams.set("assetType", typeFilter);
  if (visibilityFilter && visibilityFilter !== "all") queryParams.set("visibilityStatus", visibilityFilter);
  if (regionFilter && regionFilter !== "all") queryParams.set("regionId", regionFilter);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));

  const queryString = queryParams.toString();
  const { data, isLoading } = useQuery<{
    assets: AssetWithDetails[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/assets/bank", queryString],
    queryFn: () => fetch(`/api/assets/bank?${queryString}`).then((r) => r.json()),
  });

  const { data: regions } = useQuery<Region[]>({
    queryKey: ["/api/reference/regions"],
  });

  const { data: stats } = useQuery<{
    completedAssets: number;
    visibleToInvestors: number;
    byAssetType: { land: number; building: number };
  }>({
    queryKey: ["/api/assets/dashboard/stats"],
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const res = await apiRequest("PUT", `/api/assets/bank/${id}/visibility`, { visible });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string).startsWith("/api/assets") });
      toast({
        title: "Visibility Updated",
        description: "Asset visibility has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update asset visibility.",
        variant: "destructive",
      });
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Asset Bank
          </h1>
          <p className="text-muted-foreground">
            Central repository of completed assets
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Completed</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-stat-completed">
              {stats?.completedAssets ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visible to Investors</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-stat-visible">
              {stats?.visibleToInvestors ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <LandPlot className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Land Assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-land">
              {stats?.byAssetType?.land ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardDescription>Building Assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-building">
              {stats?.byAssetType?.building ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Assets</CardTitle>
          <CardDescription>
            Manage visibility and access asset details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, name..."
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
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                </SelectContent>
              </Select>
              <Select value={visibilityFilter} onValueChange={(v) => { setVisibilityFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]" data-testid="select-visibility">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Total Area</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Investor Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No completed assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.assets.map((asset) => (
                    <TableRow key={asset.id} data-testid={`row-asset-${asset.id}`}>
                      <TableCell className="font-mono text-sm" data-testid={`text-code-${asset.id}`}>
                        {asset.assetCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`text-name-${asset.id}`}>
                            {asset.assetNameEn}
                          </div>
                          <div className="text-sm text-muted-foreground">{asset.assetNameAr}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {asset.assetType === "land" ? "Land" : "Building"}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.district?.nameEn || "-"}</TableCell>
                      <TableCell>{asset.totalArea.toLocaleString()} sqm</TableCell>
                      <TableCell className="text-sm">
                        {asset.ownershipType?.replace(/_/g, " ") || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={asset.visibleToInvestors}
                            onCheckedChange={(checked) => {
                              toggleVisibilityMutation.mutate({ id: asset.id, visible: checked });
                            }}
                            disabled={toggleVisibilityMutation.isPending}
                            data-testid={`switch-visibility-${asset.id}`}
                          />
                          {asset.visibleToInvestors ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${asset.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/assets/bank/${asset.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data?.total || 0)} of {data?.total || 0} assets
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
