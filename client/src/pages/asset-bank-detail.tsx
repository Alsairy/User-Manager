import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Eye, EyeOff, MapPin, Building2, LandPlot, Clock, CheckCircle2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { AssetWithDetails, AssetWorkflowHistory, AssetVisibilityHistory } from "@shared/schema";
import { workflowStageLabels, featureLabels, PredefinedFeature } from "@shared/schema";

export default function AssetBankDetail() {
  const { id } = useParams<{ id: string }>();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets/bank">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="visibility" data-testid="tab-visibility">Visibility History</TabsTrigger>
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

                {lifecycle?.workflowHistory.map((entry, index) => (
                  <div key={entry.id} className="flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      entry.action === "approved" 
                        ? "bg-green-100 dark:bg-green-900" 
                        : entry.action === "rejected"
                        ? "bg-red-100 dark:bg-red-900"
                        : "bg-blue-100 dark:bg-blue-900"
                    }`}>
                      <Clock className={`h-4 w-4 ${
                        entry.action === "approved"
                          ? "text-green-600"
                          : entry.action === "rejected"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`} />
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
    </div>
  );
}
