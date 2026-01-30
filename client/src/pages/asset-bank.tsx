import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, Eye, EyeOff, Building2, LandPlot, MoreHorizontal, Download, FileSpreadsheet, X, PlayCircle, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, ClipboardList, MapPin, Send } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AssetWithDetails, Region, City, District } from "@/lib/schema";

export default function AssetBank() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const limit = 25;
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Start ISNAD wizard state
  const [isnadWizardOpen, setIsnadWizardOpen] = useState(false);
  const [isnadStep, setIsnadStep] = useState<1 | 2>(1);
  const [selectedAssetForIsnad, setSelectedAssetForIsnad] = useState<AssetWithDetails | null>(null);
  const [skipIntroNextTime, setSkipIntroNextTime] = useState(false);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (typeFilter && typeFilter !== "all") queryParams.set("assetType", typeFilter);
  if (visibilityFilter && visibilityFilter !== "all") queryParams.set("visibilityStatus", visibilityFilter);
  if (regionFilter && regionFilter !== "all") queryParams.set("regionId", regionFilter);
  if (selectedCities.length > 0) queryParams.set("cityIds", selectedCities.join(","));
  if (selectedDistricts.length > 0) queryParams.set("districtIds", selectedDistricts.join(","));
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

  const { data: cities } = useQuery<City[]>({
    queryKey: ["/api/reference/cities", regionFilter],
    queryFn: () => {
      const url = regionFilter && regionFilter !== "all" 
        ? `/api/reference/cities?regionId=${regionFilter}`
        : "/api/reference/cities";
      return fetch(url).then((r) => r.json());
    },
    enabled: true,
  });

  const { data: districts } = useQuery<District[]>({
    queryKey: ["/api/reference/districts", selectedCities],
    queryFn: () => {
      if (selectedCities.length === 0) return fetch("/api/reference/districts").then((r) => r.json());
      return fetch(`/api/reference/districts?cityIds=${selectedCities.join(",")}`).then((r) => r.json());
    },
    enabled: true,
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

  const handleCityToggle = (cityId: string) => {
    setSelectedCities((prev) => {
      const newCities = prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId];
      setPage(1);
      return newCities;
    });
  };

  const handleDistrictToggle = (districtId: string) => {
    setSelectedDistricts((prev) => {
      const newDistricts = prev.includes(districtId)
        ? prev.filter((id) => id !== districtId)
        : [...prev, districtId];
      setPage(1);
      return newDistricts;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setVisibilityFilter("all");
    setRegionFilter("all");
    setSelectedCities([]);
    setSelectedDistricts([]);
    setPage(1);
  };

  // Start ISNAD handlers
  const openIsnadWizard = (asset: AssetWithDetails) => {
    setSelectedAssetForIsnad(asset);
    setIsnadStep(1);
    setIsnadWizardOpen(true);
  };

  const closeIsnadWizard = () => {
    setIsnadWizardOpen(false);
    setSelectedAssetForIsnad(null);
    setIsnadStep(1);
  };

  const createIsnadMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const res = await apiRequest("POST", "/api/isnad/forms", {
        assetId,
        investmentPurpose: "educational_facility",
        estimatedValuation: 0,
        minInvestment: 0,
        maxInvestment: 0,
        preferredContractDuration: 5,
        returnOnInvestment: 0,
        structuralCondition: "good",
        utilitiesAvailability: "full",
        accessInfrastructure: "good",
        environmentalConsiderations: "none",
        zoningCompliance: "compliant",
        notes: "",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/isnad") ?? false) });
      toast({
        title: "ISNAD Request Submitted",
        description: "Your allocation request has been submitted successfully.",
      });
      closeIsnadWizard();
      navigate(`/isnad/forms/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit ISNAD request.",
        variant: "destructive",
      });
    },
  });

  const exportToXLS = () => {
    const exportParams = new URLSearchParams(queryParams);
    exportParams.set("limit", "1000");
    exportParams.set("page", "1");
    
    fetch(`/api/assets/bank?${exportParams.toString()}`)
      .then((r) => r.json())
      .then((result) => {
        const assets: AssetWithDetails[] = result.assets;
        
        const headers = ["Asset Code", "Name (EN)", "Name (AR)", "Type", "Region", "City", "District", "Total Area (sqm)", "Ownership", "Visible to Investors"];
        const rows = assets.map((asset) => [
          asset.assetCode,
          asset.assetNameEn,
          asset.assetNameAr,
          asset.assetType,
          asset.region?.nameEn || "",
          asset.city?.nameEn || "",
          asset.district?.nameEn || "",
          asset.totalArea.toString(),
          asset.ownershipType || "",
          asset.visibleToInvestors ? "Yes" : "No",
        ]);

        const csvContent = [
          headers.join("\t"),
          ...rows.map((row) => row.join("\t")),
        ].join("\n");

        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], { type: "application/vnd.ms-excel;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `asset-bank-export-${new Date().toISOString().split("T")[0]}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Successful",
          description: `Exported ${assets.length} assets to Excel file.`,
        });
      })
      .catch(() => {
        toast({
          title: "Export Failed",
          description: "Failed to export assets.",
          variant: "destructive",
        });
      });
  };

  const hasActiveFilters = search || typeFilter !== "all" || visibilityFilter !== "all" || regionFilter !== "all" || selectedCities.length > 0 || selectedDistricts.length > 0;

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
        <Button onClick={exportToXLS} variant="outline" data-testid="button-export">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
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
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="mr-1 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
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
              
              <Select value={regionFilter} onValueChange={(v) => { 
                setRegionFilter(v); 
                setSelectedCities([]); 
                setSelectedDistricts([]);
                setPage(1); 
              }}>
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[160px] justify-between" data-testid="select-cities">
                    {selectedCities.length > 0 
                      ? `${selectedCities.length} cities` 
                      : "Select Cities"}
                    <Download className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Select Cities</div>
                    {cities && cities.length > 0 ? (
                      cities.map((city) => (
                        <div key={city.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`city-${city.id}`}
                            checked={selectedCities.includes(city.id)}
                            onCheckedChange={() => handleCityToggle(city.id)}
                          />
                          <Label htmlFor={`city-${city.id}`} className="text-sm font-normal cursor-pointer">
                            {city.nameEn}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No cities available</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[160px] justify-between" data-testid="select-districts">
                    {selectedDistricts.length > 0 
                      ? `${selectedDistricts.length} districts` 
                      : "Select Districts"}
                    <Download className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Select Districts</div>
                    {districts && districts.length > 0 ? (
                      districts.map((district) => (
                        <div key={district.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`district-${district.id}`}
                            checked={selectedDistricts.includes(district.id)}
                            onCheckedChange={() => handleDistrictToggle(district.id)}
                          />
                          <Label htmlFor={`district-${district.id}`} className="text-sm font-normal cursor-pointer">
                            {district.nameEn}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No districts available</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {(selectedCities.length > 0 || selectedDistricts.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {selectedCities.map((cityId) => {
                  const city = cities?.find((c) => c.id === cityId);
                  return city ? (
                    <Badge key={cityId} variant="secondary" className="gap-1">
                      {city.nameEn}
                      <button onClick={() => handleCityToggle(cityId)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
                {selectedDistricts.map((districtId) => {
                  const district = districts?.find((d) => d.id === districtId);
                  return district ? (
                    <Badge key={districtId} variant="secondary" className="gap-1">
                      {district.nameEn}
                      <button onClick={() => handleDistrictToggle(districtId)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
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
                  <TableHead>Approved ISNAD</TableHead>
                  <TableHead>Investor Visibility</TableHead>
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
                ) : data?.assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                      <TableCell data-testid={`text-isnad-status-${asset.id}`}>
                        {asset.hasActiveIsnad ? (
                          <Badge variant="default" className="bg-emerald-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
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
                            <DropdownMenuItem onClick={() => openIsnadWizard(asset)} data-testid={`button-start-isnad-${asset.id}`}>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Start ISNAD
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/assets/bank/${asset.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Details
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

      {/* Start ISNAD Wizard Dialog */}
      <Dialog open={isnadWizardOpen} onOpenChange={(open) => !open && closeIsnadWizard()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeIsnadWizard}
                className="absolute right-4 top-4"
                data-testid="button-close-wizard"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex gap-8">
            {/* Left Sidebar - Steps */}
            <div className="w-48 flex-shrink-0">
              <div className="space-y-4">
                <div 
                  className={`flex items-center gap-3 cursor-pointer ${isnadStep === 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  onClick={() => setIsnadStep(1)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${isnadStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    1
                  </div>
                  <span>Introduction</span>
                </div>
                <div 
                  className={`flex items-center gap-3 cursor-pointer ${isnadStep === 2 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  onClick={() => setIsnadStep(2)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${isnadStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    2
                  </div>
                  <span>Summary</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {isnadStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Introduction</h2>
                    <p className="text-muted-foreground">Understand the property allocation process and review framework</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Welcome to ISNAD</h3>
                    <p className="text-sm leading-relaxed">
                      ISNAD digitizes and automates the multi-step property allocation process for investors inside 
                      Madares Business. This process replaces manual paper approvals with a fully digital, step-by-step 
                      workflow.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Step by step</h4>
                    <p className="text-sm text-muted-foreground">To create an allocation request for a land, follow these steps:</p>
                    
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        </div>
                        <div>
                          <p className="font-medium">1. Submit Request</p>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside pl-2">
                            <li>Begin by choosing a property from the Asset Bank</li>
                            <li>This selection triggers the ISNAD allocation workflow</li>
                            <li>By submitting this form, you initiate the allocation process that will be automatically routed across MOE departments and TBC for review and final approval</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
                        </div>
                        <div>
                          <p className="font-medium">2. Fill in & review ISNAD form</p>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside pl-2">
                            <li>Provide all required property information in the proper order for Investment & Partnerships Department</li>
                            <li>Ensure accuracy, as this data will be used across all approval steps</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <Eye className="h-5 w-5 text-primary mt-0.5" />
                        </div>
                        <div>
                          <p className="font-medium">3. Supervise & track</p>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside pl-2">
                            <li>Monitor the status of your request in real time</li>
                            <li>Use the ISNAD dashboard to see:
                              <ul className="list-disc list-inside pl-4 mt-1">
                                <li>Current stage of the request</li>
                                <li>Which department is reviewing it</li>
                                <li>Approval/rejection history</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">About the process</h4>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                      <li>One form, multiple approvals - your request is automatically routed to all required entities</li>
                      <li>Full visibility - track approval status at every stage</li>
                      <li>Audit log - view a complete history of actions and approvals</li>
                      <li>Final step - once approved, the property is officially classified as an Investable Asset</li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Please note</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Once you submit the request, it cannot be modified. Please review all information carefully before 
                        proceeding.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="skip-intro" 
                        checked={skipIntroNextTime}
                        onCheckedChange={(checked) => setSkipIntroNextTime(checked === true)}
                      />
                      <Label htmlFor="skip-intro" className="text-sm text-muted-foreground cursor-pointer">
                        Skip this introduction next time
                      </Label>
                    </div>
                    <Button onClick={() => setIsnadStep(2)} data-testid="button-start-allocation">
                      Start allocation request
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {isnadStep === 2 && selectedAssetForIsnad && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">Summary</h2>
                    <p className="text-muted-foreground">Check the asset information and review request details before sending to the next stakeholder.</p>
                  </div>

                  {/* Asset Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base">Asset information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Asset name</span>
                        <span className="font-medium">{selectedAssetForIsnad.assetNameEn}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Land code</span>
                        <span className="font-medium font-mono">{selectedAssetForIsnad.assetCode}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Asset size (m²)</span>
                        <span className="font-medium">{selectedAssetForIsnad.totalArea.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Asset type</span>
                        <span className="font-medium capitalize">{selectedAssetForIsnad.assetType}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Ownership</span>
                        <span className="font-medium capitalize">{selectedAssetForIsnad.ownershipType?.replace(/_/g, " ") || "-"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">{selectedAssetForIsnad.status?.replace(/_/g, " ") || "-"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b col-span-2">
                        <span className="text-muted-foreground">Visible to investors</span>
                        <span className="font-medium">{selectedAssetForIsnad.visibleToInvestors ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Asset Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-base">Asset location</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Region</span>
                        <span className="font-medium">{selectedAssetForIsnad.region?.nameEn || "-"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">City</span>
                        <span className="font-medium">{selectedAssetForIsnad.city?.nameEn || "-"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b col-span-2">
                        <span className="text-muted-foreground">District</span>
                        <span className="font-medium">{selectedAssetForIsnad.district?.nameEn || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Request Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base">Request details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Request date</span>
                        <span className="font-medium">{new Date().toISOString().split("T")[0]}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Requested by</span>
                        <span className="font-medium">Investment & Partnerships Dept.</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Ministry official</span>
                        <span className="font-medium">Investment & Partnerships Dept.</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Submission to</span>
                        <span className="font-medium">School Planning Dept.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" onClick={() => setIsnadStep(1)} data-testid="button-previous-step">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous step
                    </Button>
                    <Button 
                      onClick={() => createIsnadMutation.mutate(selectedAssetForIsnad.id)}
                      disabled={createIsnadMutation.isPending}
                      data-testid="button-send-request"
                    >
                      {createIsnadMutation.isPending ? "Sending..." : "Send request"}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
