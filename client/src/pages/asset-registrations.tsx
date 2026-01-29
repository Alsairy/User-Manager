import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2, 
  Map,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  AlertCircle,
  Upload,
  FileText,
  Edit3,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { MapSelectionDialog } from "@/components/map-selection-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AssetWithDetails, AssetStatus, AssetType, Region, City, District } from "@shared/schema";
import { workflowStageLabels } from "@shared/schema";

const statusColors: Record<AssetStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  incomplete_bulk: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const statusLabels: Record<AssetStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  completed: "Completed",
  rejected: "Rejected",
  incomplete_bulk: "Incomplete",
};

const typeLabels: Record<AssetType, string> = {
  land: "Land",
  building: "Building",
};

const assetSubTypes = {
  land: ["Kindergarten Land", "Educational Land"],
  building: ["Kindergarten Building", "Educational Building", "Commercial Building", "Educational or Commercial Building", "Empty Building"],
};

const educationalDepartments = [
  "Education Department in Riyadh",
  "Education Department in Makkah",
  "Education Department in Asir",
  "Education Department in Madinah",
  "Education Department in Al-Jouf",
  "Education Department in the Northern Borders",
  "Education Department in Tabuk",
  "Education Department in the Eastern",
  "Education Department in Jazan",
  "Education Department in Al-Baha",
  "Education Department in Najran",
  "Education Department in Al-Qassim",
  "Education Department in Hail",
  "Education Department in Jeddah",
  "Education Department in Taif",
  "Education Department in Al-Ahsa",
];

const classifications = [
  "For Sale",
  "For Lease",
  "Build-Operate-Transfer",
  "Joint Venture",
];

const investorFeatures = [
  { id: "high_demand", label: "High demand among investors" },
  { id: "growing_sector", label: "Growing educational sector" },
  { id: "stable_value", label: "Stable market value" },
  { id: "strategic_location", label: "Strategic location" },
  { id: "high_utilization", label: "High utilization rate" },
  { id: "compliant_standards", label: "Compliant with industry standards" },
  { id: "accessible_transport", label: "Accessible transportation links" },
];

type WizardStep = 1 | 2 | 3;
type RegistrationMode = "create" | "digitize";

interface AssetFormData {
  assetName: string;
  assetSize: string;
  assetType: AssetType | "";
  assetSubType: string;
  educationalDepartment: string;
  classification: string;
  documentComment: string;
  regionId: string;
  cityId: string;
  districtId: string;
  nationalAddress: string;
  latitude: string;
  longitude: string;
  locationComment: string;
  assetDescription: string;
  selectedFeatures: string[];
  featuresComment: string;
}

const initialFormData: AssetFormData = {
  assetName: "",
  assetSize: "",
  assetType: "",
  assetSubType: "",
  educationalDepartment: "",
  classification: "",
  documentComment: "",
  regionId: "",
  cityId: "",
  districtId: "",
  nationalAddress: "",
  latitude: "",
  longitude: "",
  locationComment: "",
  assetDescription: "",
  selectedFeatures: [],
  featuresComment: "",
};

export default function AssetRegistrations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 25;
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>("create");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [skipIntro, setSkipIntro] = useState(false);
  const [formData, setFormData] = useState<AssetFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<"info" | "location" | "features">("info");
  const [showMapDialog, setShowMapDialog] = useState(false);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
  if (typeFilter && typeFilter !== "all") queryParams.set("assetType", typeFilter);
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
    queryKey: ["/api/assets/registrations", queryString],
    queryFn: () => fetch(`/api/assets/registrations?${queryString}`).then((r) => r.json()),
  });

  const { data: regions } = useQuery<Region[]>({
    queryKey: ["/api/reference/regions"],
  });

  const { data: cities } = useQuery<City[]>({
    queryKey: ["/api/reference/cities", formData.regionId],
    queryFn: () => fetch(`/api/reference/cities?regionId=${formData.regionId}`).then((r) => r.json()),
    enabled: !!formData.regionId,
  });

  const { data: districts } = useQuery<District[]>({
    queryKey: ["/api/reference/districts", formData.cityId],
    queryFn: () => fetch(`/api/reference/districts?cityId=${formData.cityId}`).then((r) => r.json()),
    enabled: !!formData.cityId,
  });

  const { data: stats } = useQuery<{
    totalAssets: number;
    draftAssets: number;
    inReviewAssets: number;
    completedAssets: number;
    rejectedAssets: number;
  }>({
    queryKey: ["/api/assets/dashboard/stats"],
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData) => {
      const areaValue = parseFloat(data.assetSize);
      const latValue = data.latitude ? parseFloat(data.latitude) : null;
      const lngValue = data.longitude ? parseFloat(data.longitude) : null;

      if (isNaN(areaValue) || areaValue <= 0) {
        throw new Error("Invalid asset size");
      }
      if (latValue !== null && isNaN(latValue)) {
        throw new Error("Invalid latitude");
      }
      if (lngValue !== null && isNaN(lngValue)) {
        throw new Error("Invalid longitude");
      }

      const payload = {
        assetNameEn: data.assetName.trim(),
        assetNameAr: null,
        assetType: data.assetType || "land",
        regionId: data.regionId,
        cityId: data.cityId,
        districtId: data.districtId,
        totalArea: areaValue,
        latitude: latValue,
        longitude: lngValue,
        description: data.assetDescription?.trim() || null,
        features: data.selectedFeatures,
        customFeatures: [
          data.assetSubType,
          data.educationalDepartment,
          data.classification,
        ].filter(Boolean).join(", ") || null,
        administrativeNotes: [
          data.documentComment,
          data.locationComment,
          data.featuresComment,
        ].filter(Boolean).join("\n\n") || null,
        streetAddress: data.nationalAddress?.trim() || null,
        registrationMode: registrationMode === "create" ? "direct" : "approval_cycle",
      };
      const res = await apiRequest("POST", "/api/assets/registrations", payload);
      return res.json();
    },
    onSuccess: (newAsset) => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0]?.toString().includes("/api/assets") ?? false) });
      toast({
        title: "Asset Registered",
        description: "Your asset registration has been submitted successfully.",
      });
      closeWizard();
      navigate(`/assets/registrations/${newAsset.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const openAddModal = () => {
    setShowAddModal(true);
    setRegistrationMode("create");
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const startWizard = () => {
    setShowAddModal(false);
    setShowWizard(true);
    setWizardStep(1);
    setFormData(initialFormData);
    setActiveTab("info");
  };

  const closeWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setFormData(initialFormData);
    setActiveTab("info");
  };

  const handleFormChange = (field: keyof AssetFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "regionId") {
      setFormData((prev) => ({ ...prev, cityId: "", districtId: "" }));
    }
    if (field === "cityId") {
      setFormData((prev) => ({ ...prev, districtId: "" }));
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(feature)
        ? prev.selectedFeatures.filter((f) => f !== feature)
        : [...prev.selectedFeatures, feature],
    }));
  };

  const canProceedToSummary = () => {
    return (
      formData.assetName.trim() !== "" &&
      formData.assetSize.trim() !== "" &&
      formData.assetType !== "" &&
      formData.regionId !== "" &&
      formData.cityId !== "" &&
      formData.districtId !== ""
    );
  };

  const getSelectedRegion = () => regions?.find((r) => r.id === formData.regionId);
  const getSelectedCity = () => cities?.find((c) => c.id === formData.cityId);
  const getSelectedDistrict = () => districts?.find((d) => d.id === formData.districtId);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const filteredStats = {
    all: data?.total ?? 0,
    inReview: stats?.inReviewAssets ?? 0,
    approved: stats?.completedAssets ?? 0,
    rejected: stats?.rejectedAssets ?? 0,
    incomplete: stats?.draftAssets ?? 0,
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && data?.assets) {
      setSelectedAssets(data.assets.map(a => a.id));
    } else {
      setSelectedAssets([]);
    }
  };

  const handleSelectAsset = (assetId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, assetId]);
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== assetId));
      setSelectAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Asset registration <span className="text-muted-foreground">({data?.total ?? 0})</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button onClick={openAddModal} className="bg-primary" data-testid="button-add-asset">
            <Plus className="mr-2 h-4 w-4" />
            Add a new asset
          </Button>
          <Button variant="outline" data-testid="button-upload-excel">
            <Upload className="mr-2 h-4 w-4" />
            Upload assets (Excel)
          </Button>
          <Button variant="outline" data-testid="button-view-map">
            <Map className="mr-2 h-4 w-4" />
            View map
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for assets"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Button variant="outline" data-testid="button-search">
          Search
        </Button>
        <div className="flex-1" />
        <Button variant="outline" data-testid="button-filters">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">You can search by: Asset name & Land code.</p>

      <div className="flex items-center gap-1 border-b">
        <button
          onClick={() => { setStatusFilter("all"); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "all" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-all"
        >
          All
          <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
            {filteredStats.all}
          </Badge>
        </button>
        <button
          onClick={() => { setStatusFilter("in_review"); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "in_review" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-in-review"
        >
          In review
          <span className="text-muted-foreground">{filteredStats.inReview}</span>
        </button>
        <button
          onClick={() => { setStatusFilter("completed"); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "completed" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-approved"
        >
          Approved
          <span className="text-muted-foreground">{filteredStats.approved}</span>
        </button>
        <button
          onClick={() => { setStatusFilter("rejected"); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "rejected" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-rejected"
        >
          Rejected
          <span className="text-muted-foreground">{filteredStats.rejected}</span>
        </button>
        <button
          onClick={() => { setStatusFilter("incomplete_bulk"); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "incomplete_bulk" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-incomplete"
        >
          Incomplete
          <span className="text-muted-foreground">{filteredStats.incomplete}</span>
        </button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all-header"
                />
              </TableHead>
              <TableHead>Request number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified by</TableHead>
              <TableHead>Asset name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Land code</TableHead>
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
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              data?.assets.map((asset) => (
                <TableRow key={asset.id} data-testid={`row-asset-${asset.id}`}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedAssets.includes(asset.id)}
                      onCheckedChange={(checked) => handleSelectAsset(asset.id, !!checked)}
                      data-testid={`checkbox-asset-${asset.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/assets/registrations/${asset.id}`} className="text-primary hover:underline font-medium">
                      {asset.assetCode}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[asset.status]}>
                      {statusLabels[asset.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {asset.currentStage ? (
                        <>
                          <div className="font-medium">{workflowStageLabels[asset.currentStage]}</div>
                          <div className="text-muted-foreground text-xs">Verification Dept.</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/assets/registrations/${asset.id}`} className="text-primary hover:underline">
                      {asset.assetNameEn || `${asset.assetType === "land" ? "Land" : "Building"} in ${asset.city?.nameEn || "N/A"}`}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {typeLabels[asset.assetType]}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {asset.assetCode}
                  </TableCell>
                  <TableCell className="text-right">
                    {asset.status === "incomplete_bulk" || asset.status === "draft" ? (
                      <Link href={`/assets/registrations/${asset.id}`}>
                        <Button variant="default" size="sm" className="bg-primary" data-testid={`button-complete-request-${asset.id}`}>
                          {asset.status === "draft" ? "Continue Editing" : "Complete request"}
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/assets/registrations/${asset.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-check-details-${asset.id}`}>
                          Check details
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={selectAll}
            onCheckedChange={handleSelectAll}
            data-testid="checkbox-select-all-footer"
          />
          <span className="text-sm text-muted-foreground">Select all assets ({data?.total || 0})</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
              <SelectTrigger className="w-16" data-testid="select-items-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages || 1}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage(1)}
                data-testid="button-first-page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                data-testid="button-last-page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card 
        className="mt-4 cursor-pointer hover-elevate" 
        onClick={() => { setStatusFilter("draft"); setPage(1); }}
        data-testid="card-drafts"
      >
        <CardContent className="flex items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Edit3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Drafts <span className="text-muted-foreground font-normal">({filteredStats.incomplete})</span></h3>
            <p className="text-sm text-muted-foreground">Check your asset registration drafts and continue with the registration process.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Add a New or Existing Asset Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a New or Existing Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Select one of the options below to proceed with adding a new asset to the Asset Bank.
            </p>
            <p className="text-sm font-medium">Select one option*</p>
            <RadioGroup value={registrationMode} onValueChange={(v) => setRegistrationMode(v as RegistrationMode)}>
              <div className="flex items-start gap-3 p-4 border rounded-lg hover-elevate cursor-pointer" onClick={() => setRegistrationMode("create")}>
                <RadioGroupItem value="create" id="create" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="create" className="font-medium cursor-pointer">Create a new asset</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a completely new asset by providing its details. A unique land code will be generated automatically by the system.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg hover-elevate cursor-pointer" onClick={() => setRegistrationMode("digitize")}>
                <RadioGroupItem value="digitize" id="digitize" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="digitize" className="font-medium cursor-pointer">Digitize an existing asset</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select this option to upload and digitize an asset that already exists in the records. Use this when converting physical or previously registered assets into digital form.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddModal}>Cancel</Button>
            <Button onClick={startWizard} data-testid="button-continue">Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Registration Wizard */}
      <Dialog open={showWizard} onOpenChange={(open) => !open && closeWizard()}>
        <DialogContent className="max-w-5xl h-[90vh] max-h-[95vh] flex flex-row overflow-hidden p-0">
            {/* Left Sidebar - Steps */}
            <div className="w-56 bg-muted/30 p-6 border-r flex-shrink-0">
              <div className="space-y-6">
                <div 
                  className={`flex items-center gap-3 cursor-pointer ${wizardStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setWizardStep(1)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${wizardStep === 1 ? "bg-primary text-primary-foreground" : wizardStep > 1 ? "bg-primary/20 text-primary" : "bg-muted"}`}>
                    {wizardStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
                  </div>
                  <span className={wizardStep === 1 ? "font-medium" : ""}>Introduction</span>
                </div>
                <div 
                  className={`flex items-center gap-3 cursor-pointer ${wizardStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}
                  onClick={() => wizardStep > 1 && setWizardStep(2)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${wizardStep === 2 ? "bg-primary text-primary-foreground" : wizardStep > 2 ? "bg-primary/20 text-primary" : "bg-muted"}`}>
                    {wizardStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
                  </div>
                  <span className={wizardStep === 2 ? "font-medium" : ""}>Asset details</span>
                </div>
                <div 
                  className={`flex items-center gap-3 cursor-pointer ${wizardStep === 3 ? "text-foreground" : "text-muted-foreground"}`}
                  onClick={() => wizardStep > 2 && setWizardStep(3)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${wizardStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    3
                  </div>
                  <span className={wizardStep === 3 ? "font-medium" : ""}>Summary</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-end p-4 border-b">
                <Button variant="ghost" onClick={closeWizard} data-testid="button-cancel-wizard">
                  <X className="mr-2 h-4 w-4" />
                  Cancel and close
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {/* Step 1: Introduction */}
                {wizardStep === 1 && (
                  <div className="max-w-2xl space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">Introduction</h2>
                      <p className="text-muted-foreground">Understand the asset registration process and review framework</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary">Welcome to Asset registration</h3>
                      <p className="text-sm leading-relaxed">
                        This form digitizes and automates the multi-step asset registration process for investors in 
                        Madares Business. It replaces manual paper approvals with a fully digital, guided workflow.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Step by step</h4>
                      <p className="text-sm text-muted-foreground">To register an asset in Asset Bank, follow these steps:</p>
                      
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                          </div>
                          <div>
                            <p className="font-medium">1. Initiate & complete the registration form</p>
                            <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside pl-2">
                              <li>Select "Add a new asset" button and choose Create a new asset</li>
                              <li>Open the asset registration form</li>
                              <li>Provide all required asset information and upload supporting documents</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
                          </div>
                          <div>
                            <p className="font-medium">2. Review & submit the request</p>
                            <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside pl-2">
                              <li>Carefully review all fields. The submitted data will be used across all approval steps.</li>
                              <li>Submit the form.</li>
                              <li>The request will automatically be routed to the relevant MOE departments and TBC for review and final approval.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <Eye className="h-5 w-5 text-primary mt-0.5" />
                          </div>
                          <div>
                            <p className="font-medium">3. Monitor & track</p>
                            <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside pl-2">
                              <li>Track the status of your request in real time through the Asset Registration Dashboard.</li>
                              <li>You will be notified once the registration process is completed.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
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

                    <div className="space-y-3">
                      <h4 className="font-semibold">About the process</h4>
                      <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li>One form, multiple approvals - your request is automatically routed to all required entities.</li>
                        <li>Full visibility - track approval status at every stage.</li>
                        <li>Audit log - view a complete history of actions and approvals.</li>
                        <li>Final step - once approved, the property is officially classified as an Asset in Asset Bank.</li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="skip-intro" 
                          checked={skipIntro}
                          onCheckedChange={(checked) => setSkipIntro(checked === true)}
                        />
                        <Label htmlFor="skip-intro" className="text-sm text-muted-foreground cursor-pointer">
                          Skip this introduction next time
                        </Label>
                      </div>
                      <Button onClick={() => setWizardStep(2)} data-testid="button-start-process">
                        Start the process
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Asset Details */}
                {wizardStep === 2 && (
                  <div className="max-w-3xl space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">Add a new asset</h2>
                      <p className="text-muted-foreground">Provide the key information about the asset, including its details and location</p>
                    </div>

                    {/* Asset Information Section */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Asset information</h3>
                        <p className="text-sm text-muted-foreground">Enter asset details and add documents if available.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <Label>Asset name*</Label>
                          <Input
                            placeholder="Provide asset name"
                            value={formData.assetName}
                            onChange={(e) => handleFormChange("assetName", e.target.value)}
                            data-testid="input-asset-name"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter a name using English or Arabic letters. Spaces, hyphens (-), apostrophes ('), and periods (.) are allowed.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Asset size (m²)*</Label>
                          <Input
                            placeholder="Provide asset size"
                            value={formData.assetSize}
                            onChange={(e) => handleFormChange("assetSize", e.target.value)}
                            data-testid="input-asset-size"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Asset type*</Label>
                          <Select value={formData.assetType} onValueChange={(v) => handleFormChange("assetType", v)}>
                            <SelectTrigger data-testid="select-asset-type">
                              <SelectValue placeholder="Select asset type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="land">Land</SelectItem>
                              <SelectItem value="building">Building</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Asset sub-type*</Label>
                          <Select 
                            value={formData.assetSubType} 
                            onValueChange={(v) => handleFormChange("assetSubType", v)}
                            disabled={!formData.assetType}
                          >
                            <SelectTrigger data-testid="select-asset-subtype">
                              <SelectValue placeholder="Select asset sub-type" />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.assetType && assetSubTypes[formData.assetType]?.map((subType) => (
                                <SelectItem key={subType} value={subType}>{subType}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Asset sub-type depends on the selected Asset type.</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Educational department*</Label>
                          <Select value={formData.educationalDepartment} onValueChange={(v) => handleFormChange("educationalDepartment", v)}>
                            <SelectTrigger data-testid="select-edu-dept">
                              <SelectValue placeholder="Select educational department" />
                            </SelectTrigger>
                            <SelectContent>
                              {educationalDepartments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Classification</Label>
                          <Select value={formData.classification} onValueChange={(v) => handleFormChange("classification", v)}>
                            <SelectTrigger data-testid="select-classification">
                              <SelectValue placeholder="Select classification" />
                            </SelectTrigger>
                            <SelectContent>
                              {classifications.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Attach documents <span className="text-muted-foreground">(optional)</span></Label>
                          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPG, JPEG or PNG up to 10MB</p>
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload file
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Your comment <span className="text-muted-foreground">(optional)</span></Label>
                          <Textarea
                            placeholder="Provide additional context or comments regarding information about the asset."
                            value={formData.documentComment}
                            onChange={(e) => handleFormChange("documentComment", e.target.value)}
                            className="min-h-[100px]"
                            data-testid="textarea-document-comment"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Asset Location Section */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Asset location</h3>
                        <p className="text-sm text-muted-foreground">Enter asset location and add a photo if available.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <Label>Region*</Label>
                          <Select value={formData.regionId} onValueChange={(v) => handleFormChange("regionId", v)}>
                            <SelectTrigger data-testid="select-region">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {regions?.map((region) => (
                                <SelectItem key={region.id} value={region.id}>{region.nameEn}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>City*</Label>
                          <Select 
                            value={formData.cityId} 
                            onValueChange={(v) => handleFormChange("cityId", v)}
                            disabled={!formData.regionId}
                          >
                            <SelectTrigger data-testid="select-city">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {cities?.map((city) => (
                                <SelectItem key={city.id} value={city.id}>{city.nameEn}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!formData.regionId && <p className="text-xs text-muted-foreground">Select region first</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>District*</Label>
                          <Select 
                            value={formData.districtId} 
                            onValueChange={(v) => handleFormChange("districtId", v)}
                            disabled={!formData.cityId || (districts?.length === 0)}
                          >
                            <SelectTrigger data-testid="select-district">
                              <SelectValue placeholder={!formData.cityId ? "Select city first" : districts?.length === 0 ? "No districts available" : "Select district"} />
                            </SelectTrigger>
                            <SelectContent>
                              {districts?.map((district) => (
                                <SelectItem key={district.id} value={district.id}>{district.nameEn}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!formData.cityId && <p className="text-xs text-muted-foreground">Select city first</p>}
                          {formData.cityId && districts?.length === 0 && <p className="text-xs text-muted-foreground">No districts defined for this city</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Short National Address*</Label>
                          <Input
                            placeholder="Enter Short National Address"
                            value={formData.nationalAddress}
                            onChange={(e) => handleFormChange("nationalAddress", e.target.value)}
                            data-testid="input-national-address"
                          />
                          <p className="text-xs text-muted-foreground">Enter 4 letters followed by 4 numbers (e.g., RRRD2929)</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Latitude*</Label>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              className="text-primary p-0 h-auto"
                              onClick={() => setShowMapDialog(true)}
                              data-testid="button-check-map-lat"
                            >
                              Check on map
                            </Button>
                          </div>
                          <Input
                            placeholder="Enter coordinates"
                            value={formData.latitude}
                            onChange={(e) => handleFormChange("latitude", e.target.value)}
                            data-testid="input-latitude"
                          />
                          <p className="text-xs text-muted-foreground">Enter latitude in decimal format. Values south of the equator must have a '-' in front.</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Longitude*</Label>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              className="text-primary p-0 h-auto"
                              onClick={() => setShowMapDialog(true)}
                              data-testid="button-check-map-lng"
                            >
                              Check on map
                            </Button>
                          </div>
                          <Input
                            placeholder="Enter coordinates"
                            value={formData.longitude}
                            onChange={(e) => handleFormChange("longitude", e.target.value)}
                            data-testid="input-longitude"
                          />
                          <p className="text-xs text-muted-foreground">Enter longitude in decimal format. Values west of the prime meridian must have a '-' in front.</p>
                        </div>

                        <MapSelectionDialog
                          open={showMapDialog}
                          onOpenChange={setShowMapDialog}
                          initialLat={parseFloat(formData.latitude)}
                          initialLng={parseFloat(formData.longitude)}
                          onConfirm={(lat, lng) => {
                            handleFormChange("latitude", lat.toString());
                            handleFormChange("longitude", lng.toString());
                          }}
                        />

                        <div className="space-y-2">
                          <Label>Attach aerial photograph <span className="text-muted-foreground">(optional)</span></Label>
                          <p className="text-xs text-muted-foreground">JPG, JPEG or PNG up to 10MB</p>
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload file
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Your comment <span className="text-muted-foreground">(optional)</span></Label>
                          <Textarea
                            placeholder="Provide additional context or comments regarding location."
                            value={formData.locationComment}
                            onChange={(e) => handleFormChange("locationComment", e.target.value)}
                            className="min-h-[100px]"
                            data-testid="textarea-location-comment"
                          />
                          <p className="text-xs text-muted-foreground text-right">0/1000</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Features Section */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Features</h3>
                        <p className="text-sm text-muted-foreground">Highlight the key capabilities and characteristics of this asset.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <Label>Asset description <span className="text-muted-foreground">(optional)</span></Label>
                          <Textarea
                            placeholder="Enter a brief description of the asset"
                            value={formData.assetDescription}
                            onChange={(e) => handleFormChange("assetDescription", e.target.value)}
                            className="min-h-[100px]"
                            data-testid="textarea-description"
                          />
                          <p className="text-xs text-muted-foreground text-right">0/400</p>
                        </div>

                        <div className="space-y-3">
                          <Label>Select features <span className="text-muted-foreground">(optional)</span></Label>
                          <div className="space-y-2">
                            {investorFeatures.map((feature) => (
                              <div key={feature.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={feature.id}
                                  checked={formData.selectedFeatures.includes(feature.id)}
                                  onCheckedChange={() => toggleFeature(feature.id)}
                                />
                                <Label htmlFor={feature.id} className="text-sm cursor-pointer font-normal">
                                  {feature.label}
                                </Label>
                              </div>
                            ))}
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="other"
                                checked={formData.selectedFeatures.includes("other")}
                                onCheckedChange={() => toggleFeature("other")}
                              />
                              <Label htmlFor="other" className="text-sm cursor-pointer font-normal">Other</Label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Your comment <span className="text-muted-foreground">(optional)</span></Label>
                          <Textarea
                            placeholder="Provide additional context or comments regarding features."
                            value={formData.featuresComment}
                            onChange={(e) => handleFormChange("featuresComment", e.target.value)}
                            className="min-h-[100px]"
                            data-testid="textarea-features-comment"
                          />
                          <p className="text-xs text-muted-foreground text-right">0/1000</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t">
                      <Button variant="outline" onClick={() => setWizardStep(1)} data-testid="button-previous-step">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous step
                      </Button>
                      <Button 
                        onClick={() => setWizardStep(3)} 
                        disabled={!canProceedToSummary()}
                        data-testid="button-go-to-summary"
                      >
                        Go to summary
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Summary */}
                {wizardStep === 3 && (
                  <div className="max-w-3xl space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">Summary</h2>
                      <p className="text-muted-foreground">Review the asset information before submitting</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Asset Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Asset name</span>
                            <span className="font-medium">{formData.assetName || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Asset size (m²)</span>
                            <span className="font-medium">{formData.assetSize || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Asset type</span>
                            <span className="font-medium capitalize">{formData.assetType || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Asset sub-type</span>
                            <span className="font-medium">{formData.assetSubType || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Educational department</span>
                            <span className="font-medium">{formData.educationalDepartment || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Classification</span>
                            <span className="font-medium">{formData.classification || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Asset Location</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Region</span>
                            <span className="font-medium">{getSelectedRegion()?.nameEn || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">City</span>
                            <span className="font-medium">{getSelectedCity()?.nameEn || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">District</span>
                            <span className="font-medium">{getSelectedDistrict()?.nameEn || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">National Address</span>
                            <span className="font-medium">{formData.nationalAddress || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Latitude</span>
                            <span className="font-medium font-mono">{formData.latitude || "-"}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Longitude</span>
                            <span className="font-medium font-mono">{formData.longitude || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Features</h3>
                        <div className="space-y-2 text-sm">
                          {formData.assetDescription && (
                            <div className="py-2 border-b">
                              <span className="text-muted-foreground">Description:</span>
                              <p className="mt-1">{formData.assetDescription}</p>
                            </div>
                          )}
                          {formData.selectedFeatures.length > 0 && (
                            <div className="py-2 border-b">
                              <span className="text-muted-foreground">Selected features:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {formData.selectedFeatures.map((f) => {
                                  const feature = investorFeatures.find((inv) => inv.id === f);
                                  return (
                                    <Badge key={f} variant="secondary">
                                      {feature?.label || f}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t">
                      <Button variant="outline" onClick={() => setWizardStep(2)} data-testid="button-back-to-details">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to details
                      </Button>
                      <Button 
                        onClick={() => createAssetMutation.mutate(formData)}
                        disabled={createAssetMutation.isPending}
                        data-testid="button-submit-registration"
                      >
                        {createAssetMutation.isPending ? "Submitting..." : "Submit registration"}
                        <ArrowRight className="ml-2 h-4 w-4" />
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
