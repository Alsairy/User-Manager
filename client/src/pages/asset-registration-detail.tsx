import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Building2, LandPlot, Clock, CheckCircle2, AlertCircle, FileText, Send } from "lucide-react";
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
import type { AssetWithDetails, AssetWorkflowHistory } from "@shared/schema";
import { workflowStageLabels, featureLabels, PredefinedFeature } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  completed: "Completed",
  rejected: "Rejected",
};

export default function AssetRegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: asset, isLoading } = useQuery<AssetWithDetails>({
    queryKey: ["/api/assets/registrations", id],
    queryFn: () => fetch(`/api/assets/registrations/${id}`).then((r) => r.json()),
  });

  const { data: workflowHistory } = useQuery<AssetWorkflowHistory[]>({
    queryKey: ["/api/assets/registrations", id, "history"],
    queryFn: () => fetch(`/api/assets/registrations/${id}/history`).then((r) => r.json()),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/assets/registrations/${id}/submit`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets/registrations", id] });
      toast({
        title: "Asset Submitted",
        description: "The asset has been submitted for review.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit asset for review.",
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
        <Link href="/assets/registrations">
          <Button variant="outline" className="mt-4">
            Back to Registrations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets/registrations">
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
            <Badge className={statusColors[asset.status]}>
              {statusLabels[asset.status]}
            </Badge>
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
        {asset.status === "draft" && (
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            data-testid="button-submit"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit for Review
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="workflow" data-testid="tab-workflow">Workflow History</TabsTrigger>
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
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={statusColors[asset.status]}>
                      {statusLabels[asset.status]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Stage</p>
                    <p>{asset.currentStage ? workflowStageLabels[asset.currentStage] : "-"}</p>
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
                    <p>{asset.region?.nameEn || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p>{asset.city?.nameEn || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">District</p>
                    <p>{asset.district?.nameEn || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Neighborhood</p>
                    <p>{asset.neighborhood || "-"}</p>
                  </div>
                  {asset.streetAddress && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Street Address</p>
                      <p>{asset.streetAddress}</p>
                    </div>
                  )}
                  {asset.latitude && asset.longitude && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Coordinates</p>
                      <p className="font-mono text-xs">{asset.latitude}, {asset.longitude}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Area & Land Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Area</p>
                    <p>{asset.totalArea?.toLocaleString() || "-"} m²</p>
                  </div>
                  {asset.builtUpArea && (
                    <div>
                      <p className="text-muted-foreground">Built-up Area</p>
                      <p>{asset.builtUpArea.toLocaleString()} m²</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Land Use Type</p>
                    <p className="capitalize">{asset.landUseType?.replace(/_/g, " ") || "-"}</p>
                  </div>
                  {asset.zoningClassification && (
                    <div>
                      <p className="text-muted-foreground">Zoning</p>
                      <p>{asset.zoningClassification}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Current Status</p>
                    <p className="capitalize">{asset.currentStatus?.replace(/_/g, " ") || "-"}</p>
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
                    <p className="capitalize">{asset.ownershipType?.replace(/_/g, " ") || "-"}</p>
                  </div>
                  {asset.deedNumber && (
                    <div>
                      <p className="text-muted-foreground">Deed Number</p>
                      <p className="font-mono">{asset.deedNumber}</p>
                    </div>
                  )}
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

          {asset.features && asset.features.length > 0 && (
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

          {asset.investmentPotential && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Investment Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{asset.investmentPotential}</p>
              </CardContent>
            </Card>
          )}

          {asset.verifiedBy && asset.verifiedBy.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {asset.verifiedBy.map((verification, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium capitalize">
                          {workflowStageLabels[verification.department as keyof typeof workflowStageLabels] || verification.department.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Verified by {verification.userName}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(verification.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {asset.rejectionReason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Rejection Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="capitalize">{asset.rejectionReason.replace(/_/g, " ")}</p>
                  </div>
                  {asset.rejectionJustification && (
                    <div>
                      <p className="text-sm text-muted-foreground">Justification</p>
                      <p>{asset.rejectionJustification}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{new Date(asset.createdAt).toLocaleDateString()}</p>
                </div>
                {asset.submittedAt && (
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p>{new Date(asset.submittedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {asset.completedAt && (
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p>{new Date(asset.completedAt).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p>{new Date(asset.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workflow History</CardTitle>
              <CardDescription>Track the approval process through each stage</CardDescription>
            </CardHeader>
            <CardContent>
              {workflowHistory && workflowHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflowHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {workflowStageLabels[entry.stage as keyof typeof workflowStageLabels] || entry.stage}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              entry.action === "approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : entry.action === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }
                          >
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.reviewerId || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.comments || "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(entry.actionDate).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No workflow history yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
