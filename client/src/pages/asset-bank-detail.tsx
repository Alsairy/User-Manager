import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { 
  ArrowLeft, Eye, EyeOff, MapPin, Building2, LandPlot, Clock, CheckCircle2, 
  FileText, Plus, FileSpreadsheet, Download, Briefcase, AlertCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { 
  AssetWithDetails, AssetWorkflowHistory, AssetVisibilityHistory, 
  IsnadFormWithDetails, ContractWithDetails, IsnadStatus, ContractStatus 
} from "@shared/schema";
import { 
  workflowStageLabels, featureLabels, PredefinedFeature, 
  isnadStatusLabels, contractStatusLabels 
} from "@shared/schema";

const isnadStatusColors: Record<IsnadStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_verification: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  verification_due: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  changes_requested: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  verified_filled: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  investment_agency_review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  in_package: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  pending_ceo: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  pending_minister: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const contractStatusColors: Record<ContractStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  incomplete: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  expiring: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  expired: "bg-red-100 text-red-800 dark:bg-red-100 dark:text-red-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AssetBankDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showInitiateDialog, setShowInitiateDialog] = useState(false);

  const { data: asset, isLoading } = useQuery<AssetWithDetails>({
    queryKey: ["/api/assets/bank", id],
  });

  const { data: lifecycle } = useQuery<{
    asset: AssetWithDetails;
    workflowHistory: AssetWorkflowHistory[];
    visibilityHistory: AssetVisibilityHistory[];
  }>({
    queryKey: ["/api/assets/bank", id, "lifecycle"],
    enabled: !!id,
  });

  const { data: isnadForms, isLoading: isnadLoading } = useQuery<IsnadFormWithDetails[]>({
    queryKey: ["/api/assets", id, "isnad-forms"],
    queryFn: () => fetch(`/api/assets/${id}/isnad-forms`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery<ContractWithDetails[]>({
    queryKey: ["/api/assets", id, "contracts"],
    queryFn: () => fetch(`/api/assets/${id}/contracts`).then((r) => r.json()),
    enabled: !!id,
  });

  const initiateIsnadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/isnad/forms", { assetId: id });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets", id, "isnad-forms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets/bank", id] });
      toast({
        title: "ISNAD Form Created",
        description: `ISNAD form ${data.formCode} has been initiated.`,
      });
      setShowInitiateDialog(false);
      navigate(`/isnad/forms/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate ISNAD form.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Asset not found</p>
        <Link href="/assets/bank">
          <Button variant="outline" className="mt-4">
            Back to Asset Bank
          </Button>
        </Link>
      </div>
    );
  }

  const canInitiateIsnad = !asset.hasActiveIsnad && asset.status === "completed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets/bank">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold" data-testid="text-asset-name">
              {asset.assetNameEn}
            </h1>
            <Badge variant="outline" className="font-mono">
              {asset.assetCode}
            </Badge>
            {asset.visibleToInvestors ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Eye className="mr-1 h-3 w-3" />
                Visible
              </Badge>
            ) : (
              <Badge variant="secondary">
                <EyeOff className="mr-1 h-3 w-3" />
                Hidden
              </Badge>
            )}
            {asset.hasActiveIsnad && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <FileText className="mr-1 h-3 w-3" />
                Active ISNAD
              </Badge>
            )}
            {asset.hasActiveContract && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <Briefcase className="mr-1 h-3 w-3" />
                Active Contract
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{asset.assetNameAr}</p>
        </div>
        <div className="flex items-center gap-2">
          {asset.assetType === "land" ? (
            <LandPlot className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="capitalize">{asset.assetType}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setShowInitiateDialog(true)}
          disabled={!canInitiateIsnad}
          data-testid="button-initiate-isnad"
        >
          <Plus className="mr-2 h-4 w-4" />
          Initiate ISNAD
        </Button>
        <Button variant="outline" data-testid="button-export-pdf">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="visibility" data-testid="tab-visibility">Visibility History</TabsTrigger>
          <TabsTrigger value="isnad" data-testid="tab-isnad">ISNAD History</TabsTrigger>
          <TabsTrigger value="contracts" data-testid="tab-contracts">Contracts</TabsTrigger>
          <TabsTrigger value="lifecycle" data-testid="tab-lifecycle">Lifecycle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Asset Code</p>
                    <p className="font-mono">{asset.assetCode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Asset Type</p>
                    <p className="capitalize">{asset.assetType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registration Mode</p>
                    <p className="capitalize">{asset.registrationMode?.replace(/_/g, " ") || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed Date</p>
                    <p>{asset.completedAt ? new Date(asset.completedAt).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Region</p>
                    <p>{asset.region?.nameEn || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p>{asset.city?.nameEn || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">District</p>
                    <p>{asset.district?.nameEn || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Neighborhood</p>
                    <p>{asset.neighborhood || "N/A"}</p>
                  </div>
                </div>
                {asset.latitude && asset.longitude && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-sm">Coordinates</p>
                    <p className="font-mono text-sm">{asset.latitude}, {asset.longitude}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Area</p>
                    <p>{asset.totalArea.toLocaleString()} sqm</p>
                  </div>
                  {asset.builtUpArea && (
                    <div>
                      <p className="text-muted-foreground">Built-up Area</p>
                      <p>{asset.builtUpArea.toLocaleString()} sqm</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Land Use Type</p>
                    <p className="capitalize">{asset.landUseType?.replace(/_/g, " ") || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Status</p>
                    <p className="capitalize">{asset.currentStatus?.replace(/_/g, " ") || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ownership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ownership Type</p>
                    <p className="capitalize">{asset.ownershipType?.replace(/_/g, " ") || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deed Number</p>
                    <p>{asset.deedNumber || "N/A"}</p>
                  </div>
                  {asset.deedDate && (
                    <div>
                      <p className="text-muted-foreground">Deed Date</p>
                      <p>{new Date(asset.deedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {asset.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {asset.features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                      {featureLabels[feature as PredefinedFeature] || feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {asset.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{asset.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visibility Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold">{asset.visibilityCount}</p>
                  <p className="text-muted-foreground text-sm">Times Visible</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{asset.totalExposureDays}</p>
                  <p className="text-muted-foreground text-sm">Total Exposure Days</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {asset.visibleToInvestors ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm">Currently Visible</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility History</CardTitle>
              <CardDescription>Track when this asset was visible to investors</CardDescription>
            </CardHeader>
            <CardContent>
              {lifecycle?.visibilityHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No visibility history</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lifecycle?.visibilityHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge className={entry.visibilityStatus === "visible" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-muted text-muted-foreground"
                          }>
                            {entry.visibilityStatus === "visible" ? "Visible" : "Hidden"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(entry.startDate).toLocaleString()}</TableCell>
                        <TableCell>{entry.endDate ? new Date(entry.endDate).toLocaleString() : "Current"}</TableCell>
                        <TableCell>{entry.durationDays !== null ? `${entry.durationDays} days` : "-"}</TableCell>
                        <TableCell>{entry.reason || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="isnad" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>ISNAD Workflow History</CardTitle>
                <CardDescription>All ISNAD workflows initiated for this asset</CardDescription>
              </div>
              <Button
                onClick={() => setShowInitiateDialog(true)}
                disabled={!canInitiateIsnad}
                size="sm"
                data-testid="button-initiate-isnad-tab"
              >
                <Plus className="mr-2 h-4 w-4" />
                Initiate ISNAD
              </Button>
            </CardHeader>
            <CardContent>
              {isnadLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !isnadForms || isnadForms.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No ISNAD workflows for this asset</p>
                  {canInitiateIsnad && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowInitiateDialog(true)}
                      data-testid="button-initiate-isnad-empty"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Start ISNAD Workflow
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Stage</TableHead>
                      <TableHead>Initiated</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isnadForms.map((form) => (
                      <TableRow key={form.id} data-testid={`row-isnad-${form.id}`}>
                        <TableCell className="font-mono text-sm">{form.formCode}</TableCell>
                        <TableCell>
                          <Badge className={isnadStatusColors[form.status]}>
                            {isnadStatusLabels[form.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {form.currentStage === "ip_initiation" && "I&P Initiation"}
                          {form.currentStage === "department_review" && "Department Review"}
                          {form.currentStage === "investment_agency" && "Investment Agency"}
                          {form.currentStage === "package_preparation" && "Package Preparation"}
                          {form.currentStage === "ceo_approval" && "CEO Approval"}
                          {form.currentStage === "minister_approval" && "Minister Approval"}
                        </TableCell>
                        <TableCell>{new Date(form.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {form.completedAt ? new Date(form.completedAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/isnad/forms/${form.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-isnad-${form.id}`}>
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>All contracts associated with this asset</CardDescription>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !contracts || contracts.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No contracts for this asset</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract ID</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                        <TableCell className="font-mono text-sm">{contract.contractCode}</TableCell>
                        <TableCell>{contract.investorNameEn}</TableCell>
                        <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(contract.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={contractStatusColors[contract.status]}>
                            {contractStatusLabels[contract.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/contracts/${contract.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-contract-${contract.id}`}>
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Lifecycle</CardTitle>
              <CardDescription>Complete history of asset registration and approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Registration Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {lifecycle?.workflowHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      entry.action === "approved" 
                        ? "bg-green-100 dark:bg-green-900" 
                        : entry.action === "rejected"
                        ? "bg-red-100 dark:bg-red-900"
                        : "bg-blue-100 dark:bg-blue-900"
                    }`}>
                      {entry.action === "approved" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : entry.action === "rejected" ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {workflowStageLabels[entry.stage]} - {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.actionDate).toLocaleString()}
                      </p>
                      {entry.comments && (
                        <p className="text-sm mt-1">{entry.comments}</p>
                      )}
                    </div>
                  </div>
                ))}

                {asset.completedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Asset Completed</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(asset.completedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showInitiateDialog} onOpenChange={setShowInitiateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate ISNAD Workflow</DialogTitle>
            <DialogDescription>
              This will create a new ISNAD form for the asset "{asset.assetNameEn}". 
              The form will be submitted to all 19 reviewing departments for parallel approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Review Process</p>
                <p className="text-muted-foreground">
                  The ISNAD workflow involves 19 departments (3 core + 16 regional) 
                  reviewing in parallel. A single rejection from any department 
                  will reject the entire form.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowInitiateDialog(false)}
              data-testid="button-cancel-initiate"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => initiateIsnadMutation.mutate()}
              disabled={initiateIsnadMutation.isPending}
              data-testid="button-confirm-initiate"
            >
              {initiateIsnadMutation.isPending ? "Creating..." : "Create ISNAD Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
